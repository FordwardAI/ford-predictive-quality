"""Simulación sobre la base: cada día de validación, el modelo llena el cupo diario y se compara con el azar.

Usa el evaluador de la solución (`cupo.simular`, `cupo.metricas`): mismas semillas, mismo cupo y Día ≤ t − 5.
Solo devuelve agregados por día; nunca un VIN ni una tasa por unidad.
"""
import json

import numpy as np

from solucion.cupo import CALIFICADOR, metricas, remuestreos, simular, version_codigo
from solucion.datos import TRAMOS
from solucion.puntaje import crear

VALIDACION = TRAMOS["validacion"]
TRAMO = "validación {}–{}".format(*VALIDACION)


def _serie(d):
    esperado = d.k * np.divide(d.cal, d.n, out=np.zeros_like(d.cal), where=d.n > 0)
    return [{"dia": int(t), "unidades": int(n), "cupo": int(k), "calibrada_dia": int(c), "encontradas": int(e),
             "esperado_azar": round(float(x), 4)}
            for t, n, k, c, e, x in zip(d.dias, d.n, d.k, d.cal, d.cal_elegidas, esperado)]


def _metricas(d, idx):
    m = metricas(d, idx)
    claves = ("dias", "vins", "elegidos", "calibrada_elegidas", "calibrada_tramo", "precision_cupo",
              "precision_rango95", "azar_mismo_cupo", "veces_azar", "veces_azar_rango95", "lectura")
    return {k: m[k] for k in claves}


def correr(tabla, modelos, lo=VALIDACION[0], hi=VALIDACION[1], otras_semillas=None):
    """{clave: {serie, metricas}} para cada modelo y para el azar simulado (sorteo con semilla).

    `otras_semillas` {clave: [puntajes con otra semilla]}: los modelos estocásticos informan cuánto varían los
    aciertos entre semillas, para no presentar una sola corrida como la cifra exacta.
    """
    salida = {}
    diarios = {"azar": simular(tabla, crear("azar", {}), lo, hi)}
    for clave, puntaje in modelos.items():
        diarios[clave] = simular(tabla, puntaje, lo, hi)
    idx = remuestreos(len(diarios["azar"].dias))
    for clave, d in diarios.items():
        salida[clave] = {"serie": _serie(d), "metricas": _metricas(d, idx)}
    for clave, puntajes in (otras_semillas or {}).items():
        aciertos = [salida[clave]["metricas"]["calibrada_elegidas"]]
        aciertos += [int(simular(tabla, p, lo, hi).cal_elegidas.sum()) for p in puntajes]
        salida[clave]["semillas"] = {"n": len(aciertos), "min": min(aciertos), "max": max(aciertos)}
    n = salida["azar"]["metricas"]["vins"]
    return {"tramo": TRAMO, "calificador": CALIFICADOR.format(tramo=TRAMO, n=f"{n:,}".replace(",", ".")),
            "modelos": salida}


def cacheada(tabla, modelos, carpeta, otras_semillas=None):
    """La simulación tarda (los modelos reentrenados): se guarda fuera del repo con la huella de fuente y código."""
    sha = tabla.fuente.get("csv_sha256", "")[:16]
    archivo = carpeta / f"simulacion-{sha}-{version_codigo()[:12]}.json"
    if archivo.exists():
        return json.loads(archivo.read_text(encoding="utf-8"))
    resultado = correr(tabla, modelos, otras_semillas=otras_semillas)
    carpeta.mkdir(parents=True, exist_ok=True)
    archivo.write_text(json.dumps(resultado, ensure_ascii=False), encoding="utf-8")
    return resultado
