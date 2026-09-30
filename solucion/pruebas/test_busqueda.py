"""Selección vectorizada, cobertura de combinaciones y aumento limitado al entrenamiento."""
import numpy as np
import scipy.sparse as sp

from solucion import busqueda, columnas
from solucion.puntaje import semilla_dia
from solucion.cupo import SEMILLA_DESEMPATE, seleccionar
from solucion.pruebas.sintetico import tabla


def test_vectorizacion_equivale_al_evaluador_incluso_con_empates():
    vs = next(iter(tabla(dias=range(10, 11)).por_dia(10, 10).values()))
    rng = semilla_dia(SEMILLA_DESEMPATE, 10)
    azar = rng.random(len(vs))
    ps = np.array([[.3 if v.codigo.endswith("1") else .1 for v in vs], [.5] * len(vs)])
    y = np.array([v.calibrada for v in vs], dtype=np.uint8)
    obtenidos = busqueda.aciertos(ps, y, 2, azar)
    for i in range(len(ps)):
        elegidos = seleccionar(vs, {v.vin: p for v, p in zip(vs, ps[i])}, 2,
                              semilla_dia(SEMILLA_DESEMPATE, 10), por_vin=True)
        assert obtenidos[i] == sum(v.calibrada for v in elegidos)


def test_catalogo_incluye_pares_y_todas_las_familias_juntas():
    nombres = ["ml_catboost_atributos|fijo", "movil_mercado_30", "jerarquico_60_20"]
    dias = [{"t": 100}, {"t": 175}]
    candidatos, pool = busqueda.catalogo(nombres, np.array([[1, 2], [2, 0], [1, 1]]), dias)
    assert len(pool) == 3
    assert sum(c["metodo"] == "pares" for c in candidatos) == 3 * 9
    assert sum(c["metodo"] == "mediana" for c in candidatos) == 4
    assert any(c["metodo"] == "pesos_25" and len(c["indices"]) == 3 for c in candidatos)
    assert all(np.isclose(sum(c["pesos"]), 1) for c in candidatos)
    for metodo in ("promedio", "mediana", "rangos"):
        assert any(c["metodo"] == metodo and len(c["indices"]) == 3 for c in candidatos)


def test_sinteticos_conservan_categorias_y_no_interpolan_entre_codigos():
    X = sp.csr_matrix([[1., 0., 2.], [1., 0., 4.], [0., 1., 20.], [0., 1., 0.],
                       [0., 1., 0.], [0., 1., 0.], [0., 1., 0.], [0., 1., 0.]])
    y = np.array([1, 1, 1, 0, 0, 0, 0, 0])
    XX, yy, w = columnas.aumentar(X, y, ["A", "A", "B", "B", "B", "B", "B", "B"],
                                 np.array([2]), "sintetico", 1)
    assert XX.shape == (10, 3) and yy.sum() == 5 and len(w) == 10
    np.testing.assert_array_equal(XX[:8].toarray(), X.toarray())
    for a, b, z in XX[8:].toarray():
        assert (a, b) in ((1, 0), (0, 1))
        assert 2 <= z <= 4 if a else z == 20
    np.testing.assert_array_equal(columnas.aumentar(X, y, ["A"] * 8, np.array([2]), "natural", 1)[0].toarray(), X.toarray())


def test_campos_b_respeta_fecha_y_no_usa_etiqueta_ni_componente():
    t = tabla(dias=range(10, 11))
    v = t.vins[0]
    eventos = {v.vin: [(10, {"CP": "NUEVO"}), (2, {"CP": "ANTERIOR"})]}
    f = columnas.fichas(v, eventos, ["CP"], {}, 5)
    assert f["CP|eventos"] == 1 and "CP|valor=ANTERIOR" in f and "CP|valor=NUEVO" not in f
    assert {"VIN", "Auditoría Adicional", "Componente Auditoría Adicional"} <= columnas.EXCLUIDAS


def test_todas_las_columnas_politicas_y_objetivo_conjunto_sinteticos():
    t = tabla(dias=range(1, 51), por_dia=40)
    eventos = {v.vin: [(v.dia, {"CP": v.codigo, "Hora Inspección": "0,25", "Rep PUL": "P"})] for v in t.vins}
    p, vs, cobertura = columnas.predicciones_bloque(t, eventos, ["CP", "Hora Inspección", "Rep PUL"], 40, 44)
    assert any(k.startswith("conjunto|") for k in p)
    assert any(k.endswith("sintetico_prior") for k in p)
    assert cobertura["B"]["sin_eventos"] == len(vs)
    assert all(len(x) == len(vs) and np.isfinite(x).all() and ((x >= 0) & (x <= 1)).all() for x in p.values())


def test_eleccion_adaptativa_no_mira_el_bloque_futuro_ni_el_margen():
    from solucion.robustez_busqueda import seleccionar_en_el_pasado, solo_catalogo
    dias = [{"t": 100}, {"t": 113}, {"t": 118}, {"t": 119}, {"t": 125}]
    cuentas = np.array([[2, 3, 0, 0, 0], [0, 0, 10, 10, 10]])
    resultado, decisiones = seleccionar_en_el_pasado(cuentas, dias, [0, 1], ((119, 125),))
    assert decisiones[0]["indice"] == 0 and decisiones[0]["hasta_eleccion"] == 113
    assert resultado[3:].sum() == 0  # El mejor mirando futuro habría sido el otro, pero está prohibido.
    assert solo_catalogo("conjunto|catboost") and solo_catalogo("historial|ranker|sin")
    assert not solo_catalogo("campos_A|logistica|todas|natural")
    assert not solo_catalogo("historial|catboost|B")
