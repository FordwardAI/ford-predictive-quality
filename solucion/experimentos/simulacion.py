"""Simulación de un mundo con verdad conocida para comparar las opciones (#33). NO es evidencia sobre la planta.

La prueba final tiene 652 elegidos y las tres lecturas comparten los mismos VIN: 6 aciertos de diferencia no se distinguen
del ruido. Acá se arma un mundo donde la tasa verdadera de cada VIN se conoce, y se corren sobre él, muchas veces, las
**mismas alternativas y el mismo protocolo** del repo (bloques de `precision.py`, cupo del 5 %, margen de 5 días).
Responde dos preguntas que los datos reales no dejan responder:
- ¿Cuánto vale cada opción **sin el ruido de las etiquetas**? Se mide la precisión verdadera esperada (la suma de las
  probabilidades verdaderas de lo elegido) y se la compara con la mejor selección posible en ese mundo.
- ¿Cuánto ruido hay en la diferencia **realizada** entre dos opciones? Es lo que ve una prueba con etiquetas reales.

El mundo se ajusta solo con Día <= 194 (nunca se lee la prueba final) y mantiene la estructura real de días y códigos.
El resultado depende de lo que se supone: los escenarios varían lo que no se conoce (rotación de códigos, heterogeneidad,
deriva del riesgo de cada código). «Qué opción gana en el mundo simulado» no es «qué opción gana en la planta».

Nunca entran el resultado ni el componente de Auditoría Adicional como predictores. Nada de esto es elegible.
"""
import argparse
import dataclasses
import json
import time
from pathlib import Path

import numpy as np

from . import opcion_precisa
from .. import ml
from ..cupo import cupo, fuente_completa, simular, version_codigo
from ..datos import MARGEN, PRUEBA_DESDE, RAIZ, Vin, cargar
from ..precision import BLOQUES_SELECCION, CONFIRMACION
from ..puntaje import atributos_de
from ..referencias import Azar, Jerarquico, MovilMercado, PESO, TasaFija

BLOQUES = (*BLOQUES_SELECCION, CONFIRMACION)  # Día 100–194.
DIA_MAX = PRUEBA_DESDE - MARGEN - 1  # 194: la simulación no admite Día >= 195.
SEMILLA = 20261005
REPLICAS = 40
VENTANA_NIVEL = 31  # Días del suavizado del nivel general de la tasa.
RIESGO_MAXIMO = 0.95
CACHE = Path.home() / ".cache" / "ford-predictive-quality"
SALIDA = RAIZ / "solucion" / "experimentos" / "resultados" / "simulacion.json"

# Lo que no se conoce, variado: mezcla de códigos (real, que rota, o estable), heterogeneidad entre códigos (factor sobre
# el desvío estimado) y deriva del riesgo relativo de cada código (desvío diario de un paseo aleatorio en logaritmo).
ESCENARIOS = {
    "base": {"mezcla": "real", "heterogeneidad": 1.0, "deriva": 0.0},
    "mezcla_estable": {"mezcla": "estable", "heterogeneidad": 1.0, "deriva": 0.0},
    "heterogeneidad_alta": {"mezcla": "real", "heterogeneidad": 2.0, "deriva": 0.0},
    "heterogeneidad_baja": {"mezcla": "real", "heterogeneidad": 0.5, "deriva": 0.0},
    "riesgo_con_deriva": {"mezcla": "real", "heterogeneidad": 1.0, "deriva": 0.03},
    "estable_con_deriva": {"mezcla": "estable", "heterogeneidad": 1.0, "deriva": 0.03},
}
CANDIDATAS = ("tasa_fija", "jerarquico_60", "movil_120_mercado", "riesgo_estandarizado", "logistica_atributos",
              "rf_atributos")
CON_CATBOOST = (*CANDIDATAS, "catboost_atributos")
NOMBRES = {"azar": "azar", "oraculo": "mejor selección posible (conoce la tasa verdadera)",
           "tasa_fija": "tasa fija, reajustada por bloque", "jerarquico_60": "jerárquico 60 días, peso 20",
           "movil_120_mercado": "móvil 120 días hacia el mercado", "riesgo_estandarizado": "riesgo estandarizado, 60 días",
           "logistica_atributos": "logística con atributos, reentrenada cada 5 días",
           "rf_atributos": "Random Forest con atributos, reentrenado cada 5 días",
           "catboost_atributos": "CatBoost con atributos, reentrenado cada 5 días"}


