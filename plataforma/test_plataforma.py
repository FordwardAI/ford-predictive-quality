"""Pruebas sintéticas de la plataforma: .venv/bin/python -m plataforma.test_plataforma (no requieren el CSV)."""
import sys
import tempfile
import traceback
from types import SimpleNamespace as NS

from plataforma.estado import AUDITAR, FUERA, NO_AUDITAR, Dia
from plataforma.privacidad import SinVin, revisar


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
