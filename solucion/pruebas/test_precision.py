"""Elección por precisión: regla sin simplicidad, origen móvil sin fuga, suavizado jerárquico y atributos del código."""
import numpy as np

from solucion import ml, precision
from solucion.cupo import elegir_por_precision
from solucion.puntaje import Contexto, Fuente, atributos_de
from solucion.referencias import Jerarquico, TasaFija
from solucion.pruebas.sintetico import CATALOGO, tabla


def _r(nombre, precision_cupo, por_bloque, elegible=True):
    return {"alternativa": nombre, "elegible": elegible, "precision_cupo": precision_cupo,
            "precision_por_bloque": por_bloque}


def test_gana_la_mayor_precision_aunque_otra_sea_mas_simple_y_el_rango_incluya_cero():
    # Con la regla vieja, la tasa fija (más simple) ganaba si la diferencia incluía 0. Acá solo cuenta la precisión.
    candidatas = [_r("tasa fija", 0.150, [0.15, 0.15]), _r("compleja", 0.152, [0.10, 0.20]),
                  _r("azar", 0.300, [0.3, 0.3], elegible=False)]
    ganadora, ranking = elegir_por_precision(candidatas)
    assert ganadora["alternativa"] == "compleja" and [r["alternativa"] for r in ranking] == ["compleja", "tasa fija"]


def test_empate_exacto_lo_decide_la_menor_varianza_y_luego_el_nombre():
    candidatas = [_r("b", 0.15, [0.10, 0.20]), _r("a", 0.15, [0.15, 0.15]), _r("c", 0.15, [0.15, 0.15])]
    assert elegir_por_precision(candidatas)[0]["alternativa"] == "a"
    assert elegir_por_precision(list(reversed(candidatas)))[0]["alternativa"] == "a"  # No depende del orden.


def test_origen_movil_sin_fuga_y_la_tasa_fija_se_reajusta_por_bloque():
    t = tabla()
    datos, meta = precision.evaluar_bloques(t, ((100, 118), (119, 137)), con_ml=False)
    assert all(len(por_semilla) == 1 and len(por_semilla[0]) == 2 for por_semilla in datos.values())
    hasta = [a["parametros"]["hasta"] for a in meta["tasa_fija"]["ajustes"]]
    assert hasta == [94, 113]  # Día <= inicio del bloque − 6.
    # Una tasa fija entrenada con días del propio bloque es fuga y el protocolo la frena.
    try:
        precision.simular(t, TasaFija(hasta=110), 100, 118)
    except AssertionError:
        pass
    else:
        raise AssertionError("Una tasa fija con Día > t−5 debe fallar")


def test_jerarquico_un_codigo_raro_toma_fuerza_de_su_celda_y_uno_frecuente_se_queda_en_su_tasa():
    atributos = atributos_de(CATALOGO)  # AAA1 y AAB1 comparten mercado; ABA1 y ABB1, el otro.
    registros = ([(10, "AAA1", d % 2) for d in range(400)]  # AAA1: 50 % con mucha historia.
                 + [(10, "AAB1", 0), (10, "AAB1", 0)]  # AAB1: dos resultados, ambos OK.
                 + [(10, "ABA1", 0) for _ in range(400)])  # El otro mercado casi no se calibra.
    ctx = Contexto(Fuente(registros), t=30)
    tasas = Jerarquico(None, 20, atributos).puntuar(ctx, ["AAA1", "AAB1", "ABA1", "ABB1"])
    assert tasas["AAA1"] > 0.45  # Mucha historia: se queda cerca de su 50 %.
    assert tasas["AAA1"] > tasas["AAB1"] > 0.2  # Su tasa sola sería 0 %; sube hacia su mercado, pero no lo iguala.
    assert tasas["AAB1"] > tasas["ABB1"]  # Un código sin historial del mercado bueno supera al del malo.
    assert all(0 <= v <= 1 for v in tasas.values())


def test_atributos_del_codigo_sin_etiquetas_y_un_codigo_sin_historial_hereda_de_su_mercado():
    atributos = atributos_de(CATALOGO)
    assert set(atributos["AAA1"]) >= {"LOCATION_1", "VERSION_1"}  # Mercado y versión salen del catálogo.
    registros = ([(10, "AAA1", d % 2) for d in range(300)] + [(10, "AAB1", d % 2) for d in range(300)]
                 + [(10, "ABA1", 0) for _ in range(300)])
    conocidas = Fuente(registros).conocidas(10)
    # AAB1 sin historial (se lo saca de los conteos) pero con atributos: hereda de su mercado.
    sin = Fuente([r for r in registros if r[1] != "AAB1"]).conocidas(10)
    tasas = ml.estimar("logistica", {"C": 1.0}, None, sin, ["AAB1", "ABB1"], atributos=atributos)
    assert set(tasas) == {"AAB1", "ABB1"} and tasas["AAB1"] > tasas["ABB1"]
    # Sin atributos el mismo código queda sin estimar (cae a la tasa general).
    assert ml.estimar("logistica", {"C": 1.0}, None, sin, ["AAB1"]) == {}
    assert conocidas.n.sum() == 900 and np.isfinite(list(tasas.values())).all()