@dataclasses.dataclass
class Mundo:
    """Parámetros del mundo, ajustados con Día <= 194: nivel de la tasa general por día y riesgo por mercado y por código."""
    nivel: np.ndarray  # Tasa general por Día del VIN (índice = día).
    rr_mercado: dict  # Riesgo relativo de cada mercado.
    desvio: float  # Desvío (en logaritmo) del riesgo de un código alrededor del de su mercado, sin el ruido de muestreo.
    mercados: dict  # código -> mercado
    codigos: list  # Todos los códigos del catálogo, ordenados.


def estimar_mundo(tabla):
    """Ajusta el mundo con las etiquetas de Día <= 194; solo agregados, nunca una etiqueta de la prueba final."""
    vins = [v for v in tabla.vins if v.dia <= DIA_MAX]
    assert vins and all(v.dia < PRUEBA_DESDE for v in vins)
    n, cal = np.zeros(DIA_MAX + 1), np.zeros(DIA_MAX + 1)
    for v in vins:
        n[v.dia] += 1
        cal[v.dia] += v.calibrada
    nucleo = np.ones(VENTANA_NIVEL)
    n_s, cal_s = np.convolve(n, nucleo, "same"), np.convolve(cal, nucleo, "same")
    general = cal.sum() / n.sum()
    nivel = np.where(n_s > 0, cal_s / np.maximum(n_s, 1), general)
    mercados = {c: tabla.mercado(c) or "" for c in sorted(tabla.catalogo)}
    esperado, observado, por_codigo = {}, {}, {}
    for v in vins:
        m = mercados.get(v.codigo, "")
        esperado[m] = esperado.get(m, 0.0) + nivel[v.dia]
        observado[m] = observado.get(m, 0.0) + v.calibrada
        e, o = por_codigo.get(v.codigo, (0.0, 0.0))
        por_codigo[v.codigo] = (e + nivel[v.dia], o + v.calibrada)
    rr_mercado = {m: observado[m] / esperado[m] for m in esperado}
    # Desvío entre códigos: dispersión observada del log-riesgo menos el ruido de muestreo (Poisson: 1 / observados).
    residuos, ruido = [], []
    for c, (e, o) in por_codigo.items():
        if e >= 8:
            esperado_c = e * rr_mercado[mercados.get(c, "")]
            residuos.append(np.log((o + 0.5) / (esperado_c + 0.5)))
            ruido.append(1.0 / (o + 0.5))
    varianza = max(float(np.mean(np.square(residuos)) - np.mean(ruido)), 0.0) if residuos else 0.0
    return Mundo(nivel=nivel, rr_mercado=rr_mercado, desvio=float(np.sqrt(varianza)), mercados=mercados,
                 codigos=sorted(tabla.catalogo))


def construir(tabla, mundo, escenario, rng, amplitud=1.0):
    """(tabla sintética, {vin: probabilidad verdadera}). Los días y los códigos son los reales; las etiquetas, simuladas."""
    reales = [v for v in tabla.vins if v.dia <= DIA_MAX]
    codigos = [v.codigo for v in reales]
    if escenario["mezcla"] == "estable":  # Cada VIN toma un código de la mezcla total: sin rotación en el tiempo.
        codigos = [str(c) for c in rng.choice(codigos, size=len(codigos))]
    indice = {c: i for i, c in enumerate(mundo.codigos)}
    base = np.array([np.log(mundo.rr_mercado.get(mundo.mercados.get(c, ""), 1.0)) for c in mundo.codigos])
    base = base + rng.normal(size=len(mundo.codigos)) * mundo.desvio * escenario["heterogeneidad"]
    base = base * escenario.get("amplitud", amplitud)  # Cuánta señal tiene el mundo (1 = la estimada tal cual).
    deriva = None
    if escenario["deriva"]:
        deriva = np.cumsum(rng.normal(scale=escenario["deriva"], size=(len(mundo.codigos), DIA_MAX + 1)), axis=1)
    p = np.empty(len(reales))
    for i, (v, c) in enumerate(zip(reales, codigos)):
        log_rr = base[indice[c]] + (0.0 if deriva is None else deriva[indice[c], v.dia])
        p[i] = min(RIESGO_MAXIMO, mundo.nivel[v.dia] * np.exp(log_rr))
    y = rng.random(len(reales)) < p
    vins = [Vin(vin=v.vin, codigo=c, dia=v.dia, primera=v.primera, etiqueta="CALIBRADA" if cal else "OK", componente=None)
            for v, c, cal in zip(reales, codigos, y)]
    sintetica = dataclasses.replace(tabla, vins=vins, cohorte=[], historial={}, eventos={}, desbloqueada=False)
    return sintetica, {v.vin: float(pi) for v, pi in zip(vins, p)}


