"""Elección por mayor precisión en origen móvil (propuesta del 30/09, #33).

La regla de #10 desempataba por simplicidad: con ~391 elegidos en la validación (155–194) el ruido es de ±4 puntos y
casi todas las alternativas «empataban». Acá se mide en varios bloques consecutivos de días, siempre entrenando con el
pasado (Día <= t−5), y gana la alternativa de mayor precisión acumulada en los bloques de selección (100–174). La cifra
de la ganadora se informa en el bloque de confirmación (175–194), que no participó en la elección.

Todo se calcula con Día < 195: la prueba final no se relee. Los resultados se guardan aparte
(`solucion/resultados/precision.json`) para no tocar la cadena del preregistro.
"""
import types

import numpy as np

from . import ml
from .cupo import (CALIFICADOR, Diario, elegir_por_precision, diferencia, fuente_completa, metricas, remuestreos,
                   resultado, simular)
from .datos import MARGEN, PRUEBA_DESDE
from .puntaje import atributos_de
from .referencias import (Azar, Decaimiento, Jerarquico, Movil, MovilMercado, Oraculo, PESO, TasaFija, VENTANAS,
                          VIDAS)

BLOQUES_SELECCION = ((100, 118), (119, 137), (138, 156), (157, 174))
CONFIRMACION = (175, 194)
VALIDACION_ORIGINAL = (155, 194)
JERARQUICO_VENTANAS, JERARQUICO_PESOS = (60, 120, None), (10, 20, 40)


def grupos_del_bloque(tabla, fuente, a, b, con_ml=True):
    """{clave de grupo: [(alternativa, extra)]} para un bloque [a, b]; las fijas se reajustan con Día <= a−6."""
    mercados = {c: x.get("mercado") for c, x in tabla.catalogo.items()}
    atributos = atributos_de(tabla.catalogo)
    grupos = {"azar": [(Azar(), {})], "oraculo": [(Oraculo(a, b), {})],
              "tasa_fija": [(TasaFija(hasta=ml.fin_interno(a)), {})]}
    for v in VENTANAS:
        for p in (0, PESO):
            grupos[f"movil_{v}_{p}"] = [(Movil(v, p), {})]
        grupos[f"movil_mercado_{v}"] = [(MovilMercado(v, PESO, mercados), {})]
    for v in VIDAS:
        grupos[f"decaimiento_{v}"] = [(Decaimiento(v), {})]
    for v in JERARQUICO_VENTANAS:
        for p in JERARQUICO_PESOS:
            grupos[f"jerarquico_{v}_{p}"] = [(Jerarquico(v, p, atributos), {})]
    if con_ml:
        for (familia, modo), lista in ml.alternativas(fuente, ancla=a).items():
            grupos[f"{familia}|{modo}"] = lista
        for (familia, modo), lista in ml.alternativas(fuente, ancla=a, atributos=atributos).items():
            grupos[f"{familia}|{modo}"] = lista
    return grupos


def _unir(diarios):
    """Diario de varios bloques consecutivos, como uno solo."""
    return Diario(*(np.concatenate([getattr(d, k) for d in diarios]) for k in ("dias", "n", "k", "cal", "cal_elegidas")))


def _precision(d):
    return float(d.cal_elegidas.sum() / d.k.sum())


def _etiqueta(nombre, familia, parametros, orden, elegible):
    return types.SimpleNamespace(nombre=nombre, familia=familia, parametros=parametros, orden=orden, elegible=elegible)


def evaluar_bloques(tabla, bloques, con_ml=True, al_terminar=None):
    """{clave: {semillas: [Diario por bloque]}} evaluando cada alternativa en cada bloque con el pasado hasta a−6."""
    fuente = fuente_completa(tabla)
    salida, meta = {}, {}
    for a, b in bloques:
        for clave, lista in grupos_del_bloque(tabla, fuente, a, b, con_ml).items():
            instancias = salida.setdefault(clave, [[] for _ in lista])
            assert len(instancias) == len(lista), f"{clave}: cambió la cantidad de semillas"
            for i, (alternativa, extra) in enumerate(lista):
                instancias[i].append(simular(tabla, alternativa, a, b, fuente))
                meta.setdefault(clave, {"familia": alternativa.familia, "elegible": alternativa.elegible,
                                        "orden": alternativa.orden, "semillas": [], "ajustes": []})
                if i == 0:
                    meta[clave]["ajustes"].append({"bloque": [a, b], **{k: v for k, v in extra.items()
                                                                        if k == "log_loss_interna"},
                                                   "parametros": _parametros(alternativa)})
                if len(meta[clave]["semillas"]) < len(lista):
                    meta[clave]["semillas"].append(getattr(alternativa, "semilla", None))
        if al_terminar:
            al_terminar(a, b)
    return salida, meta


