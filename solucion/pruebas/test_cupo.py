"""Cupo diario, desempate con semilla, bootstrap por días y regla de elección."""
import numpy as np

from solucion import cupo
from solucion.cupo import Diario, diario, elegir, metricas, remuestreos, resultado, seleccionar, simular
from solucion.puntaje import Puntaje, semilla_dia
from solucion.pruebas.sintetico import tabla


class Fijas(Puntaje):
    """Tasas fijas con empates: dos códigos comparten la mayor tasa."""
    nombre, familia, orden = "fijas", "prueba", (1,)

    def __init__(self, tasas, orden=(1,), nombre="fijas"):
        self.tasas, self.orden, self.nombre = tasas, orden, nombre

    def puntuar(self, ctx, codigos):
        return {c: self.tasas.get(c, 0.0) for c in codigos}


def test_k_d():
    assert [cupo.cupo(n) for n in (0, 1, 19, 20, 39, 40, 265, 8038)] == [0, 1, 1, 1, 1, 2, 13, 401]


def test_desempate_con_semilla():
    t = tabla()
    vins = t.por_dia(160, 160)[160]
    tasas = {"AAA1": 0.3, "AAB1": 0.3, "ABA1": 0.1, "ABB1": 0.0}
    elegidos = [v.vin for v in seleccionar(vins, tasas, 5, semilla_dia(cupo.SEMILLA_DESEMPATE, 160))]
    assert elegidos == ["SYN160028", "SYN160004", "SYN160001", "SYN160036", "SYN160020"], elegidos
    assert {v.codigo for v in seleccionar(vins, tasas, 20, semilla_dia(1, 160))} == {"AAA1", "AAB1"}


def test_simulacion_y_bootstrap_fijos():
    t = tabla(por_dia=60)
    idx = remuestreos(40, r=200)
    d = simular(t, Fijas({"AAA1": 0.3, "AAB1": 0.3}), 155, 194)
    m = metricas(d, idx)
    assert (m["dias"], m["elegidos"], m["calibrada_elegidas"]) == (40, 120, 18), m
    assert round(m["azar_mismo_cupo"], 4) == 0.1354 and m["lectura"] == "inconcluso", m
    assert [round(x, 4) for x in m["precision_rango95"]] == [0.0915, 0.2252], m["precision_rango95"]


def test_veces_el_azar_pondera_por_cupo():
    d = Diario(dias=np.array([1.0, 2.0]), n=np.array([100.0, 20.0]), k=np.array([5.0, 1.0]),
               cal=np.array([10.0, 10.0]), cal_elegidas=np.array([1.0, 1.0]))
    m = metricas(d, np.array([[0, 1]]))
    assert abs(m["azar_mismo_cupo"] - (5 * 0.1 + 1 * 0.5) / 6) < 1e-12
    assert abs(m["precision_cupo"] - 2 / 6) < 1e-12


def test_elegir_prefiere_la_simple_si_empatan():
    base = diario([(d, 100, 5, 10, 1) for d in range(1, 31)])
    apenas_mejor = diario([(d, 100, 5, 10, 1 + (d == 1)) for d in range(1, 31)])
    mucho_mejor = diario([(d, 100, 5, 10, 4) for d in range(1, 31)])
    idx = remuestreos(30, r=300)
    t = tabla(dias=range(1, 3))
    simple = resultado(Fijas({}, (1,), "simple"), base, idx, t, "x")
    compleja = resultado(Fijas({}, (5,), "compleja"), apenas_mejor, idx, t, "x")
    ganadora, _ = elegir([(simple, base), (compleja, apenas_mejor)], idx)
    assert ganadora["alternativa"] == "simple"
    fuerte = resultado(Fijas({}, (9,), "fuerte"), mucho_mejor, idx, t, "x")
    ganadora, tabla_empates = elegir([(simple, base), (fuerte, mucho_mejor)], idx)
    assert ganadora["alternativa"] == "fuerte", tabla_empates
