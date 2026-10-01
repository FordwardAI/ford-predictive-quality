"""Escenarios de señales de proceso INVENTADAS, condicionadas a etiquetas; no prueba de impacto real."""
import argparse
import collections
import hashlib
import json
import types
from pathlib import Path

import numpy as np
import scipy.sparse as sp

from . import columnas
from .cupo import diferencia, fuente_completa, metricas, remuestreos, simular, version_codigo
from .datos import cargar
from .precision import BLOQUES_SELECCION, CONFIRMACION, _unir
from .referencias import TasaFija

SEMILLAS = (1, 2, 3, 4, 5)
MODELOS = ("logistica", "rf", "lightgbm")
GRUPOS = {
    "fisicas": ("torque", "angulo", "geometria", "soldadura", "adhesivo"),
    "linea": ("permanencia", "interrupciones", "secuencia", "turno"),
    "componentes": ("desviacion_lote", "uso_herramental"),
    "ambiente": ("temperatura", "humedad"),
}
ESCENARIOS = {
    "sin_senal": {"separacion": 0., "ruido": .5, "cobertura": 1.},
    "debil": {"separacion": .5, "ruido": .5, "cobertura": 1.},
    "moderada": {"separacion": 1., "ruido": .5, "cobertura": 1.},
    "fuerte": {"separacion": 2., "ruido": .5, "cobertura": 1.},
    "fuerte_degradada": {"separacion": 2., "ruido": 2., "cobertura": .5},
    "fuerte_invertida": {"separacion": 2., "ruido": .5, "cobertura": 1., "invertir_desde": 175},
}


def generar(y, dias, escenario, semilla):
    """Generador de sensibilidad, NO función de predicción: lee y deliberadamente para fijar la señal supuesta."""
    y, dias = np.asarray(y), np.asarray(dias)
    if y.ndim != 1 or dias.shape != y.shape or not len(y) or not np.isin(y, [0, 1]).all():
        raise ValueError("Etiquetas binarias y días de igual tamaño requeridos")
    if (dias >= 195).any():
        raise ValueError("La simulación no admite Día >=195")
    d, ruido, cobertura = (escenario[k] for k in ("separacion", "ruido", "cobertura"))
    if d < 0 or ruido < 0 or not 0 <= cobertura <= 1 or not np.isfinite([d, ruido, cobertura]).all():
        raise ValueError("Escenario inválido")
    rng = np.random.default_rng(semilla)
    signo = np.where(dias >= escenario.get("invertir_desde", 195), -1., 1.)
    latentes = rng.normal(size=(len(y), 4)) + (d / 2 * y * signo)[:, None]
    # ponytail: exposición independiente por VIN; no reproduce lotes/turnos compartidos. Modelar esos grupos con datos reales.
    grupos = np.array([i for i, campos in enumerate(GRUPOS.values()) for _ in campos])
    x = latentes[:, grupos] + ruido * rng.normal(size=(len(y), len(grupos)))
    disponible = rng.random(len(y)) < cobertura
    x[~disponible] = 0.
    return np.column_stack((x, ~disponible)), disponible


def particiones(vins, inicio, fin):
    if inicio > fin or fin >= 195:
        raise ValueError("Bloque fuera del experimento")
    train = [i for i, v in enumerate(vins) if v.dia <= inicio - 6]
    evaluados = [i for i, v in enumerate(vins) if inicio <= v.dia <= fin]
    return np.array(train), np.array(evaluados)


def predecir(nombre, x, z, y, semilla):
    modelo = columnas.estimador(nombre, semilla)
    if nombre == "rf":
        modelo.set_params(n_jobs=4)
    modelo.fit(x, y)
    return modelo.predict_proba(z)[:, 1]


def evaluar_predicciones(tabla, evaluados, pred, inicio, fin):
    puntajes = {v.vin: float(p) for v, p in zip(evaluados, pred)}
    modelo = types.SimpleNamespace(por_vin=True, puntuar=lambda ctx, vs: {v.vin: puntajes[v.vin] for v in vs})
    return simular(tabla, modelo, inicio, fin)


