"""Cinco semillas con la pareja de catálogo elegida congelada; no vuelve a elegir pesos ni componentes."""
import collections
import types

import numpy as np

from . import columnas, ml
from .cupo import diferencia, fuente_completa, metricas, remuestreos, simular, version_codigo
from .ensemble import Mezcla
from .precision import BLOQUES_SELECCION, CONFIRMACION, _unir
from .puntaje import atributos_de
from .referencias import Jerarquico


def correr(tabla, opciones=None):
    assert not tabla.desbloqueada
    fuente, atributos = fuente_completa(tabla), atributos_de(tabla.catalogo)
    datos = collections.defaultdict(list)
    ajustes = []
    for a, b in (*BLOQUES_SELECCION, CONFIRMACION):
        bases = {f: {k: v for k, v in ml.ajustar(f, "fijo", fuente, ancla=a).items()
                     if k in ("vida", "hiperparametros")} for f in ml.FAMILIAS}
        rf = ml.ajustar("rf", "fijo", fuente, ancla=a, atributos=atributos)
        ajustes.append({"bloque": [a, b], "bases": bases, "rf_atributos": rf})
        train = [v for v in tabla.vins if v.dia <= a - 6]
        evaluados = [v for vs in tabla.por_dia(a, b).values() for v in vs]
        X, Z, _, _, _ = columnas.espacio(tabla, collections.defaultdict(list), [], train, evaluados, 0)
        yc = np.array([v.componente or "CALIBRADA_SIN_COMPONENTE" if v.calibrada else "OK" for v in train])
        for semilla in ml.SEMILLAS:
            meta, _, _ = ml.ajustar_meta(bases, "fijo", semilla, fuente, ancla=a)
            stack = ml.Stacking("fijo", bases, meta, semilla, hasta=ml.fin_interno(a), ancla=a)
            jerarquico = Jerarquico(60, 20, atributos)
            mezcla = Mezcla(stack, jerarquico, .6)
            p = columnas.ajustar_predecir("catboost", X, Z, yc, np.ones(len(train)), semilla, True)
            por_vin = {v.vin: float(q) for v, q in zip(evaluados, p)}
            conjunto = types.SimpleNamespace(por_vin=True, puntuar=lambda ctx, vs, ps=por_vin: {v.vin: ps[v.vin] for v in vs})
            bosque = ml.BASES_ATRIBUTOS["rf"]("fijo", rf["hiperparametros"], semilla,
                                             hasta=ml.fin_interno(a), atributos=atributos)
            for nombre, modelo in (("mezcla", mezcla), ("stacking", stack), ("jerarquico", jerarquico),
                                   ("conjunto_catboost", conjunto), ("rf_atributos", bosque)):
                datos[(nombre, semilla)].append(simular(tabla, modelo, a, b, fuente))
        ml._MODELOS.clear()
        print(f"semillas: bloque {a}–{b} listo", flush=True)
    salida = []
    for s in ml.SEMILLAS:
        filas = {}
        for tramo in ("seleccion", "confirmacion"):
            diarios = {n: _unir(ds[:-1]) if tramo == "seleccion" else ds[-1] for (n, sem), ds in datos.items() if sem == s}
            idx = remuestreos(len(diarios["mezcla"].dias))
            filas[tramo] = {n: metricas(d, idx) for n, d in diarios.items()}
            filas[tramo]["diferencias_mezcla"] = {n: diferencia(d, diarios["mezcla"], idx)
                                                 for n, d in diarios.items() if n != "mezcla"}
        salida.append({"semilla": s, **filas})
    return {"pieza": "Estabilidad de la mezcla de catálogo elegida", "fuente": tabla.fuente,
            "version_codigo": version_codigo(), "mezcla": {"stacking_fijo": .6, "jerarquico_60_peso20": .4},
            "protocolo": "Semillas 1–5, pesos y componentes congelados; selección 100–174 y comprobación 175–194. "
                          "Exploratorio, datos ya vistos, base ficticia, auditados con actividad QLS; prueba final no releída.",
            "ajustes_por_bloque": ajustes, "resultados": salida}
