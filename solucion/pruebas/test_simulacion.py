"""Simulación de un mundo con verdad conocida: nada de Día >= 195, mundo reproducible y propiedades que deben cumplirse."""
import numpy as np

from solucion.experimentos import simulacion as sim
from solucion.pruebas.sintetico import tabla


def _tabla():
    return tabla(dias=range(1, 261), por_dia=40)


def test_el_mundo_se_ajusta_solo_con_dia_menor_o_igual_a_194():
    t = _tabla()
    recortada = type(t)(**{**t.__dict__, "vins": [v for v in t.vins if v.dia <= 194]})
    a, b = sim.estimar_mundo(t), sim.estimar_mundo(recortada)
    assert np.array_equal(a.nivel, b.nivel) and a.rr_mercado == b.rr_mercado and a.desvio == b.desvio
    assert len(a.nivel) == 195 and (a.nivel > 0).all() and a.desvio >= 0


def test_la_tabla_sintetica_no_tiene_dias_de_la_prueba_final_ni_etiquetas_enmascaradas():
    t = _tabla()
    mundo = sim.estimar_mundo(t)
    s, p = sim.construir(t, mundo, sim.ESCENARIOS["base"], np.random.default_rng(1))
    assert max(v.dia for v in s.vins) <= 194 and not s.desbloqueada
    assert {v.etiqueta for v in s.vins} <= {"CALIBRADA", "OK"} and len(p) == len(s.vins)
    assert all(0 < x <= sim.RIESGO_MAXIMO for x in p.values())
    # La estructura de días y códigos es la real; solo las etiquetas son simuladas.
    reales = [v for v in t.vins if v.dia <= 194]
    assert [(v.vin, v.dia, v.codigo) for v in s.vins] == [(v.vin, v.dia, v.codigo) for v in reales]


def test_el_mundo_es_reproducible_con_la_misma_semilla_y_cambia_con_otra():
    t = _tabla()
    mundo = sim.estimar_mundo(t)
    uno = sim.construir(t, mundo, sim.ESCENARIOS["base"], np.random.default_rng(7))
    otro = sim.construir(t, mundo, sim.ESCENARIOS["base"], np.random.default_rng(7))
    distinto = sim.construir(t, mundo, sim.ESCENARIOS["base"], np.random.default_rng(8))
    assert uno[1] == otro[1] and [v.etiqueta for v in uno[0].vins] == [v.etiqueta for v in otro[0].vins]
    assert uno[1] != distinto[1]


def test_con_mezcla_estable_los_codigos_se_remuestrean_y_con_la_real_no():
    t = _tabla()
    mundo = sim.estimar_mundo(t)
    real, _ = sim.construir(t, mundo, sim.ESCENARIOS["base"], np.random.default_rng(1))
    estable, _ = sim.construir(t, mundo, sim.ESCENARIOS["mezcla_estable"], np.random.default_rng(1))
    original = [v.codigo for v in t.vins if v.dia <= 194]
    assert [v.codigo for v in real.vins] == original
    assert [v.codigo for v in estable.vins] != original and len(estable.vins) == len(original)


def test_sin_senal_toda_opcion_tiene_la_precision_verdadera_del_azar_y_de_la_mejor_seleccion():
    t = _tabla()
    mundo = sim.estimar_mundo(t)
    plano = sim.Mundo(nivel=np.full(195, 0.1), rr_mercado={m: 1.0 for m in set(mundo.mercados.values())}, desvio=0.0,
                      mercados=mundo.mercados, codigos=mundo.codigos)
    escenario = {"mezcla": "real", "heterogeneidad": 0.0, "deriva": 0.0}
    r = sim.evaluar_replica(t, plano, escenario, np.random.default_rng(3), ("tasa_fija", "jerarquico_60"),
                            sim.atributos_de(t.catalogo), {c: t.mercado(c) for c in t.catalogo})
    for tramo in ("seleccion", "confirmacion", "todo"):
        verdaderas = {c: sim._agregar(r[c], tramo)[1] for c in ("azar", "tasa_fija", "jerarquico_60", "oraculo")}
        assert max(verdaderas.values()) - min(verdaderas.values()) < 1e-9, verdaderas


def test_la_mejor_seleccion_posible_nunca_es_superada_y_el_azar_no_la_supera():
    t = _tabla()
    mundo = sim.estimar_mundo(t)
    atributos, mercados = sim.atributos_de(t.catalogo), {c: t.mercado(c) for c in t.catalogo}
    claves = ("tasa_fija", "jerarquico_60", "movil_120_mercado")
    for semilla in (1, 2):
        r = sim.evaluar_replica(t, mundo, sim.ESCENARIOS["base"], np.random.default_rng(semilla), claves, atributos,
                                mercados)
        for bloque in range(len(sim.BLOQUES)):
            techo = r["oraculo"][bloque][1]
            assert all(r[c][bloque][1] <= techo + 1e-9 for c in ("azar", *claves))
            assert all(r[c][bloque][2] == r["oraculo"][bloque][2] for c in claves)  # Mismo cupo.


def test_una_opcion_con_informacion_supera_al_azar_en_un_mundo_con_senal():
    t = _tabla()
    mundo = sim.estimar_mundo(t)
    atributos, mercados = sim.atributos_de(t.catalogo), {c: t.mercado(c) for c in t.catalogo}
    fuerte = {"mezcla": "real", "heterogeneidad": 1.0, "deriva": 0.0, "amplitud": 3.0}
    replicas = [sim.evaluar_replica(t, mundo, fuerte, np.random.default_rng(s), ("tasa_fija",), atributos, mercados)
                for s in range(3)]
    azar = np.mean([sim._agregar(r["azar"], "todo")[1] for r in replicas])
    fija = np.mean([sim._agregar(r["tasa_fija"], "todo")[1] for r in replicas])
    techo = np.mean([sim._agregar(r["oraculo"], "todo")[1] for r in replicas])
    assert azar < fija <= techo + 1e-9


def test_el_resumen_cuenta_cuantas_veces_una_opcion_es_mejor_y_cuantas_se_ve_mejor():
    def replica(fija, otra, techo):
        # [(aciertos, suma de p, elegidos)] por bloque; los 5 bloques con el mismo valor.
        def bloques(valor):
            return [(valor * 10, valor * 10, 10)] * len(sim.BLOQUES)
        return {"azar": bloques(.1), "tasa_fija": bloques(fija), "otra": bloques(otra), "oraculo": bloques(techo)}

    sim.NOMBRES.setdefault("otra", "otra")
    replicas = [replica(.15, .17, .2), replica(.15, .14, .2), replica(.15, .16, .2), replica(.15, .18, .2)]
    fila = next(f for f in sim.resumir(replicas, ("tasa_fija", "otra"))["todo"]["filas"] if f["clave"] == "otra")
    assert fila["es_mejor_que_la_tasa_fija"] == .75 and fila["se_ve_mejor_en_los_datos"] == .75
    assert abs(fila["diferencia_verdadera_con_tasa_fija"]["media"] - 1.25) < 1e-9  # (+2 −1 +1 +3) / 4 puntos
    assert abs(fila["fraccion_del_techo"] - np.mean([.17, .14, .16, .18]) / .2) < 1e-9
