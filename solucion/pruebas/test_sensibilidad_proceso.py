"""Controles del generador hipotético y de separación temporal; sin datos reales."""
from types import SimpleNamespace

import numpy as np

from solucion.experimentos.sensibilidad_proceso import generar, particiones


def test_senal_ruido_cobertura_y_limite_temporal():
    y = np.tile([0, 1], 1000)
    dias = np.full(len(y), 100)
    config = {"separacion": 0., "ruido": .5, "cobertura": 1.}
    x, disponible = generar(y, dias, config, 1)
    sin_etiqueta, _ = generar(1 - y, dias, config, 1)
    assert np.array_equal(x, sin_etiqueta), "Con señal nula, etiquetas no deben cambiar las columnas"
    assert disponible.all() and x.shape == (2000, 14)
    fuerte, _ = generar(y, dias, {**config, "separacion": 2.}, 1)
    assert np.allclose(fuerte[y == 1, :-1] - x[y == 1, :-1], 1.)
    assert np.array_equal(fuerte[y == 0], x[y == 0])
    invertida, _ = generar(y, dias + 80, {**config, "separacion": 2., "invertir_desde": 175}, 1)
    assert np.allclose(invertida[y == 1, :-1] - x[y == 1, :-1], -1.)
    ausente, disponible = generar(y, dias, {**config, "cobertura": 0.}, 1)
    assert not disponible.any() and not ausente[:, :-1].any() and ausente[:, -1].all()
    for invalidos in (dias + 95,):
        try:
            generar(y, invalidos, config, 1)
        except ValueError:
            pass
        else:
            raise AssertionError("Día >=195 debe rechazarse")
    vs = [SimpleNamespace(dia=d) for d in (93, 94, 95, 99, 100, 118, 119, 200)]
    train, evaluados = particiones(vs, 100, 118)
    assert train.tolist() == [0, 1] and evaluados.tolist() == [4, 5]


def test_experimento_completo_no_publica_filas_y_conserva_cupo():
    import json
    from unittest.mock import patch

    from solucion.experimentos import sensibilidad_proceso as experimento
    from solucion.datos import Tabla, Vin

    vins = [Vin(f"SINTETICO_{dia}_{i}", "A" if i % 2 else "B", dia, dia,
                "CALIBRADA" if i % 2 else "OK", None) for dia in range(1, 50) for i in range(20)]
    vins.append(Vin("ENMASCARADO", "A", 200, 200, None, None))
    tabla = Tabla(vins, [], {}, {}, {}, {})
    with patch.object(experimento, "SEMILLAS", (1,)), patch.object(experimento, "MODELOS", ("logistica",)), \
         patch.object(experimento, "BLOQUES_SELECCION", ((40, 44),)), \
         patch.object(experimento, "CONFIRMACION", (45, 49)), \
         patch.object(experimento, "ESCENARIOS", {"sin_senal": experimento.ESCENARIOS["sin_senal"]}):
        resultado = experimento.correr(tabla)
    texto = json.dumps(resultado)
    assert "SINTETICO_" not in texto and "ENMASCARADO" not in texto
    assert len(resultado["resumen"]) == 4
    assert all(r["vins"] == 100 and r["elegidos"] == 5 for r in resultado["resultados"])


def test_correccion_congelada_y_rechazo_de_control_distinto():
    from solucion.experimentos.sensibilidad_candidatos import ajustar_correccion, corregir, verificar_controles

    y = np.tile([0, 1], 100)
    p = np.full(len(y), .5)
    x = (2 * y - 1)[:, None].astype(float)
    np.testing.assert_allclose(corregir(p, x, np.zeros(1)), p)
    coef = ajustar_correccion(p, x, y)
    pred = corregir(p, x, coef)
    assert pred[y == 1].mean() > .9 and pred[y == 0].mean() < .1
    r = {"escenario": "catalogo", "modelo": "mezcla", "tramo": "comprobacion", "semilla": 1,
         "vins": 100, "elegidos": 5, "calibrada_elegidas": 2}
    historico = {"resultados": [{"semilla": 1, "confirmacion": {"mezcla": dict(r)}}]}
    verificar_controles([r], historico)
    try:
        verificar_controles([{**r, "calibrada_elegidas": 3}], historico)
    except AssertionError:
        pass
    else:
        raise AssertionError("Un control que no reproduce #48 debe detener el experimento")


def test_candidatos_completo_respeta_poblacion_margen_y_controles():
    import json
    from unittest.mock import patch

    from solucion.experimentos import sensibilidad_candidatos as sc
    from solucion.cupo import metricas, remuestreos, simular
    from solucion.pruebas.sintetico import tabla

    t = tabla(dias=range(1, 51), por_dia=40)
    modelo = SimpleNamespace(puntuar=lambda ctx, cs: {c: .2 for c in cs})
    ajustes = [{"bloque": [a, b], "bases": {}, "rf_atributos": {"hiperparametros": {}}}
               for a, b in ((40, 44), (45, 49))]
    previo = {"semilla": 1}
    for tramo, (a, b) in (("seleccion", (40, 44)), ("confirmacion", (45, 49))):
        d = simular(t, modelo, a, b)
        previo[tramo] = {n: metricas(d, remuestreos(len(d.dias))) for n in sc.MODELOS}
    historico = {"ajustes_por_bloque": ajustes, "resultados": [previo]}
    factory = lambda *a, **kw: modelo
    cortes = []

    def bosque(tabla_, fuente, train, evaluados, sinteticos, indices, hiper, semilla):
        cortes.append((max(v.dia for v in train), min(v.dia for v in evaluados)))
        return np.full(len(evaluados), .2)

    with patch.object(sc, "SEMILLAS", (1,)), patch.object(sc, "BLOQUES_SELECCION", ((40, 44),)), \
         patch.object(sc, "CONFIRMACION", (45, 49)), \
         patch.object(sc, "ESCENARIOS", {"moderada": sc.ESCENARIOS["moderada"]}), \
         patch.object(sc.ml, "ajustar_meta", return_value=({}, 0, 0)), \
         patch.object(sc.ml, "Stacking", factory), \
         patch.dict(sc.ml.BASES_ATRIBUTOS, {"rf": factory}), \
         patch.object(sc, "Jerarquico", factory), patch.object(sc, "TasaFija", factory), \
         patch.object(sc, "bosque_extendido", bosque), \
         patch.object(sc.columnas, "ajustar_predecir", side_effect=lambda n, x, z, *args: np.full(z.shape[0], .2)):
        salida = sc.correr(t, historico)
    assert salida["controles_originales_reproducidos"]
    assert cortes == [(34, 40), (39, 45)]
    assert all(a["correccion_entrenada_hasta"] < a["bloque"][0] - 5 for a in salida["ajustes"])
    assert all(r["vins"] == 200 and r["elegidos"] == 10 for r in salida["resultados"])
    for r in salida["resumen"]:
        if r["modelo"] in ("jerarquico", "tasa_fija"):
            assert r["mejora_relativa_catalogo"] in (0, None)
    assert all(v.vin not in json.dumps(salida) for v in t.vins)