def candidatas(a, atributos, mercados, claves):
    """Las alternativas del repo, una por clave, con la configuración ya fijada (la de los preregistros)."""
    hasta = ml.fin_interno(a)
    fabricas = {
        "tasa_fija": lambda: TasaFija(hasta=hasta),
        "jerarquico_60": lambda: Jerarquico(60, PESO, atributos),
        "movil_120_mercado": lambda: MovilMercado(120, PESO, mercados),
        "riesgo_estandarizado": lambda: opcion_precisa.RiesgoEstandarizado(60, 10, mercados),
        "logistica_atributos": lambda: ml.BASES_ATRIBUTOS["logistica"](
            "reentrenado", {"C": 1.0}, None, hasta=hasta, vida=60, ancla=a, atributos=atributos),
        "rf_atributos": lambda: ml.BASES_ATRIBUTOS["rf"](
            "reentrenado", {"min_samples_leaf": 5}, 4, hasta=hasta, vida=15, ancla=a, atributos=atributos),
        "catboost_atributos": lambda: ml.BASES_ATRIBUTOS["catboost"](
            "reentrenado", {"l2_leaf_reg": 10.0}, 1, hasta=hasta, vida=15, ancla=a, atributos=atributos),
    }
    return {c: fabricas[c]() for c in claves}


def mejor_posible(sintetica, p, a, b, rng):
    """Selección que conoce la probabilidad verdadera: los k de mayor p de cada día. Es el máximo de este mundo."""
    suma_p, k_total = 0.0, 0
    for _, vins in sintetica.por_dia(a, b).items():
        k = cupo(len(vins))
        orden = np.lexsort((rng.random(len(vins)), -np.array([p[v.vin] for v in vins])))
        suma_p += sum(p[vins[i].vin] for i in orden[:k])
        k_total += k
    return suma_p, k_total


def evaluar_replica(tabla, mundo, escenario, rng, claves, atributos, mercados, amplitud=1.0):
    """{clave: [por bloque (aciertos de lo elegido, suma de p de lo elegido, elegidos)]}, con azar y mejor posible."""
    sintetica, p = construir(tabla, mundo, escenario, rng, amplitud)
    fuente = fuente_completa(sintetica)
    salida = {}
    ml._MODELOS.clear()  # Cada réplica tiene sus propias etiquetas: no se reutilizan modelos entre réplicas.
    for a, b in BLOQUES:
        alternativas = {"azar": Azar(), **candidatas(a, atributos, mercados, claves)}
        for clave, alternativa in alternativas.items():
            acum = []
            simular(sintetica, alternativa, a, b, fuente,
                    al_elegir=lambda t, vins, elegidos, acum=acum: acum.append(
                        (sum(v.calibrada for v in elegidos), sum(p[v.vin] for v in elegidos), len(elegidos))))
            salida.setdefault(clave, []).append(tuple(np.sum(acum, axis=0)))
        suma_p, k = mejor_posible(sintetica, p, a, b, rng)
        salida.setdefault("oraculo", []).append((np.nan, suma_p, k))
    return salida


def _partes(bloques, tramo):
    """Los bloques de un tramo: 'seleccion' (los cuatro primeros), 'confirmacion' (el último) o 'todo'."""
    n = len(BLOQUES_SELECCION)
    return {"seleccion": bloques[:n], "confirmacion": bloques[n:], "todo": bloques}[tramo]


def _agregar(bloques, tramo):
    """(precisión realizada, precisión verdadera) de un tramo."""
    partes = _partes(bloques, tramo)
    cal, esperado, k = (sum(x[i] for x in partes) for i in range(3))
    return cal / k, esperado / k


def _resumen(x):
    x = np.asarray(x, dtype=float) * 100
    return {"media": float(x.mean()), "desvio": float(x.std(ddof=1)) if len(x) > 1 else 0.0,
            "p2_5": float(np.percentile(x, 2.5)), "p97_5": float(np.percentile(x, 97.5))}


