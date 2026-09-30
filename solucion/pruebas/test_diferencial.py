"""Diferencial (P6): CUSUM, suavizado del componente, enmascarado y gancho de la prueba."""
import numpy as np

from solucion import diferencial
from solucion.pruebas.sintetico import tabla


def _alarmas(x, n=50, p0=0.1, h=5.0):
    x = np.array(x, dtype=float)
    arriba, abajo = diferencial.incrementos(np.full_like(x, n), x, p0)
    return [(j, bool(au), bool(ad)) for j, au, ad in diferencial.recorrer(arriba, abajo, h) if au or ad]


def test_cusum_alarma_con_cambio_x2_y_no_con_serie_constante():
    assert _alarmas([5] * 60) == []  # 5 de 50 = p0 todos los días.
    alarmas = _alarmas([5] * 30 + [10] * 30)
    assert alarmas and all(au and not ad for _, au, ad in alarmas), alarmas
    assert 30 <= alarmas[0][0] <= 33, alarmas
    bajada = _alarmas([5] * 30 + [2] * 30)
    assert bajada and all(ad and not au for _, au, ad in bajada) and bajada[0][0] >= 30, bajada


def test_suavizado_sin_datos_da_la_general():
    general = {"FRENOS": 0.5, "DIRECCION": 0.3, "SUSPENSION": 0.2}
    assert diferencial.distribucion_suavizada({}, general) == general
    con_datos = diferencial.distribucion_suavizada({"SUSPENSION": 20}, general)
    assert abs(con_datos["SUSPENSION"] - (20 + 20 * 0.2) / 40) < 1e-12
    assert diferencial.primeros(con_datos, 1) == ("SUSPENSION",)


def test_componente_no_lee_etiquetas_de_la_prueba():
    t = tabla()
    filas, _ = diferencial.componente_por_dia(t, 155, 194)
    assert len(filas) == 40 and filas[:, 1].sum() > 0
    try:
        diferencial.componente_por_dia(t, 200, 220)
    except AssertionError:
        pass
    else:
        raise AssertionError("El componente no debe leer etiquetas de Día >= 200 sin desbloqueo")


def test_prueba_corre_en_tabla_desbloqueada():
    t = tabla(desbloquear=True)
    salida = diferencial.prueba(t, diferencial._configuracion(h=5.0, k=3))
    comp = salida["componente"]["prueba_final"]["todas_las_calibrada"]
    assert comp["calibrada_evaluadas"] > 0 and comp["lectura_contra_general"] is not None
    assert salida["detector"]["dias_calendario"] == 61
    assert salida["subcategorizacion"]["orden_en_prueba"]["grupos_comparados"] >= 2
    try:
        diferencial.prueba(tabla(), diferencial._configuracion(h=5.0, k=3))
    except AssertionError:
        pass
    else:
        raise AssertionError("prueba() exige la tabla desbloqueada")


def test_subcategorizacion_fuera_del_preregistro_no_se_corre():
    config = diferencial._configuracion(h=5.0, k=3)
    config["subcategorizacion"] = "fuera del preregistro"
    salida = diferencial.prueba(tabla(desbloquear=True), config)
    assert salida["subcategorizacion"] == {"corrida": False, "motivo": "Fuera del preregistro."}
    assert salida["detector"]["dias_calendario"] == 61  # Lo demás de p6 sigue corriendo.
