"""Historial del VIN: columnas permitidas, disponibilidad A/B, sin fuga, MIL y un bloque de punta a punta."""
import numpy as np
import scipy.sparse as sp
from scipy.optimize import check_grad

from solucion import datos, historial_vin as hv
from solucion.datos import construir
from solucion.pruebas.sintetico import CATALOGO, evento, tabla


def test_las_fichas_de_eventos_no_incluyen_el_resultado_ni_el_componente_de_la_auditoria():
    assert not {"Auditoría Adicional", "Componente Auditoría Adicional"} & set(datos.EVENTO_COLUMNAS)
    fila = evento("SYN1", 3, "AAA1", "CALIBRADA", componente="FRENOS")
    fila.update({"CP": "CP_1", "CCC": "C1", "INSPECTOR": "USER_9"})
    t = construir([fila], CATALOGO)
    (dia, fichas), = t.eventos["SYN1"]
    assert dia == 3 and {"cp=CP_1", "ccc=C1", "inc=FALLA"} <= set(fichas)
    assert not any("FRENOS" in f or "CALIBRADA" in f or "USER_9" in f for f in fichas)


def test_supuesto_b_descarta_los_eventos_de_los_ultimos_5_dias_y_a_los_conserva():
    filas = [evento("SYN1", 1, "AAA1", "OK", incidencia="VIEJO"), evento("SYN1", 8, "AAA1", "OK", incidencia="NUEVO")]
    t = construir(filas, CATALOGO)
    v = t.vins[0]
    assert v.dia == 8
    a = hv.Espacio(t, [v], {}, hv.SUPUESTOS["A"])
    b = hv.Espacio(t, [v], {}, hv.SUPUESTOS["B"])
    assert len(a.eventos(v)) == 2 and b.fichas(v) == ["inc=VIEJO"]  # 8 − 5 = 3: el evento del día 8 no cuenta.


def test_el_modelo_se_entrena_solo_con_dias_conocidos_y_frena_si_usaria_el_futuro():
    t = tabla(dias=range(1, 61), por_dia=40)
    m = hv.ModeloVin(t, "logistica", "B", hasta=40)
    assert max(v.dia for v in m._entrenamiento()) == 40
    vins = t.por_dia(45, 45)[45]
    ctx = type("Ctx", (), {"t": 44})()  # En el día 44 solo se conoce hasta el 39.
    try:
        m.puntuar(ctx, vins)
    except AssertionError:
        pass
    else:
        raise AssertionError("Un modelo entrenado con Día <= 40 no puede usarse el día 44")


def _mil_sintetico(semilla=3, n=700, eventos=6, fichas=12):
    rng = np.random.default_rng(semilla)
    filas, dueno, y = [], [], np.zeros(n)
    for i in range(n):
        ficha = rng.integers(1, fichas, size=eventos)  # La ficha 0 es la «mala».
        if rng.random() < 0.3:
            ficha[rng.integers(eventos)] = 0
        y[i] = float(rng.random() < (0.85 if (ficha == 0).any() else 0.05))
        filas.extend(ficha)
        dueno.extend([i] * eventos)
    E = sp.csr_matrix((np.ones(len(filas)), (np.arange(len(filas)), filas)), shape=(len(filas), fichas))
    return sp.csr_matrix(np.ones((n, 1))), E, np.array(dueno), y


def test_mil_el_gradiente_es_correcto_y_la_atencion_mira_el_evento_malo():
    Xb, E, dueno, y = _mil_sintetico()
    for atencion in (False, True):
        mil = hv.Mil(atencion, lam_evento=1.0)
        theta = np.random.default_rng(0).normal(0, 0.3, 1 + 1 + E.shape[1] * (2 if atencion else 1))
        error = check_grad(lambda x: mil.objetivo(x, Xb, E, dueno, y)[0], lambda x: mil.objetivo(x, Xb, E, dueno, y)[1], theta)
        assert error < 1e-5, error
    mil = hv.Mil(True, lam_evento=1.0).ajustar(Xb, E, dueno, y)
    pesos = mil.pesos_de_atencion(E, dueno, len(y))
    malo = np.asarray(E[:, 0].todense()).ravel() > 0
    con_malo = np.isin(dueno, np.unique(dueno[malo]))
    assert pesos[malo].mean() > 2 * pesos[con_malo & ~malo].mean()  # Dentro de sus VIN, el evento malo pesa más.
    p = mil.predecir(Xb, E, dueno)
    assert p[y == 1].mean() > p[y == 0].mean() + 0.3


def test_todos_los_modelos_y_supuestos_puntuan_un_bloque_sin_fuga_y_el_cupo_se_respeta():
    t = tabla(dias=range(1, 91), por_dia=40)
    atributos = hv.atributos_de(t.catalogo)
    for modelo in hv.MODELOS:
        for supuesto in (None, "A", "B"):
            m = hv.ModeloVin(t, modelo, supuesto, hasta=74, atributos=atributos)
            d = hv.simular(t, m, 80, 84)
            assert len(d.dias) == 5 and (d.k == np.maximum(1, d.n // 20)).all(), (modelo, supuesto)
            assert set(m.puntajes) == {v.vin for l in t.por_dia(80, 84).values() for v in l}
    auc = hv._auc(t, (80, 84), m.puntajes)
    assert 0 <= auc["roc_auc"] <= 1 and 0 <= auc["pr_auc"] <= 1


def test_la_tabla_desbloqueada_no_entra_al_experimento():
    t = tabla(desbloquear=True)
    try:
        hv.correr(t)
    except AssertionError:
        pass
    else:
        raise AssertionError("El experimento no relee la prueba final")
