"""Pruebas sintéticas de la plataforma: .venv/bin/python -m plataforma.test_plataforma (no requieren el CSV)."""
import sys
import tempfile
from pathlib import Path
import traceback
from types import SimpleNamespace as NS

from plataforma.estado import AUDITAR, FUERA, NO_AUDITAR, Dia
from plataforma.privacidad import SinVin, revisar
from plataforma import modelo
from plataforma.planta import Planta, Rechazo, filas_csv, reporte_linea


def _dia():
    # Ranking A > B > C > D; cupo 4: A recibe 2, B 1 y D 1 por mínimo por código.
    programa = [("U-1", "A"), ("U-2", "A"), ("U-3", "A"), ("U-4", "B"), ("U-5", "B"), ("U-6", "C"), ("U-7", "D")]
    filas = [NS(codigo="A", sugerida=2), NS(codigo="B", sugerida=1), NS(codigo="C", sugerida=0),
             NS(codigo="D", sugerida=0)]
    h = NS(dia=170, cupo=4, filas=filas,
           unidades=[("D", "Mínimo por código", ["U-7"]), ("A", "Prioridad", ["U-1", "U-2"]),
                     ("B", "Prioridad", ["U-4"])])
    return Dia.desde_hoja(h, programa, "tasa_fija")


def test_decidir():
    d = _dia()
    assert d.decidir(" a ")["decision"] == AUDITAR and d.decidir("A")["quedan"] == 2
    assert d.decidir("D")["motivo"] == "Mínimo por código"
    assert d.decidir("C")["decision"] == NO_AUDITAR
    assert d.decidir("ZZ")["decision"] == FUERA


def test_tomar_hasta_cubrir():
    d = _dia()
    assert d.tomar("A") == "U-1" and d.tomar("A", "U-3") == "U-3"
    assert d.decidir("A")["decision"] == NO_AUDITAR
    assert d.decidir("A")["motivo"] == "La cantidad de este código ya está cubierta"
    try:
        d.tomar("A")
    except AssertionError:
        pass
    else:
        raise AssertionError("Tomar con el código cubierto tenía que fallar")


def test_ronda_baja_por_el_ranking():
    d = _dia()
    d.tomar("A")
    r = d.registrar_ronda({"B": 0})  # B no llegó: su unidad pasa a C, el siguiente con unidades libres.
    assert {c["codigo"]: c["despues"] for c in r["cambios"]} == {"B": 0, "C": 1}
    assert d.decidir("C")["decision"] == AUDITAR and d.motivos["C"] == "Siguiente del ranking"
    assert sum(q for _, q in d.pendientes()) + d.tomadas_total() == d.cupo


def test_ronda_ranking_agotado_va_al_azar():
    d = _dia()
    r = d.registrar_ronda({"A": 0, "B": 0, "C": 0})  # Solo llega D, con su única unidad ya sugerida.
    assert r["azar"] == 3 and d.pendientes() == [("D", 1)]


def test_deshacer_devuelve_lo_pendiente():
    d = _dia()
    u = d.tomar("A")
    assert d.pendiente("A") == 1
    d.deshacer(u)
    assert d.pendiente("A") == 2 and d.tomadas_total() == 0
    try:
        d.deshacer("U-99")
    except AssertionError:
        pass
    else:
        raise AssertionError("Deshacer una unidad no enviada tenía que fallar")


def test_enviadas_guardan_su_ronda():
    d = _dia()
    d.tomar("A")
    d.registrar_ronda({})
    d.tomar("B")
    assert [(e["unidad"], e["codigo"], e["ronda"]) for e in d.resumen()["enviadas"]] == [("U-1", "A", 1), ("U-4", "B", 2)]


def test_guardar_y_leer():
    d = _dia()
    d.tomar("B")
    d.registrar_ronda({})
    with tempfile.TemporaryDirectory() as carpeta:
        assert Dia.leer(d.guardar(carpeta)) == d


def test_sin_vin():
    vins = {"1FTER4FH0LLA12345"}
    revisar({"filas": [{"codigo": "A", "u": "U-1"}]}, vins)
    try:
        revisar({"x": ["texto 1FTER4FH0LLA12345"]}, vins)
    except SinVin:
        pass
    else:
        raise AssertionError("Un VIN en la respuesta tenía que fallar")


def _planta(carpeta):
    p = Planta(Path(carpeta) / "planta.db", {"A", "B", "C"})
    p.escribir("dia", 160)
    return p


def _rechaza(f, texto):
    try:
        f()
    except Rechazo as e:
        assert texto in str(e), str(e)
    else:
        raise AssertionError(f"Tenía que rechazar: {texto}")


def test_ingreso_valida_y_es_todo_o_nada():
    with tempfile.TemporaryDirectory() as c:
        p = _planta(c)
        _rechaza(lambda: p.ingresar([{"unidad": "X1", "codigo": "Z", "dia": "160"}], "archivo"), "no está en el catálogo")
        _rechaza(lambda: p.ingresar([{"unidad": "X1", "codigo": "A", "dia": "160"}, {"unidad": "X1", "codigo": "B", "dia": "160"}],
                                    "archivo"), "ya fue ingresada")
        assert p.playa(160) == []  # Nada entró por la fila repetida.
        _rechaza(lambda: filas_csv("unidad,dia\nX1,160\n", ["unidad", "codigo", "dia"]), "columnas")
        assert p.ingresar(filas_csv("unidad,codigo,dia\nX1,a,160\n", ["unidad", "codigo", "dia"]), "archivo") == 1