def test_ancla_del_bloque_en_ml():
    assert ml.dia_reentreno(104, 100) == 100 and ml.dia_reentreno(109, 100) == 105
    assert ml.dia_reentreno(157) == 155  # Por defecto, la grilla de la validación original.
    assert ml.fin_interno(155) == 149 and ml.fin_interno(100) == 94


def test_todas_las_alternativas_de_un_bloque_puntuan_sin_fuga():
    """Corre de punta a punta cada grupo de alternativas (incluidas las de ML con atributos) en un bloque corto."""
    t = tabla(dias=range(1, 61), por_dia=40)
    fuente = precision.fuente_completa(t)
    grupos = precision.grupos_del_bloque(t, fuente, 40, 44, con_ml=False)
    assert {"tasa_fija", "jerarquico_60_10", "movil_mercado_60", "azar", "oraculo"} <= set(grupos)
    atributos = atributos_de(t.catalogo)
    modelo = ml.BASES_ATRIBUTOS["logistica"]("fijo", {"C": 1.0}, hasta=30, atributos=atributos)
    promedio = ml.PromedioAtributos("fijo", {b: {"hiperparametros": {"C": 1.0} if b == "logistica" else
                                                 ml.FAMILIAS[b].grilla[0], "vida": None}
                                              for b in ml.ATRIBUTOS_FAMILIAS}, semilla=1, hasta=30, atributos=atributos)
    for alternativa in (modelo, promedio):
        d = precision.simular(t, alternativa, 40, 44, fuente)
        assert len(d.dias) == 5 and d.k.sum() > 0


def test_segunda_lectura_congela_sin_la_prueba_arma_el_preregistro_y_corre_de_punta_a_punta():
    """Lo que no puede fallar en la corrida real: congelar (sin etiquetas >= 200), preregistrar y leer la prueba."""
    import json
    import tempfile
    from pathlib import Path

    from solucion import preregistro as pr
    from solucion.pruebas import test_preregistro as tp

    ganadora = {"alternativa": "Regresión logística con atributos del código, reentrenado cada 5 d",
                "clave": "ml_logistica_atributos|reentrenado", "semilla_mediana": None,
                "precision_seleccion": 0.18, "precision_seleccion_rango95": [0.15, 0.21],
                "calibrada_elegidas_seleccion": 130, "elegidos_seleccion": 740,
                "confirmacion": {"precision_cupo": 0.17, "calibrada_elegidas": 39, "elegidos": 225}}
    with tempfile.TemporaryDirectory() as d:
        tp._resultados(d)
        Path(d, "preregistro.json").write_text("{}", encoding="utf-8", newline="\n")
        Path(d, "precision.json").write_text(json.dumps({"ganadora": ganadora}), encoding="utf-8", newline="\n")
        masked = tabla(dias=range(1, 271), por_dia=40)
        assert not masked.desbloqueada
        p = precision.preregistro_segunda_lectura(masked, d, fecha="2026-10-01")
        assert p["estado"] == "propuesto" and not pr.pendientes(p), pr.pendientes(p)
        assert p["piezas"] == {"p5": pr.FUERA, "p6": pr.FUERA, "e3": pr.FUERA}
        en_prueba = p["ganadora_en_prueba"]
        assert en_prueba["familia"] == "ml_logistica_atributos"
        assert en_prueba["parametros"]["ancla"] == 200 and en_prueba["parametros"]["modo"] == "reentrenado"
        assert "ya se leyó una vez" in p["segunda_lectura"]["advertencia"]  # Declara que es una segunda lectura.
        # Acordado y corrido con el mismo camino que la corrida real.
        p.update(estado="acordado", fuente=dict(tp.FUENTE))
        archivo = Path(d) / "preregistro-precision.json"
        archivo.write_text(json.dumps(p, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
        salida = Path(d) / "prueba-final.json"
        registro = pr.correr(archivo, pr.sha256(archivo), salida=salida, git=tp._git_ok, cargar=tp._tabla,
                             ahora=tp.AHORA)
        corrida = registro["corridas"][0]
        assert corrida["ganadora"]["familia"] == "ml_logistica_atributos"
        assert corrida["piezas"]["p5"]["corrida"] is False and corrida["piezas"]["p6"]["corrida"] is False
        assert corrida["piezas"]["e3"]["corrida"] is False
        g = corrida["tramos"][0]["ganadora"]
        assert g["calibrada_tramo"] > 0 and g["lectura"] in ("mejora", "inconcluso", "peor")  # Leyó la prueba.
        assert "SYN" not in salida.read_text(encoding="utf-8")  # Sin identificadores.
