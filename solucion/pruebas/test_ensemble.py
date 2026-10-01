"""La mezcla conserva los extremos, cambia el orden con el peso y respeta el margen temporal."""
from solucion.experimentos.ensemble import Mezcla, correr
from solucion.puntaje import Contexto, Fuente
from solucion.pruebas.sintetico import tabla
from solucion.referencias import MovilMercado, TasaFija


def test_mezcla_y_margen_temporal():
    fuente = Fuente([(10, "A", 1), (10, "B", 0), (30, "A", 0), (30, "B", 1)])
    ctx = Contexto(fuente, 35)
    fija, movil = TasaFija(10), MovilMercado(5, 0)
    assert Mezcla(fija, movil, 1).puntuar(ctx, ["A", "B"]) == {"A": 1., "B": 0.}
    assert Mezcla(fija, movil, 0).puntuar(ctx, ["A", "B"]) == {"A": 0., "B": 1.}
    assert Mezcla(fija, movil, .75).puntuar(ctx, ["A", "B"]) == {"A": .75, "B": .25}
    for peso in (-.1, 1.1, float("nan")):
        try:
            Mezcla(fija, movil, peso)
        except ValueError:
            pass
        else:
            raise AssertionError("Se admitió un peso inválido")
    try:
        Mezcla(TasaFija(31), movil, .5).puntuar(ctx, ["A", "B"])
    except AssertionError:
        pass
    else:
        raise AssertionError("Se usó un resultado antes del margen de cinco días")
    try:
        correr(tabla(desbloquear=True))
    except AssertionError:
        pass
    else:
        raise AssertionError("Se admitió la tabla de prueba desbloqueada")


def test_experimento_sintetico_completo():
    import json
    from unittest.mock import patch
    from solucion.experimentos import ensemble
    t = tabla(dias=range(1, 51), por_dia=40)
    with patch.object(ensemble, "BLOQUES_SELECCION", ((40, 44),)), \
         patch.object(ensemble, "CONFIRMACION", (45, 49)), \
         patch.object(ensemble, "VENTANAS", (30,)), \
         patch.object(ensemble, "PESOS_CATBOOST", (.5,)), \
         patch.object(ensemble.ml, "SEMILLAS", (1,)):
        r = correr(t)
    assert r["mezcla_elegida"] == "mezcla_30_0.5" and len(r["resultados"]) == 3
    assert len(r["estabilidad_peso_y_ventana_congelados"]) == 1
    assert all(x["elegidos"] == 10 and x["confirmacion"]["elegidos"] == 10 for x in r["resultados"])
    assert not next(x for x in r["resultados"] if x["clave"] == r["mezcla_elegida"])["elegible"]
    assert "SYN" not in json.dumps(r)
