"""Los modelos que puede usar la plataforma para ordenar los códigos.

Por qué CatBoost va por defecto, y cómo rinde cada uno, está en docs/entrega/06-conclusiones.md y en research/: es
evidencia del equipo, no se muestra en la plataforma.
"""
from solucion import ml, referencias  # noqa: F401  Registran las familias que reconstruye `crear`.
from solucion.cupo import fuente_completa
from solucion.eleccion import ganadora
from solucion.puntaje import atributos_de, crear

POR_DEFECTO = "catboost"
SEMILLAS = {"rf": 4, "catboost": 1}  # Las de los preregistros (semilla 4: la corrida mediana de RF; semilla 1: CatBoost).

FICHAS = {
    "catboost": {
        "nombre": "CatBoost con atributos", "corto": "CatBoost",
        "detalle": "Reentrenado cada 5 días con las auditorías de resultado conocido (Día ≤ t − 5). "
                   "Entradas: el código y sus atributos (mercado, motor, tracción, versión).",
        "base": "catboost", "familia": "ml_catboost_atributos",
    },
    "rf": {
        "nombre": "Random Forest con atributos", "corto": "Random Forest",
        "detalle": "Reentrenado cada 5 días, mismas entradas que CatBoost, con la configuración preregistrada (semilla 4).",
        "base": "rf", "familia": "ml_rf_atributos",
    },
    "tasa_fija": {
        "nombre": "Tasa fija por código", "corto": "Tasa fija",
        "detalle": "Proporción CALIBRADA de cada código con los resultados conocidos, sin reentrenar entre versiones.",
    },
}


ESTOCASTICOS = ("rf", "catboost")


def construir(tabla, semilla=None):
    """{clave: puntaje} con la configuración de validación (ancla 155; ajuste por log-loss interna ≤ 149).

    Sin `semilla`, los modelos estocásticos usan la de su preregistro (`SEMILLAS`). Los hiperparámetros y la vida media
    salen del ajuste interno con Día ≤ 149 (`ml.ajustar`): ajustarlos con días posteriores filtraría la validación.
    """
    fuente = fuente_completa(tabla)
    atributos = atributos_de(tabla.catalogo)
    salida = {"tasa_fija": ganadora(tabla)}
    for clave in ESTOCASTICOS:
        f = FICHAS[clave]
        a = ml.ajustar(f["base"], "reentrenado", fuente, atributos=atributos)
        salida[clave] = crear(f["familia"], {"modo": "reentrenado", "semilla": semilla or SEMILLAS[clave],
                                             "vida": a["vida"], "hiperparametros": a["hiperparametros"]}, tabla)
    return salida


def fichas():
    return [{"clave": c, **{k: v for k, v in f.items() if k not in ("base", "familia")}, "por_defecto": c == POR_DEFECTO}
            for c, f in FICHAS.items()]
