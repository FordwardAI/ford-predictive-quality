"""Sensibilidad de los candidatos de #48: controles originales y extensiones explícitas con proxies inventados."""
import argparse
import collections
import hashlib
import json
from pathlib import Path

import numpy as np
import scipy.sparse as sp
from scipy.optimize import minimize
from scipy.special import expit, logit

from . import columnas
from .. import ml
from ..cupo import fuente_completa, version_codigo
from ..datos import cargar
from ..precision import BLOQUES_SELECCION, CONFIRMACION
from ..puntaje import Contexto, atributos_de
from ..referencias import Jerarquico, TasaFija
from .sensibilidad_proceso import ESCENARIOS, GRUPOS, SEMILLAS, evaluar_predicciones, generar, particiones, resumir

MODELOS = ("rf_atributos", "conjunto_catboost", "stacking", "mezcla", "jerarquico", "tasa_fija")


def puntajes(tabla, modelo, fuente, inicio, fin):
    vs, ps = [], []
    for dia, filas in tabla.por_dia(inicio, fin).items():
        tasas = modelo.puntuar(Contexto(fuente, dia), sorted({v.codigo for v in filas}))
        vs.extend(filas)
        ps.extend(tasas[v.codigo] for v in filas)
    return vs, np.array(ps)


def corregir(p, x, coef):
    return expit(logit(np.clip(p, ml.EPS, 1 - ml.EPS)) + x @ coef)


def ajustar_correccion(p, x, y):
    """Corrección aditiva regularizada de los logits; bases, meta original e intercepto permanecen congelados."""
    offset = logit(np.clip(p, ml.EPS, 1 - ml.EPS))

    def objetivo(coef):
        z = offset + x @ coef
        return float((np.logaddexp(0, z) - y * z).sum() + .5 * (coef @ coef)), x.T @ (expit(z) - y) + coef

    ajuste = minimize(objetivo, np.zeros(x.shape[1]), jac=True, method="L-BFGS-B",
                      options={"maxiter": 2000, "ftol": 1e-12})
    if not ajuste.success:
        raise RuntimeError(f"Corrección de stacking no convergió: {ajuste.message}")
    return ajuste.x


def bosque_extendido(tabla, fuente, train, evaluados, sinteticos, indices, hiper, semilla):
    """Misma codificación, parámetros y orden de filas de RF original; se anexan proxies por VIN."""
    conocidas = fuente.conocidas(max(v.dia for v in train))
    atributos = atributos_de(tabla.catalogo)
    _, indice = ml.entrenar("rf", hiper, semilla, conocidas, atributos=atributos)
    orden_codigo = {c: i for i, c in enumerate(conocidas.codigos)}
    train = sorted(train, key=lambda v: (orden_codigo[v.codigo], v.dia, -int(v.calibrada), v.vin))
    codigos, y, _ = ml._filas_por_vin(conocidas, None)
    assert codigos == [v.codigo for v in train] and np.array_equal(y, [v.calibrada for v in train])
    x = ml._matriz(ml.FAMILIAS["rf"], codigos, indice, atributos)
    z = ml._matriz(ml.FAMILIAS["rf"], [v.codigo for v in evaluados], indice, atributos)
    x = np.column_stack((x, sinteticos[[indices[v.vin] for v in train]]))
    z = np.column_stack((z, sinteticos[[indices[v.vin] for v in evaluados]]))
    modelo = ml._rf(hiper, semilla).set_params(n_jobs=4)
    modelo.fit(x, y)
    modelo.set_params(n_jobs=1)
    return modelo.predict_proba(z)[:, 1]


def verificar_controles(resultados, historico):
    """Frena la publicación si cualquier semilla/candidato no reproduce los aciertos originales de #48."""
    for r in resultados:
        if r["escenario"] != "catalogo" or r["modelo"] == "tasa_fija":
            continue
        tramo = "seleccion" if r["tramo"] == "seleccion" else "confirmacion"
        previo = next(s for s in historico["resultados"] if s["semilla"] == r["semilla"])[tramo][r["modelo"]]
        for clave in ("vins", "elegidos", "calibrada_elegidas"):
            if r[clave] != previo[clave]:
                raise AssertionError(f"Control {r['modelo']}/{r['semilla']}/{tramo}: discrepancia en {clave}")


