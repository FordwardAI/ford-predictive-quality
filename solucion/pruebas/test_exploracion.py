"""Etiquetas parciales: solo lo elegido alimenta la política; el mínimo por código rota."""
import numpy as np

from solucion.exploracion import Politica, elegir_dia, simular_parcial
from solucion.puntaje import Contexto, Fuente, Puntaje
from solucion.pruebas.sintetico import tabla


class Espia(Puntaje):
    """Registra cuántas etiquetas ve por día; tasas fijas para que el ranking sea conocido."""
    nombre, familia, orden = "espía", "prueba", (1,)

    def __init__(self):
        self.vistos = {}

    def puntuar(self, ctx, codigos):
        conocidas = ctx.conocidas(ctx.t - 5)
        self.vistos[ctx.t] = sum(n for n, _ in conocidas.por_codigo().values())
        return {c: {"AAA1": 0.3, "AAB1": 0.2, "ABA1": 0.1, "ABB1": 0.0}[c] for c in codigos}


def test_solo_lo_elegido_alimenta_la_politica():
    t = tabla()
    espia = Espia()
    simular_parcial(t, espia, Politica("voraz", "voraz", {}), 155, 194)
    antes = sum(1 for v in t.vins if v.dia <= 149)
    # Día 160: ve el histórico <= 149 y lo elegido el 155 (cupo 2 con 40 VIN); 150–154 no aportan etiquetas.
    assert espia.vistos[160] == antes + 2, espia.vistos[160]


def test_minimo_por_codigo_explora_el_vencido_primero():
    t = tabla()
    vins = t.por_dia(170, 170)[170]
    ctx = Contexto(Fuente([]), 170)
    ultima = {"AAA1": 169, "AAB1": 169, "ABA1": 169, "ABB1": 100}
    elegidos = elegir_dia(Politica("min", "minimo", {"P": 20}), Espia(), ctx, vins, 2, ultima,
                          np.random.default_rng(1), np.random.default_rng(2))
    assert [v.codigo for v in elegidos] == ["ABB1", "AAA1"]


def test_voraz_con_etiquetas_completas_no_explora():
    t = tabla()
    vins = t.por_dia(170, 170)[170]
    elegidos = elegir_dia(Politica("voraz", "voraz", {}), Espia(), Contexto(Fuente([]), 170), vins, 2, {},
                          np.random.default_rng(1), np.random.default_rng(2))
    assert {v.codigo for v in elegidos} == {"AAA1"}
