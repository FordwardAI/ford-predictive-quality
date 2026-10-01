"""Recorta la búsqueda a entradas disponibles (catálogo) y comprueba selección adaptativa con margen temporal."""
import argparse
import json
import pickle
from pathlib import Path

import numpy as np
from scipy.stats import rankdata
from threadpoolctl import threadpool_limits

from . import busqueda
from .cupo import diferencia, metricas, remuestreos, version_codigo
from .precision import BLOQUES_SELECCION, CONFIRMACION


def solo_catalogo(nombre):
    return (nombre.startswith("ml_") or nombre.startswith("conjunto|")
            or nombre.startswith("historial|") and nombre.endswith("|sin")
            or nombre.startswith("campos_") and "|base|natural" in nombre
            or nombre == "tasa_fija" or nombre.startswith(("movil_", "jerarquico_", "decaimiento_")))


def seleccionar_en_el_pasado(cuentas, dias, ids, bloques):
    salida = np.zeros(len(dias), dtype=int)
    decisiones = []
    for a, b in bloques:
        pasado = [i for i, d in enumerate(dias) if d["t"] <= a - 6]
        assert pasado, "No hay resultados disponibles para elegir"
        ganador = min(ids, key=lambda i: (-int(cuentas[i, pasado].sum()), i))
        futuros = [i for i, d in enumerate(dias) if a <= d["t"] <= b]
        salida[futuros] = cuentas[ganador, futuros]
        decisiones.append({"bloque": [a, b], "hasta_eleccion": max(dias[i]["t"] for i in pasado),
                           "indice": ganador})
    return salida, decisiones


def revisar(datos):
    assert datos["terminado"] and max(d["t"] for d in datos["dias"]) < 195
    nombres = datos["nombres"]
    dias = [d for d in datos["dias"] if d["t"] >= 100]
    individuales = np.array([busqueda.aciertos(d["P"], d["y"], d["k"], d["azar"]) for d in dias]).T
    candidatos, pool = busqueda.catalogo(nombres, individuales, dias)
    candidatos = [c for c in candidatos if all(solo_catalogo(nombres[i]) for i in c["indices"])]
    for d in dias:
        d["rangos"] = rankdata(d["P"], axis=1) / (d["n"] + 1)
    cuentas = busqueda.evaluar(dias, candidatos)
    aprendidos, configs = busqueda.pesos_aprendidos(datos, pool)
    resultado = busqueda.analizar(datos, candidatos, cuentas, aprendidos, configs)
    resultado["individuales"] = sum(c["metodo"] == "individual" for c in candidatos)
    # analizar agrega los meta-modelos a candidatos; se añade su conteo al mismo orden.
    cuentas = np.vstack([cuentas, *aprendidos.values()])
    fijas = [i for i, c in enumerate(candidatos) if c["metodo"] in ("individual", "pares")
             or c["metodo"].startswith(("stacking", "convexo"))]
    singulares = [i for i in fijas if candidatos[i]["metodo"] == "individual"]
    bloques = (*BLOQUES_SELECCION[1:], CONFIRMACION)
    mixto, decisiones = seleccionar_en_el_pasado(cuentas, dias, fijas, bloques)
    sencillo, decisiones_s = seleccionar_en_el_pasado(cuentas, dias, singulares, bloques)
    evaluados = [i for i, d in enumerate(dias) if d["t"] >= bloques[0][0]]
    dm, ds = busqueda.diario_de(dias, mixto, evaluados), busqueda.diario_de(dias, sencillo, evaluados)
    idx = remuestreos(len(evaluados))
    for lista in (decisiones, decisiones_s):
        for d in lista:
            c = candidatos[d.pop("indice")]
            d.update(metodo=c["metodo"], componentes=[nombres[i] for i in c["indices"]], pesos=c["pesos"])
    resultado["eleccion_adaptativa"] = {"mezclas_o_individual": metricas(dm, idx), "solo_individual": metricas(ds, idx),
                                       "diferencia_rango95": diferencia(ds, dm, idx), "decisiones": decisiones,
                                       "decisiones_individuales": decisiones_s,
                                       "limite": "Períodos ya vistos; la regla elige solo con etiquetas disponibles hasta inicio−6. "
                                       "No usa los subconjuntos cuyo pool se eligió con toda la selección."}
    return resultado


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--predicciones", type=Path, required=True, help="Caché local generada por busqueda; no un archivo externo")
    p.add_argument("--salida", type=Path, required=True)
    a = p.parse_args()
    with a.predicciones.open("rb") as f:
        datos = pickle.load(f)
    with threadpool_limits(limits=1):
        r = revisar(datos)
    r.update(pieza="Robustez: catálogo y elección adaptativa", version_codigo=version_codigo(),
             limite="Exploratorio, base ficticia, auditados con actividad QLS; prueba final no releída")
    a.salida.write_text(json.dumps(r, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(a.salida.name, "listo", flush=True)


if __name__ == "__main__":
    main()