def _parametros(alternativa):
    p = dict(alternativa.parametros)
    p.pop("bases", None)
    p.pop("meta", None)
    return p


def _nombre(clave, meta):
    if clave in ("azar", "oraculo"):
        return {"azar": "azar", "oraculo": "oráculo (tasa real del tramo)"}[clave]
    if clave == "tasa_fija":
        return "tasa fija (reajustada al inicio de cada bloque)"
    if "|" in clave:
        familia, modo = clave.split("|")
        detalle = "fijo (reajustado por bloque)" if modo == "fijo" else "reentrenado cada 5 d"
        nombre = {"ml_promedio": "promedio de modelos", "ml_stacking": "stacking",
                  "ml_promedio_atributos": "promedio de modelos con atributos"}.get(familia)
        if nombre is None:
            base = familia.removeprefix("ml_").removesuffix("_atributos")
            nombre = ml.FAMILIAS[base].nombre + (" con atributos del código" if familia.endswith("_atributos") else "")
        return f"{nombre}, {detalle}"
    partes = clave.split("_")
    if clave.startswith("jerarquico"):
        return f"jerárquico {'todo el historial' if partes[1] == 'None' else partes[1] + ' d'}, peso {partes[2]}"
    if clave.startswith("movil_mercado"):
        return f"móvil {partes[2]} d hacia el mercado, peso {PESO}"
    if clave.startswith("movil"):
        return f"móvil {partes[1]} d, peso {partes[2]}"
    return f"decaimiento, vida media {partes[1]} d"