def correr(tabla):
    if tabla.desbloqueada:
        raise ValueError("Tabla desbloqueada no admitida")
    vins = [v for v in tabla.vins if v.dia < 195]
    y = np.array([v.calibrada for v in vins], dtype=int)
    dias = np.array([v.dia for v in vins])
    fuente = fuente_completa(tabla)
    diarios = collections.defaultdict(list)
    coberturas = collections.defaultdict(list)
    for inicio, fin in (*BLOQUES_SELECCION, CONFIRMACION):
        ti, ei = particiones(vins, inicio, fin)
        train, evaluados = [vins[i] for i in ti], [vins[i] for i in ei]
        x, z, _, _, _ = columnas.espacio(tabla, collections.defaultdict(list), [], train, evaluados, 0)
        fijo = simular(tabla, TasaFija(hasta=inicio - 6), inicio, fin, fuente)
        for semilla in SEMILLAS:
            diarios[(semilla, "tasa_fija", "catalogo")].append(fijo)
            for nombre in MODELOS:
                p = predecir(nombre, x, z, y[ti], semilla)
                diarios[(semilla, nombre, "catalogo")].append(
                    evaluar_predicciones(tabla, evaluados, p, inicio, fin))
            for escenario, config in ESCENARIOS.items():
                sinteticos, disp = generar(y, dias, config, semilla)
                xx = sp.hstack([x, sp.csr_matrix(sinteticos[ti])], format="csr")
                zz = sp.hstack([z, sp.csr_matrix(sinteticos[ei])], format="csr")
                coberturas[(semilla, escenario)].append({"bloque": [inicio, fin], "vins": len(ei),
                                                       "con_datos": int(disp[ei].sum())})
                for nombre in MODELOS:
                    p = predecir(nombre, xx, zz, y[ti], semilla)
                    diarios[(semilla, nombre, escenario)].append(
                        evaluar_predicciones(tabla, evaluados, p, inicio, fin))
        print(f"sensibilidad: bloque {inicio}–{fin} listo", flush=True)
    resultados, resumen = [], []
    for tramo in ("seleccion", "comprobacion"):
        ds = {k: _unir(v[:-1]) if tramo == "seleccion" else v[-1] for k, v in diarios.items()}
        idx = remuestreos(len(next(iter(ds.values())).dias))
        for (semilla, modelo, escenario), d in ds.items():
            base = ds[(semilla, modelo, "catalogo")]
            tasa = ds[(semilla, "tasa_fija", "catalogo")]
            m, mb, mt = metricas(d, idx), metricas(base, idx), metricas(tasa, idx)
            resultados.append({"tramo": tramo, "semilla": semilla, "modelo": modelo, "escenario": escenario,
                               **m, "mejora_relativa_catalogo": m["precision_cupo"] / mb["precision_cupo"] - 1,
                               "mejora_relativa_tasa_fija": m["precision_cupo"] / mt["precision_cupo"] - 1,
                               "delta_catalogo_rango95": diferencia(base, d, idx)})
        for modelo in MODELOS:
            for escenario in ("catalogo", *ESCENARIOS):
                conjunto = [ds[(s, modelo, escenario)] for s in SEMILLAS]
                bases = [ds[(s, modelo, "catalogo")] for s in SEMILLAS]
                tasas = [ds[(s, "tasa_fija", "catalogo")] for s in SEMILLAS]
                promedio = lambda vs: type(vs[0])(vs[0].dias, vs[0].n, vs[0].k, vs[0].cal,
                                                   np.mean([v.cal_elegidas for v in vs], axis=0))
                media, base, tasa = promedio(conjunto), promedio(bases), promedio(tasas)
                aciertos, ac_base, ac_tasa = (d.cal_elegidas.sum() for d in (media, base, tasa))
                resumen.append({"tramo": tramo, "modelo": modelo, "escenario": escenario,
                                "elegidos": int(media.k.sum()), "aciertos_media": float(aciertos),
                                "aciertos_semillas": [int(d.cal_elegidas.sum()) for d in conjunto],
                                "precision_media": float(aciertos / media.k.sum()),
                                "mejora_relativa_catalogo": float(aciertos / ac_base - 1),
                                "mejora_relativa_tasa_fija": float(aciertos / ac_tasa - 1),
                                "delta_catalogo_rango95_condicional": diferencia(base, media, idx)})
    return {"pieza": "Sensibilidad hipotética a columnas de proceso", "fuente": tabla.fuente,
            "version_codigo": version_codigo(), "sha256_script": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            "semillas": SEMILLAS, "modelos": MODELOS, "escenarios": ESCENARIOS, "columnas_normalizadas": GRUPOS,
            "protocolo": "Etiquetas ficticias observadas y columnas inventadas condicionadas a ellas. "
                         "Cuatro latentes gaussianas, separación total d, ruido por proxy y cobertura MCAR por VIN. "
                         "Sin unidades físicas ni lotes compartidos. Entrenamiento <=inicio-6; solo Día <195. "
                         "Períodos ya explorados; bootstrap por días descriptivo y condicionado al generador, "
                         "sin ajuste por múltiples escenarios/modelos. No es evidencia de mejora real ni causalidad.",
            "coberturas": [{"semilla": s, "escenario": e, "bloques": c} for (s, e), c in coberturas.items()],
            "resumen": resumen, "resultados": resultados}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", required=True)
    parser.add_argument("--catalogo", required=True)
    parser.add_argument("--salida", required=True, help="JSON con agregados, sin filas individuales")
    opciones = parser.parse_args()
    salida = correr(cargar(opciones.csv, opciones.catalogo))
    destino = Path(opciones.salida)
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(salida, indent=2, ensure_ascii=False, allow_nan=False) + "\n")


if __name__ == "__main__":
    main()
