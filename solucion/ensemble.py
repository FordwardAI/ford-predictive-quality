"""CatBoost con atributos + tasa móvil hacia mercado: experimento exploratorio, solo Día <195."""
import platform

import catboost
import numpy as np

from . import ml
from .cupo import diferencia, elegir_por_precision, fuente_completa, metricas, remuestreos, resultado, simular
from .precision import BLOQUES_SELECCION, CONFIRMACION, _precision, _unir
from .puntaje import Puntaje, atributos_de
from .referencias import MovilMercado, PESO, VENTANAS

PESOS_CATBOOST = (0.25, 0.5, 0.75)


class Mezcla(Puntaje):
    familia, elegible = "ensemble_experimental", False

    def __init__(self, catboost, movil, peso):
        if not np.isfinite(peso) or not 0 <= peso <= 1:
            raise ValueError("El peso de CatBoost debe estar entre 0 y 1")
        self.catboost, self.movil, self.peso = catboost, movil, peso
        self.nombre = f"CatBoost {peso:.0%} + móvil mercado {1-peso:.0%}, {movil.ventana} d"
        self.parametros = {"peso_catboost": peso, "movil": movil.parametros, "catboost": catboost.parametros}

    def puntuar(self, ctx, codigos):
        if self.peso == 0:
            return self.movil.puntuar(ctx, codigos)
        if self.peso == 1:
            return self.catboost.puntuar(ctx, codigos)
        a, b = self.catboost.puntuar(ctx, codigos), self.movil.puntuar(ctx, codigos)
        return {c: self.peso * a[c] + (1 - self.peso) * b[c] for c in codigos}


def correr(tabla, opciones=None):
    assert not tabla.desbloqueada, "El ensemble no puede leer la prueba final"
    bloques = (*BLOQUES_SELECCION, CONFIRMACION)
    assert max(b for _, b in bloques) < 195
    fuente = fuente_completa(tabla)
    atributos = atributos_de(tabla.catalogo)
    mercados = {c: a.get("mercado") for c, a in tabla.catalogo.items()}
    diarios, modelos, ajustes = {}, {}, []
    for a, b in bloques:
        ajuste = ml.ajustar("catboost", "reentrenado", fuente, ancla=a, atributos=atributos)
        ajustes.append({"bloque": [a, b], **ajuste})
        for semilla in ml.SEMILLAS:
            cat = ml.BASES_ATRIBUTOS["catboost"]("reentrenado", ajuste["hiperparametros"], semilla,
                                               vida=ajuste["vida"], ancla=a, atributos=atributos)
            alternativas = {"catboost": cat}
            for ventana in VENTANAS:
                movil = MovilMercado(ventana, PESO, mercados)
                alternativas[f"movil_{ventana}"] = movil
                for peso in PESOS_CATBOOST:
                    alternativas[f"mezcla_{ventana}_{peso}"] = Mezcla(cat, movil, peso)
            for clave, modelo in alternativas.items():
                diarios.setdefault((clave, semilla), []).append(simular(tabla, modelo, a, b, fuente))
                modelos.setdefault((clave, semilla), modelo)
        print(f"ensemble: bloque {a}–{b} listo", flush=True)
    primaria = ml.SEMILLAS[0]  # Fijada antes de correr; nunca se elige por rendimiento.
    seleccion = {c: _unir(ds[:-1]) for (c, s), ds in diarios.items() if s == primaria}
    confirmacion = {c: ds[-1] for (c, s), ds in diarios.items() if s == primaria}
    idx_sel = remuestreos(len(seleccion["catboost"].dias))
    idx_conf = remuestreos(len(confirmacion["catboost"].dias))
    filas = []
    for c, ds in seleccion.items():
        r = resultado(modelos[(c, primaria)], ds, idx_sel, tabla, "selección 100–174")
        r.update(clave=c, precision_por_bloque=[_precision(d) for d in diarios[(c, primaria)][:-1]],
                 confirmacion=metricas(confirmacion[c], idx_conf))
        filas.append(r)
    # La elegibilidad para elegir en este experimento no cambia la elegibilidad operativa de los modelos.
    def elegir(filtro):
        return elegir_por_precision([{**r, "elegible": True} for r in filas if filtro(r["clave"])])[0]["clave"]
    mezcla = elegir(lambda c: c.startswith("mezcla_"))
    individual = elegir(lambda c: not c.startswith("mezcla_"))
    for r in filas:
        c = r["clave"]
        for ref in ("catboost", individual):
            r.setdefault("diferencias", {})[ref] = {
                "seleccion_rango95": diferencia(seleccion[ref], seleccion[c], idx_sel),
                "confirmacion_rango95": diferencia(confirmacion[ref], confirmacion[c], idx_conf)}
    estabilidad = []
    for semilla in ml.SEMILLAS:
        por_tramo = {}
        for nombre, posicion, idx in (("seleccion", None, idx_sel), ("confirmacion", -1, idx_conf)):
            ds = {c: _unir(diarios[(c, semilla)][:-1]) if posicion is None else diarios[(c, semilla)][posicion]
                  for c in (mezcla, individual, "catboost")}
            por_tramo[nombre] = {"mezcla": metricas(ds[mezcla], idx),
                                "mejor_individual": metricas(ds[individual], idx),
                                "catboost": metricas(ds["catboost"], idx),
                                "diferencia_con_individual_rango95": diferencia(ds[individual], ds[mezcla], idx)}
        estabilidad.append({"semilla": semilla, **por_tramo})
    return {"pieza": "CatBoost + tasa móvil suavizada hacia mercado", "fuente": tabla.fuente,
            "entorno": {"python": platform.python_version(), "plataforma": platform.platform(),
                        "catboost": catboost.__version__, "numpy": np.__version__},
            "protocolo": {"bloques_seleccion": BLOQUES_SELECCION, "confirmacion": CONFIRMACION,
                          "pesos_catboost": PESOS_CATBOOST, "ventanas": VENTANAS, "peso_suavizado": PESO,
                          "semilla_primaria": primaria, "semillas_estabilidad": ml.SEMILLAS,
                          "eleccion": "mayor precisión en selección; desempate por varianza y nombre",
                          "limites": "Exploratorio: selección y confirmación ya vistas; rangos sin ajuste por "
                                     "comparaciones múltiples; base ficticia, auditados con actividad QLS. "
                                     "Prueba final no releída; no cambia la solución ni el preregistro."},
            "mezcla_elegida": mezcla, "mejor_individual": individual, "ajustes_por_bloque": ajustes,
            "resultados": filas, "estabilidad_peso_y_ventana_congelados": estabilidad}
