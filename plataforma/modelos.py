"""Los tres modelos que puede usar la plataforma para ordenar los códigos, con lo ya publicado de cada uno.

Las cifras de validación y de prueba final se leen de `solucion/resultados/`: la plataforma no relee la prueba final.
"""
import json

from solucion import ml, referencias  # noqa: F401  Registran las familias que reconstruye `crear`.
from solucion.cupo import fuente_completa
from solucion.datos import RAIZ
from solucion.eleccion import ganadora
from solucion.puntaje import atributos_de, crear

RESULTADOS = RAIZ / "solucion" / "resultados"
POR_DEFECTO = "rf"

FICHAS = {
    "rf": {
        "nombre": "Random Forest con atributos", "corto": "Random Forest",
        "detalle": "Reentrenado cada 5 días con las auditorías de resultado conocido (Día ≤ t − 5). "
                   "Entradas: el código y sus atributos (mercado, motor, tracción, versión).",
        "origen": "Elegido por efectividad el 01/10: la mejor peor lectura entre validación, selección y confirmación.",
        "advertencia": "No está probado que supere a sus parecidas; nunca se leyó en la prueba final.",
        "base": "rf", "familia": "ml_rf_atributos",
    },
    "catboost": {
        "nombre": "CatBoost con atributos", "corto": "CatBoost",
        "detalle": "Reentrenado cada 5 días, mismas entradas que Random Forest.",
        "origen": "Segunda lectura de la prueba final (30/09), elegido por precisión en bloques de tiempo.",
        "advertencia": "Su lectura final ocurrió después de conocer la primera: evidencia más débil.",
        "base": "catboost", "familia": "ml_catboost_atributos",
    },
    "tasa_fija": {
        "nombre": "Tasa fija por código", "corto": "Tasa fija",
        "detalle": "Proporción CALIBRADA de cada código con los resultados hasta el Día 149, sin reentrenar.",
        "origen": "Ganadora preregistrada del 30/09 (regla de la más simple entre las que empatan).",
        "advertencia": "Pierde precisión cuando rota la mezcla de códigos.",
    },
}


def _json(nombre):
    archivo = RESULTADOS / nombre
    return json.loads(archivo.read_text(encoding="utf-8")) if archivo.exists() else None


ESTOCASTICOS = ("rf", "catboost")


def construir(tabla, semilla=None):
    """{clave: puntaje} con la configuración de validación (ancla 155; ajuste por log-loss interna ≤ 149).

    Sin `semilla`, los modelos estocásticos usan la del ajuste (la primera de `ml.SEMILLAS`).
    """
    fuente = fuente_completa(tabla)
    atributos = atributos_de(tabla.catalogo)
    salida = {"tasa_fija": ganadora(tabla)}
    for clave in ESTOCASTICOS:
        f = FICHAS[clave]
        a = ml.ajustar(f["base"], "reentrenado", fuente, atributos=atributos)
        salida[clave] = crear(f["familia"], {"modo": "reentrenado", "semilla": semilla or a["semilla_ajuste"],
                                             "vida": a["vida"], "hiperparametros": a["hiperparametros"]}, tabla)
    return salida


def prueba_final():
    """Lecturas ya registradas de la prueba final, por modelo (sin recalcular)."""
    pf = _json("prueba-final.json") or {"corridas": []}
    salida = {}
    for corrida in pf["corridas"]:
        familia = corrida["ganadora"]["familia"]
        clave = "tasa_fija" if familia == "tasa_fija" else "catboost" if "catboost" in familia else None
        principal = next((t for t in corrida["tramos"] if t.get("lectura_del_tramo") == "principal"), None)
        if clave and principal:
            g, azar = principal["ganadora"], principal.get("azar_simulado", {})
            salida[clave] = {"precision": g["precision_cupo"], "rango": g["precision_rango95"],
                             "azar": g["azar_mismo_cupo"], "veces_azar": g["veces_azar"],
                             "elegidos": g["elegidos"], "calibrada_elegidas": g["calibrada_elegidas"],
                             "dias": principal["dias_del_vin"], "calificador": g["calificador"],
                             "azar_simulado": azar.get("precision_cupo"), "fecha": corrida["fecha"][:10]}
    return salida


def fichas():
    final = prueba_final()
    return [{"clave": c, **{k: v for k, v in f.items() if k not in ("base", "familia")},
             "prueba_final": final.get(c), "por_defecto": c == POR_DEFECTO} for c, f in FICHAS.items()]