def correr(tabla, historico):
    if tabla.desbloqueada:
        raise ValueError("Tabla desbloqueada no admitida")
    vins = [v for v in tabla.vins if v.dia < 195]
    y = np.array([v.calibrada for v in vins], dtype=int)
    dias = np.array([v.dia for v in vins])
    indices = {v.vin: i for i, v in enumerate(vins)}
    fuente, atributos = fuente_completa(tabla), atributos_de(tabla.catalogo)
    diarios, ajustes = collections.defaultdict(list), []
    configs = {tuple(a["bloque"]): a for a in historico["ajustes_por_bloque"]}
    for inicio, fin in (*BLOQUES_SELECCION, CONFIRMACION):
        ti, _ = particiones(vins, inicio, fin)
        train = [vins[i] for i in ti]
        evaluados = [v for vs in tabla.por_dia(inicio, fin).values() for v in vs]
        ei = np.array([indices[v.vin] for v in evaluados])
        x, z, _, _, _ = columnas.espacio(tabla, collections.defaultdict(list), [], train, evaluados, 0)
        yc = np.array([v.componente or "CALIBRADA_SIN_COMPONENTE" if v.calibrada else "OK" for v in train])
        config = configs[inicio, fin]
        bases, hiper = config["bases"], config["rf_atributos"]["hiperparametros"]
        hasta = ml.fin_interno(inicio)
        for semilla in SEMILLAS:
            meta, _, _ = ml.ajustar_meta(bases, "fijo", semilla, fuente, ancla=inicio)
            stack = ml.Stacking("fijo", bases, meta, semilla, hasta=hasta, ancla=inicio)
            jerarquico = Jerarquico(60, 20, atributos)
            bosque = ml.BASES_ATRIBUTOS["rf"]("fijo", hiper, semilla, hasta=hasta, atributos=atributos)
            base = {}
            for nombre, modelo in (("stacking", stack), ("jerarquico", jerarquico), ("rf_atributos", bosque),
                                   ("tasa_fija", TasaFija(hasta=hasta))):
                _, base[nombre] = puntajes(tabla, modelo, fuente, inicio, fin)
            base["mezcla"] = .6 * base["stacking"] + .4 * base["jerarquico"]
            base["conjunto_catboost"] = columnas.ajustar_predecir("catboost", x, z, yc, np.ones(len(yc)), semilla, True)
            internos, p_interno = puntajes(tabla, ml.Stacking("fijo", bases, meta, semilla, hasta=hasta - 30),
                                          fuente, hasta - 24, hasta)
            ii = np.array([indices[v.vin] for v in internos])
            correcciones = {}
            for escenario in ("catalogo", *ESCENARIOS):
                ps = dict(base)
                if escenario != "catalogo":
                    sinteticos, _ = generar(y, dias, ESCENARIOS[escenario], semilla)
                    coef = ajustar_correccion(p_interno, sinteticos[ii], y[ii])
                    correcciones[escenario] = coef.tolist()
                    ps["stacking"] = corregir(base["stacking"], sinteticos[ei], coef)
                    ps["mezcla"] = .6 * ps["stacking"] + .4 * base["jerarquico"]
                    ps["rf_atributos"] = bosque_extendido(tabla, fuente, train, evaluados, sinteticos, indices,
                                                         hiper, semilla)
                    xx = sp.hstack([x, sp.csr_matrix(sinteticos[ti])], format="csr")
                    zz = sp.hstack([z, sp.csr_matrix(sinteticos[ei])], format="csr")
                    ps["conjunto_catboost"] = columnas.ajustar_predecir("catboost", xx, zz, yc,
                                                                      np.ones(len(yc)), semilla, True)
                for nombre, p in ps.items():
                    diarios[(semilla, nombre, escenario)].append(
                        evaluar_predicciones(tabla, evaluados, p, inicio, fin))
            ajustes.append({"bloque": [inicio, fin], "semilla": semilla, "rf_hiper": hiper,
                            "bases": bases, "meta_original": meta, "correcciones": correcciones,
                            "correccion_entrenada_hasta": hasta, "bases_internas_hasta": hasta - 30})
        ml._MODELOS.clear()
        print(f"candidatos: bloque {inicio}–{fin} listo", flush=True)
    resultados, resumen = resumir(diarios, MODELOS, SEMILLAS, ESCENARIOS)
    verificar_controles(resultados, historico)
    return {"pieza": "Sensibilidad de los candidatos priorizados de #48", "fuente": tabla.fuente,
            "version_codigo": version_codigo(), "sha256_script": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            "semillas": SEMILLAS, "modelos": MODELOS, "escenarios": ESCENARIOS, "columnas_normalizadas": GRUPOS,
            "controles_originales_reproducidos": True, "ajustes": ajustes,
            "protocolo": "RF original + proxies, CatBoost conjunto original + proxies; stacking original congelado "
                         "+ corrección aditiva regularizada de señales ajustada en tramo interno anterior al bloque. "
                         "Mezcla .6 stacking extendido + .4 jerárquico original. Tasa fija/jerárquico no consumen proxies. "
                         "Columnas generadas condicionadas a etiquetas, también en evaluación. No es señal medida "
                         "ni eficacia real. Solo Día <195; períodos vistos, cinco semillas, bootstrap descriptivo "
                         "condicional por días sin ajuste múltiple. No modifica preregistro o predictor operativo.",
            "resumen": resumen, "resultados": resultados}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", required=True)
    parser.add_argument("--catalogo", required=True)
    parser.add_argument("--historico", default="solucion/experimentos/resultados/semillas_busqueda.json")
    parser.add_argument("--salida", required=True)
    args = parser.parse_args()
    historico = json.loads(Path(args.historico).read_text())
    tabla = cargar(args.csv, args.catalogo)
    if historico["fuente"] != tabla.fuente:
        raise ValueError("El histórico no corresponde a la fuente/catálogo vigentes")
    salida = correr(tabla, historico)
    destino = Path(args.salida)
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(salida, indent=2, ensure_ascii=False, allow_nan=False) + "\n")


if __name__ == "__main__":
    main()
