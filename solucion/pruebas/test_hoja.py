"""Hoja de códigos prioritarios: cantidad sugerida, traspaso por el ranking y ausencia de VIN."""
import tempfile
from pathlib import Path

from solucion import hoja
from solucion.datos import construir
from solucion.referencias import Movil
from solucion.pruebas.sintetico import CATALOGO, evento, tabla

MINIMO = (20, "prueba")


def test_cantidad_sugerida_llena_el_cupo_con_minimo_primero():
    programadas = {"A": 3, "B": 5, "C": 2, "D": 4}
    por_ranking, exploracion, sin_cubrir = hoja.sugerir(["A", "B", "C", "D"], programadas, ["D", "C"], 6)
    assert exploracion == ["D", "C"] and por_ranking == {"A": 3, "B": 1} and sin_cubrir == 0
    # El mínimo nunca pasa el cupo, y un código con mínimo no recibe más unidades de las programadas.
    assert hoja.sugerir(["A", "B"], {"A": 1, "B": 9}, ["B", "A"], 1) == ({}, ["B"], 0)
    assert hoja.sugerir(["A", "B"], {"A": 1, "B": 9}, ["A"], 4) == ({"B": 3}, ["A"], 0)
    assert hoja.sugerir(["A"], {"A": 2}, [], 5) == ({"A": 2}, [], 3)


def _tabla_con_codigo_vencido():
    """ABA1 no tiene resultados entre el Día 101 y el 189: al Día 190 le toca el mínimo por código."""
    eventos, i = [], 0
    for dia in range(100, 191):
        for codigo, cantidad in (("AAA1", 20), ("AAB1", 10), ("ABA1", 10)):
            if codigo == "ABA1" and 100 < dia < 190:
                continue
            for j in range(cantidad):
                i += 1
                calibrada = (codigo == "AAA1" and j < 6) or (codigo == "AAB1" and j < 1)
                eventos.append(evento(f"SYNV{i:06d}", dia, codigo, "CALIBRADA" if calibrada else "OK"))
    return construir(eventos, CATALOGO, fuente={"csv_sha256": "sintetico"})


def test_hoja_pone_el_minimo_aparte_y_llena_el_cupo_por_el_ranking():
    t = _tabla_con_codigo_vencido()
    programa = hoja.simular_programa(t, 190)
    h = hoja.armar(t, programa, 190, cupo_dia=4, predictor=Movil(60, 0), minimo=MINIMO, evaluacion=None)
    assert [c for c, _ in h.exploracion] == ["ABA1"] and h.exploracion[0][1] == 100
    # ABA1 no tiene resultados en la ventana: usa la tasa general (23,3 %) y queda entre AAA1 y AAB1.
    assert [f.codigo for f in h.filas] == ["AAA1", "ABA1", "AAB1"]
    assert {f.codigo: f.sugerida for f in h.filas} == {"AAA1": 3, "ABA1": 0, "AAB1": 0}
    assert sum(len(ids) for _, _, ids in h.unidades) == 4 and h.sin_cubrir == 0
    assert [f.acumulado for f in h.filas] == [20, 30, 40]
    assert h.cupo_5 == 2 and h.filas[0].n == 60 * 20 and h.filas[1].rango is None  # Días 126–185.


def test_reasignar_baja_por_el_ranking_y_azar_solo_al_agotarse():
    ranking = ["A", "B", "C", "D"]
    nueva, azar = hoja.reasignar({"A": 3, "B": 2}, ranking, {"A": 1, "B": 2, "C": 1, "D": 5})
    assert nueva == {"A": 1, "B": 2, "C": 1, "D": 1} and azar == 0
    nueva, azar = hoja.reasignar({"A": 3, "B": 2}, ranking, {"A": 0, "B": 2, "C": 0, "D": 1})
    assert nueva == {"B": 2, "D": 1} and azar == 2
    # Un código de abajo que no llega no le quita lugar a nadie: todo llegó completo arriba.
    nueva, azar = hoja.reasignar({"A": 2, "C": 1}, ranking, {"A": 2, "B": 0, "C": 0, "D": 0})
    assert nueva == {"A": 2} and azar == 1


def test_ninguna_salida_contiene_un_vin():
    t = tabla()
    with tempfile.TemporaryDirectory() as carpeta:
        h, archivos = hoja.construir_hoja(t, 190, carpeta, predictor=Movil(60, 20), minimo=MINIMO, evaluacion=None)
        assert {Path(a).suffix for a in archivos} == {".csv", ".xlsx", ".html"}
        vins = [v.vin for v in t.vins]
        assert not hoja.vins_en(archivos, vins)
        assert "U-0001" in Path(archivos[2]).read_text(encoding="utf-8")
        # El control detecta un VIN si llegara a colarse.
        Path(archivos[2]).write_text(Path(archivos[2]).read_text(encoding="utf-8") + vins[0], encoding="utf-8", newline="\n")
        assert hoja.vins_en(archivos, vins) == {vins[0]}
        # El programa recibido por archivo arma la misma hoja.
        otra = hoja.construir_hoja(t, 190, Path(carpeta) / "otra", programa_path=archivos[3], predictor=Movil(60, 20),
                                   minimo=MINIMO, evaluacion=None)[0]
        assert [(f.codigo, f.sugerida) for f in otra.filas] == [(f.codigo, f.sugerida) for f in h.filas]
        assert sum(f.sugerida for f in h.filas) + len(h.exploracion) == h.cupo == 2