def test_playa_dura_cinco_dias_y_respeta_el_despacho():
    with tempfile.TemporaryDirectory() as c:
        p = _planta(c)
        p.ingresar([{"unidad": "V", "codigo": "A", "dia": 154}, {"unidad": "N", "codigo": "B", "dia": 155},
                    {"unidad": "D", "codigo": "C", "dia": 158}], "simulada")
        assert [u for u, *_ in p.playa(160)] == ["N", "D"]  # V pasó los 5 días.
        p.despachar(["D"], 159)
        assert [u for u, *_ in p.playa(160)] == ["N"]
        p.enviar("N", 160, 1, 1, 0.2, 1, "rf")
        assert p.playa(160) == []


def test_resultado_solo_de_lo_enviado():
    with tempfile.TemporaryDirectory() as c:
        p = _planta(c)
        p.ingresar([{"unidad": "E", "codigo": "A", "dia": 160}, {"unidad": "S", "codigo": "B", "dia": 160}], "simulada")
        p.enviar("E", 160, 1, 1, 0.2, 1, "rf")
        _rechaza(lambda: p.registrar_resultados([{"unidad": "S", "resultado": "OK", "dia": 162}], "archivo"), "no fue enviada")
        _rechaza(lambda: p.registrar_resultados([{"unidad": "E", "resultado": "MAL", "dia": 162}], "archivo"), "OK o CALIBRADA")
        p.registrar_resultados([{"unidad": "E", "resultado": "calibrada", "dia": 162, "componente": "V12"}], "archivo")
        _rechaza(lambda: p.deshacer("E"), "ya tiene resultado")
        assert p.registros(160, 162) == [(160, "A", True)] and p.registros(160, 161) == [] and p.registros(159, 162) == []


def test_version_congelada_no_ve_resultados_nuevos():
    with tempfile.TemporaryDirectory() as c:
        p = _planta(c)
        p.ingresar([{"unidad": "E", "codigo": "A", "dia": 160}], "simulada")
        p.enviar("E", 160, 1, 1, 0.2, 1, "tasa_fija")
        p.registrar_resultados([{"unidad": "E", "resultado": "CALIBRADA", "dia": 161}], "simulada")
        historico = [(100, "A", False), (100, "B", True), (100, "B", False), (100, "B", False)]
        vieja = modelo.predictor("tasa_fija", None, 149, modelo.fuente(historico, p, 149, 170), 1)
        nueva = modelo.predictor("tasa_fija", None, 165, modelo.fuente(historico, p, 165, 170), 2)
        filas = {f["codigo"]: f for f in modelo.comparar(vieja, nueva, 170, ["A", "B"])}
        assert filas["A"]["tasa_actual"] == 0 and filas["A"]["tasa_nueva"] == 0.5
        assert filas["A"]["puesto_actual"] == 2 and filas["A"]["puesto_nuevo"] == 1


def test_actualizacion_programada_cada_cinco_dias():
    assert [d for d in range(155, 172) if modelo.programada(d)] == [160, 165, 170]
    assert modelo.proxima(155) == 160 and modelo.proxima(160) == 165
    with tempfile.TemporaryDirectory() as c:
        p = _planta(c)
        p.nueva_version(149, 155, "inicio", 0)
        p.ingresar([{"unidad": f"U{i}", "codigo": "A", "dia": 154} for i in range(3)], "simulada")
        for i, d in enumerate((154, 155, 158)):
            p.enviar(f"U{i}", d, 1, 1, 0.2, 1, "rf")
        p.registrar_resultados([{"unidad": f"U{i}", "resultado": "OK", "dia": 159} for i in range(3)], "simulada")
        assert modelo.aplicar_programa(p, 159) is None  # No toca.
        assert modelo.aplicar_programa(p, 160) == 2
        v = p.version()
        assert (v["entrenado_hasta"], v["resultados_usados"], v["decidido_por"]) == (155, 2, modelo.AUTOMATICA)
        assert modelo.aplicar_programa(p, 160) is None  # Una sola vez por día.


def test_reporte_solo_agrega_lo_auditado():
    envios = [{"codigo": "A", "dia": 161, "resultado": "CALIBRADA", "componente": "V1"},
              {"codigo": "A", "dia": 162, "resultado": "OK", "componente": None},
              {"codigo": "B", "dia": 168, "resultado": "CALIBRADA", "componente": "V1"},
              {"codigo": "B", "dia": 169, "resultado": None, "componente": None}]
    atr = lambda c: {"mercado": "M" + c, "version": "V", "motor": "X", "traccion": "4X4"}  # noqa: E731
    r = reporte_linea(envios, atr)
    assert r["auditadas"] == 3 and r["calibradas"] == 2
    assert [(f["grupo"], f["n"], f["calibradas"]) for f in r["por_codigo"]] == [("B", 1, 1), ("A", 2, 1)]
    assert r["componentes"] == [{"componente": "V1", "n": 2, "parte": 1.0}] and len(r["semanas"]) == 2


if __name__ == "__main__":
    fallas = 0
    for nombre, f in sorted((n, f) for n, f in globals().items() if n.startswith("test_")):
        try:
            f()
            print(f"PASS {nombre}")
        except Exception:  # noqa: BLE001
            fallas += 1
            print(f"FAIL {nombre}")
            traceback.print_exc()
    print("PASS" if not fallas else f"{fallas} FALLAS")
    sys.exit(1 if fallas else 0)
