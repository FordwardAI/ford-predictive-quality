"""Controles del generador hipotético y de separación temporal; sin datos reales."""
from types import SimpleNamespace

import numpy as np

from solucion.sensibilidad_proceso import generar, particiones


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

    from solucion import sensibilidad_proceso as experimento
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
