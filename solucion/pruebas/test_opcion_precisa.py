"""Opción más precisa: riesgo estandarizado frente a la deriva, sin fuga, códigos nuevos y simulación de playa."""
import numpy as np

from solucion import referencias as R
from solucion.cupo import fuente_completa, simular
from solucion.datos import construir
from solucion.experimentos import opcion_precisa as op
from solucion.puntaje import Contexto
from solucion.pruebas.sintetico import CATALOGO, evento, tabla

MERCADOS = {c: a["mercado"] for c, a in CATALOGO.items()}


def _deriva(invertir_desde=None):
    """AAA1 (riesgo 1) se produce en la época de tasa alta; ABA1 (riesgo 1,6) sobre todo en la de tasa baja."""
    filas = []
    for dia in range(1, 121):
        alta = dia <= 60
        produce = {"AAA1": dia <= 80, "ABA1": dia >= 51}
        calibradas = {"AAA1": 6 if alta else 2, "ABA1": 10 if alta else 3}
        for codigo, activo in produce.items():
            if not activo:
                continue
            for i in range(20):
                cal = i < calibradas[codigo]
                if invertir_desde is not None and dia >= invertir_desde:
                    cal = not cal
                filas.append(evento(f"SYN{codigo}{dia:03d}{i:02d}", dia, codigo, "CALIBRADA" if cal else "OK"))
    return construir(filas, CATALOGO)


def test_el_riesgo_estandarizado_no_confunde_la_deriva_global_con_riesgo_del_codigo():
    t = _deriva()
    ctx = Contexto(fuente_completa(t), 110)
    fija = R.TasaFija(hasta=105).puntuar(ctx, ["AAA1", "ABA1"])
    sir = op.RiesgoEstandarizado(vida=None, kappa=1, mercados=MERCADOS).puntuar(ctx, ["AAA1", "ABA1"])
    assert fija["AAA1"] > fija["ABA1"]  # La tasa fija premia haberse producido cuando la tasa general era alta.
    assert sir["ABA1"] > sir["AAA1"]


def test_el_riesgo_estandarizado_solo_usa_resultados_de_dia_t_menos_5():
    original, alterada = _deriva(), _deriva(invertir_desde=96)
    p = op.RiesgoEstandarizado(vida=60, kappa=10, mercados=MERCADOS)
    a = p.puntuar(Contexto(fuente_completa(original), 100), ["AAA1", "ABA1"])
    b = p.puntuar(Contexto(fuente_completa(alterada), 100), ["AAA1", "ABA1"])
    assert a == b
    c = p.puntuar(Contexto(fuente_completa(alterada), 102), ["AAA1", "ABA1"])  # 102 − 5 = 97: ya ve lo alterado.
    assert c != a


def test_un_codigo_sin_historial_toma_el_riesgo_de_su_mercado():
    t = _deriva()
    p = op.RiesgoEstandarizado(vida=None, kappa=10, mercados=MERCADOS)
    ctx = Contexto(fuente_completa(t), 110)
    rr, rr_mercado, nivel = p.riesgos(ctx)
    tasas = p.puntuar(ctx, ["AAB1", "ABB1", "ZZZ9"])  # AAB1 y ABB1 no se produjeron; ZZZ9 no tiene mercado.
    assert np.isclose(tasas["AAB1"], nivel * rr_mercado["LOCATION_1"])
    assert np.isclose(tasas["ABB1"], nivel * rr_mercado["LOCATION_2"])
    assert np.isclose(tasas["ZZZ9"], nivel)


def test_la_playa_sin_permanencia_reproduce_la_seleccion_del_dia():
    t = tabla(dias=range(1, 81), por_dia=40)
    p = R.Movil(30, 20)
    d0 = op.simular_playa(t, p, 40, 80, permanencia=0)
    ref = simular(t, p, 40, 80)
    assert np.array_equal(d0.cal_elegidas, ref.cal_elegidas) and np.array_equal(d0.k, ref.k)
    d2 = op.simular_playa(t, p, 40, 80, permanencia=2)
    assert np.array_equal(d2.k, ref.k)  # La playa cambia entre quiénes se elige, no cuántos.


def test_el_criterio_de_parametros_premia_al_que_separa_los_codigos():
    t = tabla(dias=range(1, 121), por_dia=40)  # Tasas por código estables: 30, 15, 8 y 2 %.
    con_codigo = op.RiesgoEstandarizado(vida=60, kappa=10, mercados=MERCADOS)
    sin_codigo = R.Movil(30, 10**9)  # Peso enorme: todos los códigos valen la tasa general.
    assert op.log_loss_secuencial(t, con_codigo, 60, 110) < op.log_loss_secuencial(t, sin_codigo, 60, 110)