def _seleccionar_semilla(por_semilla, bloques_seleccion):
    """Índice de la corrida mediana entre semillas por precisión acumulada en la selección (empates por posición)."""
    n = len(bloques_seleccion)
    precisiones = [(_precision(_unir(d[:n])), i) for i, d in enumerate(por_semilla)]
    return sorted(precisiones)[len(precisiones) // 2][1]


def analizar(tabla, datos, meta, bloques_seleccion=BLOQUES_SELECCION, confirmacion=CONFIRMACION):
    """Resultados por alternativa: acumulado de la selección, por bloque, confirmación y diferencia con la tasa fija."""
    n_sel = len(bloques_seleccion)
    dias_sel = sum(b - a + 1 for a, b in bloques_seleccion)
    idx_sel = remuestreos(len(_unir(next(iter(datos.values()))[0][:n_sel]).dias))
    idx_conf = remuestreos(len(datos["tasa_fija"][0][n_sel].dias))
    elegida = {clave: _seleccionar_semilla(por_semilla, bloques_seleccion) if len(por_semilla) > 1 else 0
               for clave, por_semilla in datos.items()}
    sel = {c: _unir(d[elegida[c]][:n_sel]) for c, d in datos.items()}
    conf = {c: d[elegida[c]][n_sel] for c, d in datos.items()}
    resultados = []
    for clave in datos:
        m = meta[clave]
        et = _etiqueta(_nombre(clave, m), m["familia"], {"ajustes_por_bloque": m["ajustes"]}, tuple(m["orden"]),
                       m["elegible"])
        r = resultado(et, sel[clave], idx_sel, tabla, f"selección {bloques_seleccion[0][0]}–{bloques_seleccion[-1][1]}")
        r["precision_por_bloque"] = [_precision(d) for d in datos[clave][elegida[clave]][:n_sel]]
        r["confirmacion"] = resultado(et, conf[clave], idx_conf, tabla, f"confirmación {confirmacion[0]}–{confirmacion[1]}")
        r["semilla_mediana"] = m["semillas"][elegida[clave]] if len(m["semillas"]) > 1 else None
        r["precision_por_semilla_seleccion"] = [_precision(_unir(d[:n_sel])) for d in datos[clave]] \
            if len(datos[clave]) > 1 else None
        r["clave"] = clave
        r["dias_seleccion"] = dias_sel
        resultados.append(r)
    ref, azar = sel["tasa_fija"], sel["azar"]
    for r in resultados:
        c = r["clave"]
        r["diferencia_con_tasa_fija_seleccion_rango95"] = None if c == "tasa_fija" else diferencia(ref, sel[c], idx_sel)
        r["diferencia_con_tasa_fija_confirmacion_rango95"] = None if c == "tasa_fija" else diferencia(
            conf["tasa_fija"], conf[c], idx_conf)
    return resultados, idx_sel, idx_conf, sel, azar


def correr(tabla, opciones=None):
    assert not tabla.desbloqueada, "La elección por precisión no relee la prueba final"
    assert all(b <= PRUEBA_DESDE - MARGEN - 1 for _, b in (*BLOQUES_SELECCION, CONFIRMACION)), "Solo Día < 195"
    bloques = (*BLOQUES_SELECCION, CONFIRMACION)
    datos, meta = evaluar_bloques(tabla, bloques, al_terminar=lambda a, b: print(f"precision: bloque {a}-{b} listo",
                                                                                  flush=True))
    resultados, _, _, _, _ = analizar(tabla, datos, meta)
    ganadora, ranking = elegir_por_precision(resultados)
    ref = next(r for r in resultados if r["clave"] == "tasa_fija")
    referencia, meta_ref = evaluar_bloques(tabla, (VALIDACION_ORIGINAL,))
    validacion = []
    for clave, por_semilla in referencia.items():
        d = por_semilla[len(por_semilla) // 2] if len(por_semilla) > 1 else por_semilla[0]
        m = meta_ref[clave]
        validacion.append({"alternativa": _nombre(clave, m), "clave": clave, "precision_cupo": _precision(d[0]),
                           "calibrada_elegidas": int(d[0].cal_elegidas.sum()), "elegidos": int(d[0].k.sum())})

    def resumen(r):
        c = r["confirmacion"]
        return {"alternativa": r["alternativa"], "clave": r["clave"], "familia": r["familia"],
                "precision_seleccion": r["precision_cupo"], "precision_seleccion_rango95": r["precision_rango95"],
                "calibrada_elegidas_seleccion": r["calibrada_elegidas"], "elegidos_seleccion": r["elegidos"],
                "precision_por_bloque": r["precision_por_bloque"],
                "diferencia_con_tasa_fija_seleccion_rango95": r["diferencia_con_tasa_fija_seleccion_rango95"],
                "confirmacion": {k: c[k] for k in ("precision_cupo", "precision_rango95", "calibrada_elegidas",
                                                   "elegidos", "azar_mismo_cupo", "veces_azar", "veces_azar_rango95",
                                                   "lectura", "calificador")},
                "diferencia_con_tasa_fija_confirmacion_rango95": r["diferencia_con_tasa_fija_confirmacion_rango95"],
                "semilla_mediana": r["semilla_mediana"], "elegible": r["elegible"]}

    return {"pieza": "Elección por precisión en origen móvil (propuesta del 30/09)",
            "regla": "mayor precisión acumulada en los bloques de selección; sin desempate por simplicidad. "
                     "La cifra de la ganadora se lee en el bloque de confirmación, que no participó en la elección.",
            "protocolo": {"bloques_seleccion": [list(b) for b in BLOQUES_SELECCION], "confirmacion": list(CONFIRMACION),
                          "validacion_original": list(VALIDACION_ORIGINAL), "margen_dias": MARGEN,
                          "predictores": "código de catálogo y atributos leídos del propio código (mercado, motor, "
                                         "tracción, versión); nunca el resultado ni el componente de Auditoría Adicional",
                          "prueba_final": "no releída: todo con Día < 195"},
            "calificador_seleccion": CALIFICADOR.format(tramo="selección 100–174", n=ganadora["vins"]),
            "calificador_confirmacion": ganadora["confirmacion"]["calificador"],
            "ganadora": resumen(ganadora), "tasa_fija": resumen(ref),
            "azar": resumen(next(r for r in resultados if r["clave"] == "azar")),
            "oraculo": resumen(next(r for r in resultados if r["clave"] == "oraculo")),
            "ranking": [resumen(r) for r in ranking],
            "validacion_original_155_194": sorted(validacion, key=lambda v: -v["precision_cupo"])}