def resumir(replicas, claves):
    """Agrega las réplicas de un escenario: precisión, diferencia con la tasa fija y qué tan seguido se ve."""
    salida = {}
    for tramo in ("seleccion", "confirmacion", "todo"):
        realizada = {c: np.array([_agregar(r[c], tramo)[0] for r in replicas]) for c in ("azar", *claves)}
        verdadera = {c: np.array([_agregar(r[c], tramo)[1] for r in replicas]) for c in ("azar", "oraculo", *claves)}
        elegidos = int(sum(x[2] for x in _partes(replicas[0]["azar"], tramo)))
        filas = []
        for c in ("azar", *claves, "oraculo"):
            fila = {"clave": c, "nombre": NOMBRES[c], "precision_verdadera": _resumen(verdadera[c])}
            if c != "oraculo":
                fila["precision_realizada"] = _resumen(realizada[c])
            if c not in ("azar", "oraculo"):
                dv = verdadera[c] - verdadera["tasa_fija"]
                dr = realizada[c] - realizada["tasa_fija"]
                fila.update({
                    "fraccion_del_techo": float(np.mean(verdadera[c] / verdadera["oraculo"])),
                    "diferencia_verdadera_con_tasa_fija": None if c == "tasa_fija" else _resumen(dv),
                    "diferencia_realizada_con_tasa_fija": None if c == "tasa_fija" else _resumen(dr),
                    "es_mejor_que_la_tasa_fija": None if c == "tasa_fija" else float(np.mean(dv > 0)),
                    "se_ve_mejor_en_los_datos": None if c == "tasa_fija" else float(np.mean(dr > 0))})
            filas.append(fila)
        salida[tramo] = {"elegidos_por_replica": elegidos, "filas": filas}
    return salida


# --- Fidelidad: el mundo simulado frente a los datos reales -----------------------------------------------------
BARATAS = ("jerarquico_60", "movil_120_mercado", "riesgo_estandarizado")  # Sin ML: se usan para calibrar.
AMPLITUDES = (1.0, 1.2, 1.4, 1.6, 1.8)
REPLICAS_CALIBRACION = 8


def referencia_real(tabla, claves):
    """{clave: {'seleccion', 'confirmacion', 'todo'}}: precisión realizada de cada opción sobre los datos REALES.

    Usa las mismas alternativas y la misma configuración fija que la simulación (no el ajuste por bloque del repo),
    así la comparación con el mundo simulado es de lo mismo. Solo Día < 195.
    """
    atributos, mercados = atributos_de(tabla.catalogo), {c: tabla.mercado(c) for c in tabla.catalogo}
    fuente = fuente_completa(tabla)
    ml._MODELOS.clear()
    bloques = {c: [] for c in ("azar", *claves)}
    for a, b in BLOQUES:
        for clave, alternativa in {"azar": Azar(), **candidatas(a, atributos, mercados, claves)}.items():
            acum = []
            simular(tabla, alternativa, a, b, fuente,
                    al_elegir=lambda t, vins, elegidos, acum=acum: acum.append(
                        (sum(v.calibrada for v in elegidos), 0.0, len(elegidos))))
            bloques[clave].append(tuple(np.sum(acum, axis=0)))
    ml._MODELOS.clear()
    return {c: {tramo: _agregar(x, tramo)[0] for tramo in ("seleccion", "confirmacion", "todo")}
            for c, x in bloques.items()}


def calibrar_amplitud(tabla, mundo, real, atributos, mercados, replicas=REPLICAS_CALIBRACION):
    """Amplitud del mundo (de AMPLITUDES) que acerca más las opciones sin ML a las reales en la selección.

    Mide con las estimaciones reales de Día <= 194, nunca con la prueba final. Devuelve (amplitud, tabla de la grilla).
    """
    grilla = []
    for i, amplitud in enumerate(AMPLITUDES):
        corridas = [evaluar_replica(tabla, mundo, ESCENARIOS["base"], np.random.default_rng([SEMILLA, 99, i, r]), BARATAS,
                                    atributos, mercados, amplitud) for r in range(replicas)]
        simulada = {c: float(np.mean([_agregar(r[c], "seleccion")[0] for r in corridas])) for c in BARATAS}
        error = float(np.sqrt(np.mean([(simulada[c] - real[c]["seleccion"]) ** 2 for c in BARATAS])))
        grilla.append({"amplitud": amplitud, "error_cuadratico_medio_puntos": error * 100,
                       "simulada": {c: v * 100 for c, v in simulada.items()}})
    return min(grilla, key=lambda g: g["error_cuadratico_medio_puntos"])["amplitud"], grilla


