"""Enmascarado de la prueba final y armado de la tabla por VIN."""
from solucion.datos import construir
from solucion.puntaje import Contexto, Fuente
from solucion.pruebas.sintetico import CATALOGO, evento, tabla


def test_dia_del_vin_y_cohorte():
    t = construir([evento("a", 140, "AAA1", "OK", reparacion=152),
                   evento("b", 150, "AAB1", "CALIBRADA", "FRENOS"), evento("b", 160, "AAB1", "CALIBRADA", "FRENOS"),
                   evento("c", 199, "ABA1", "OK"), evento("d", 261, "ABB1", "OK")], CATALOGO)
    dias = {v.vin: (v.primera, v.dia) for v in t.vins}
    assert dias == {"a": (140, 152), "b": (150, 160), "c": (199, 199)}
    assert [v.vin for v in t.cohorte] == ["d"]


def test_prueba_final_enmascarada():
    t = tabla()
    prueba = [v for v in t.vins if v.dia >= 200]
    assert prueba and all(v.etiqueta is None and v.componente is None for v in prueba)
    assert all(v.etiqueta is not None for v in t.vins if v.dia < 200)
    try:
        prueba[0].calibrada
    except AssertionError:
        pass
    else:
        raise AssertionError("Una etiqueta enmascarada no debe poder leerse")


def test_desbloqueo_explicito():
    t = tabla(desbloquear=True)
    assert all(v.etiqueta is not None for v in t.vins)


def test_contexto_respeta_margen_y_prueba():
    fuente = Fuente([(150, "AAA1", True)])
    ctx = Contexto(fuente, t=160)
    ctx.conocidas(155)
    for hasta, t in [(156, 160), (200, 260)]:
        try:
            Contexto(fuente, t=t).conocidas(hasta)
        except AssertionError:
            continue
        raise AssertionError(f"Debía fallar con hasta={hasta}, t={t}")
    try:
        Contexto(fuente, t=300, permite_futuro=True).conocidas(250)
    except AssertionError:
        pass
    else:
        raise AssertionError("Sin desbloqueo no hay etiquetas >= 200 ni siquiera con permite_futuro")


def test_clave_de_cache_depende_de_csv_y_catalogo():
    from solucion.datos import _clave_cache
    csv = "a" * 64  # Hashes de 64 caracteres: la clave vieja solo veía los primeros 16 del CSV.
    assert _clave_cache(csv + "b" * 64) != _clave_cache(csv + "c" * 64)
    assert _clave_cache(csv + "b" * 64) == _clave_cache(csv + "b" * 64)
