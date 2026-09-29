"""Figuras (P9) sobre resultados sintéticos: se generan en una carpeta temporal y se omiten las que faltan."""
import json
import tempfile
from pathlib import Path

from solucion import figuras

CAL = "entre auditados con actividad QLS, validación 155–194, base ficticia, n = 100 VIN"


def _alt(nombre, familia, orden, prec, elegible=True):
    return {"alternativa": nombre, "familia": familia, "orden_simplicidad": orden, "elegible": elegible,
            "calificador": CAL, "precision_cupo": prec, "precision_rango95": [prec - 0.03, prec + 0.03],
            "azar_mismo_cupo": 0.1, "veces_azar": prec / 0.1,
            "veces_azar_rango95": [prec / 0.1 - 0.3, prec / 0.1 + 0.3]}


def _escribir(carpeta, pieza, contenido):
    (carpeta / f"{pieza}.json").write_text(json.dumps(contenido, ensure_ascii=False))


def test_formato_con_coma_decimal():
    assert figuras.pct(0.15089) == "15,1 %" and figuras.veces(1.5276) == "1,53×"


def test_genera_omite_y_es_determinista():
    with tempfile.TemporaryDirectory() as tmp:
        res, dest = Path(tmp) / "resultados", Path(tmp) / "figuras"
        res.mkdir()
        fija, movil = _alt("tasa fija (<= 149)", "tasa_fija", [1, 0], 0.15), _alt("móvil 30 d", "movil", [2, 0], 0.17)
        _escribir(res, "p3", {"resultados": [_alt("azar", "azar", [0, 0], 0.09, False), fija, movil,
                                             _alt("oráculo", "oraculo", [98, 0], 0.2, False)]})
        _escribir(res, "eleccion", {"mejor_precision": "móvil 30 d", "ganadora": dict(fija, lectura="mejora"),
                                    "comparacion": [{"alternativa": "tasa fija (<= 149)", "empata": True},
                                                    {"alternativa": "móvil 30 d", "empata": True}]})
        resumen = figuras.generar(res, dest)
        generadas = {g["nombre"] for g in resumen["generadas"]}
        assert generadas == {"comparacion_alternativas", "veces_azar", "diagrama_proceso", "diagrama_solucion"}
        assert {o["nombre"] for o in resumen["omitidas"]} == {"etiquetas_parciales", "componente", "detector"}
        assert all((dest / f"{n}.{ext}").stat().st_size > 0 for n in generadas for ext in ("png", "svg"))
        assert CAL in (dest / "README.md").read_text()
        svg, png = (dest / "veces_azar.svg").read_bytes(), (dest / "veces_azar.png").read_bytes()
        figuras.generar(res, dest)
        assert (dest / "veces_azar.svg").read_bytes() == svg and (dest / "veces_azar.png").read_bytes() == png

        _escribir(res, "p5", {"resultados": [{"politica": "ε = 0", "precision_cupo": 0.14, "calificador": CAL},
                                             {"politica": "mínimo por código", "precision_cupo": 0.13,
                                              "precision_rango95": [0.1, 0.16], "elegida": True}]})
        _escribir(res, "p6", {"componente": {"acierto_top3": 0.4, "acierto_top3_general": 0.335},
                              "detector": {"potencia": {"×2": 0.8, "×½": {"potencia": 0.3, "rango95": [0.2, 0.4]}}}})
        resumen = figuras.generar(res, dest)
        assert not resumen["omitidas"], resumen["omitidas"]
        nombres = {g["nombre"] for g in resumen["generadas"]}
        assert {"etiquetas_parciales", "donde_mirar", "detector_potencia"} <= nombres
