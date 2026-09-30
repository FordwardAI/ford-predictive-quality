"""Elección de la ganadora entre P3 y P4 con la regla de #10 (solo validación)."""
import json

from .cupo import Diario, elegir, remuestreos
from .datos import RAIZ
from .puntaje import crear

RESULTADOS = RAIZ / "solucion" / "resultados"
PROVISORIA = {"familia": "movil", "parametros": {"ventana": 60, "peso": 20}}  # Hasta que exista eleccion.json.


def _diario(r):
    import numpy as np
    return Diario(*(np.array(r["diario"][k], dtype=float) for k in ("dias", "n", "k", "cal", "cal_elegidas")))


def candidatas():
    salida = []
    for pieza in ("p3", "p4"):
        archivo = RESULTADOS / f"{pieza}.json"
        if archivo.exists():
            salida += [r for r in json.loads(archivo.read_text(encoding="utf-8"))["resultados"] if "diario" in r]
    return salida


def correr(tabla=None, opciones=None):
    resultados = candidatas()
    idx = remuestreos(len(resultados[0]["diario"]["dias"]))
    ganadora, detalle = elegir([(r, _diario(r)) for r in resultados], idx)
    return {"pieza": "Elección en validación", "regla": "mayor precisión en el cupo; empate si el rango pareado por "
            "días de la diferencia con la mejor incluye 0; entre empatadas, la más simple (#10, punto 8)",
            "piezas_consideradas": sorted({r["familia"] for r in resultados}),
            **detalle,
            "ganadora": {k: ganadora[k] for k in ("alternativa", "familia", "parametros", "precision_cupo",
                                                  "precision_rango95", "veces_azar", "veces_azar_rango95",
                                                  "recupero", "lectura", "calificador")}}


def ganadora(tabla):
    """La alternativa ganadora reconstruida; la provisoria si todavía no hay elección."""
    archivo = RESULTADOS / "eleccion.json"
    g = json.loads(archivo.read_text(encoding="utf-8"))["ganadora"] if archivo.exists() else PROVISORIA
    return crear(g["familia"], g["parametros"], tabla)