def fidelidad(replicas, real, claves):
    """Por opción: precisión realizada media del mundo simulado frente a la real, en cada tramo."""
    filas = []
    for c in ("azar", *claves):
        fila = {"clave": c, "nombre": NOMBRES[c]}
        for tramo in ("seleccion", "confirmacion", "todo"):
            sim = np.array([_agregar(r[c], tramo)[0] for r in replicas]) * 100
            fila[tramo] = {"real": real[c][tramo] * 100, "simulada": float(sim.mean()),
                           "simulada_p2_5": float(np.percentile(sim, 2.5)), "simulada_p97_5": float(np.percentile(sim, 97.5))}
        filas.append(fila)
    return filas


def correr(tabla, opciones=None, replicas=None, escenarios=None, claves=CANDIDATAS, al_terminar=None, amplitud=None):
    assert not tabla.desbloqueada, "La simulación no relee la prueba final"
    assert all(b <= DIA_MAX for _, b in BLOQUES), "Solo Día < 195"
    replicas = replicas or getattr(opciones, "replicas", None) or REPLICAS
    mundo = estimar_mundo(tabla)
    atributos, mercados = atributos_de(tabla.catalogo), {c: tabla.mercado(c) for c in tabla.catalogo}
    real = referencia_real(tabla, claves)
    grilla = None
    if amplitud is None:
        amplitud, grilla = calibrar_amplitud(tabla, mundo, real, atributos, mercados)
    if al_terminar:
        al_terminar(f"calibración (amplitud {amplitud})", 0.0)
    nombres = list(escenarios or ESCENARIOS)
    resultados, corridas_base = {}, None
    for i, nombre in enumerate(nombres):
        inicio = time.time()
        corridas = [evaluar_replica(tabla, mundo, ESCENARIOS[nombre], np.random.default_rng([SEMILLA, i, r]), claves,
                                    atributos, mercados, amplitud) for r in range(replicas)]
        resultados[nombre] = {"escenario": ESCENARIOS[nombre], "replicas": replicas, **resumir(corridas, claves)}
        if nombre == "base":
            corridas_base = corridas
        if al_terminar:
            al_terminar(nombre, time.time() - inicio)
    return {"pieza": "Simulación de un mundo con verdad conocida (#33)",
            "rotulo": "simulación, no evidencia sobre la planta; Día < 195; prueba final no releída; no elegible",
            "protocolo": {"bloques_seleccion": [list(b) for b in BLOQUES_SELECCION], "confirmacion": list(CONFIRMACION),
                          "margen_dias": MARGEN, "replicas": replicas, "semilla": SEMILLA, "candidatas": list(claves),
                          "configuracion_fija": "la de los preregistros: RF min_samples_leaf 5, vida 15, semilla 4; "
                                                "CatBoost l2 10, vida 15, semilla 1; logística C 1, vida 60; sin ajuste por "
                                                "bloque"},
            "mundo": {"desvio_entre_codigos_log": mundo.desvio, "nivel_general": {"min": float(mundo.nivel[1:].min()),
                                                                                    "max": float(mundo.nivel[1:].max())},
                      "riesgo_relativo_por_mercado": {m or "sin mercado": float(v) for m, v in sorted(mundo.rr_mercado.items())},
                      "codigos": len(mundo.codigos), "ajustado_con": f"Día <= {DIA_MAX}",
                      "amplitud": amplitud, "calibracion": grilla},
            "fidelidad_escenario_base": fidelidad(corridas_base, real, claves) if corridas_base else None,
            "escenarios": resultados, "version_codigo": version_codigo()}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv", required=True, type=Path)
    parser.add_argument("--catalogo", required=True, type=Path)
    parser.add_argument("--cache", type=Path, default=CACHE)
    parser.add_argument("--salida", type=Path, default=SALIDA, help="JSON con agregados, sin filas individuales")
    parser.add_argument("--replicas", type=int, default=REPLICAS)
    parser.add_argument("--escenarios", default=",".join(ESCENARIOS))
    parser.add_argument("--catboost", action="store_true", help="Suma CatBoost con atributos (más lento)")
    opciones = parser.parse_args(argv)
    tabla = cargar(opciones.csv, opciones.catalogo, cache=opciones.cache)
    resultado = correr(tabla, replicas=opciones.replicas, escenarios=opciones.escenarios.split(","),
                       claves=CON_CATBOOST if opciones.catboost else CANDIDATAS,
                       al_terminar=lambda n, s: print(f"simulacion: {n} listo ({s:.0f} s)", flush=True))
    opciones.salida.parent.mkdir(parents=True, exist_ok=True)
    opciones.salida.write_text(json.dumps(resultado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(opciones.salida)


if __name__ == "__main__":
    main()
