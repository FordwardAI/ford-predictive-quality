"""Empaquetado de P13: el .zip debe fallar si entra un CSV de datos, un VIN o texto con forma de VIN."""
import tempfile
import zipfile
from pathlib import Path

from solucion import empaquetar
from solucion.datos import RAIZ


def _zip(d, miembros):
    destino = Path(d) / "x.zip"
    with zipfile.ZipFile(destino, "w") as zf:
        for nombre, contenido in miembros.items():
            zf.writestr(nombre, contenido)
    return destino


def test_zip_limpio_pasa_y_csv_de_datos_falla():
    with tempfile.TemporaryDirectory() as d:
        assert empaquetar.controlar(_zip(d, {"solucion/a.py": "x = 1", "hoja/hoja.csv": "codigo;n\nAAA1;3"})) == []
        assert empaquetar.controlar(_zip(d, {"datos/base.csv": "a,b"}))  # CSV fuera de la hoja.
        assert empaquetar.controlar(_zip(d, {"prototipos/presentacion-3d/assets/local/data.js": "var D = {}"}))
        assert empaquetar.controlar(_zip(d, {"prototipos/presentacion-3d/assets/local/flujo-2-hoja.png": "x"}))
        assert empaquetar.controlar(_zip(d, {"prototipos/otro/index.html": "<html>"}))
        assert empaquetar.controlar(_zip(d, {"prototipos/presentacion-3d/index.html": "<html>"})) == []


# El VIN de ejemplo se arma concatenando para que el control del .zip no lo vea literal.
def test_vin_de_la_tabla_y_forma_de_vin_fallan_tambien_dentro_de_un_xlsx():
    import io
    interno = io.BytesIO()
    with zipfile.ZipFile(interno, "w") as xlsx:
        xlsx.writestr("xl/sharedStrings.xml", "<si><t>SYN001002</t></si>")
    with tempfile.TemporaryDirectory() as d:
        assert empaquetar.controlar(_zip(d, {"hoja/h.xlsx": interno.getvalue()}), vins=["SYN001002"])
        assert empaquetar.controlar(_zip(d, {"anexos/n.txt": "unidad " + "3FA6P0H75ER" + "123456"}))
        assert not empaquetar.controlar(_zip(d, {"anexos/n.txt": "unidad SYN001002"}), vins=["SYN009999"])
        # El modelo 3D es binario: sus bytes pueden tener forma de VIN sin serlo.
        assert not empaquetar.controlar(_zip(d, {"prototipos/presentacion-3d/assets/m.glb": "P1P0P2P2" + "P0P3P3P0P"}))


def test_lo_versionado_incluye_codigo_plataforma_y_presentacion_sin_datos():
    if not (RAIZ / ".git").exists():
        return  # Dentro del .zip de reproducción no hay repositorio.
    archivos = empaquetar.archivos_versionados()
    assert "solucion/run.py" in archivos and "requirements.txt" in archivos and ".python-version" in archivos
    assert "plataforma/servidor.py" in archivos and "plataforma/web/index.html" in archivos
    assert "prototipos/presentacion-3d/index.html" in archivos
    assert not [a for a in archivos if a.endswith((".csv", ".xlsx")) or "/assets/local/" in a or "/node_modules/" in a
                or (a.startswith("prototipos/") and not a.startswith(empaquetar.PRESENTACION))]
    assert {"docs/datos-locales.md", "solucion/experimentos/README.md", "research/busqueda-amplia.md",
            "solucion/experimentos/resultados/busqueda.json", "solucion/preregistro.json",
            "solucion/preregistro-precision.json", "solucion/resultados/prueba-final.json"} <= set(archivos)


def test_comando_separa_salidas_y_no_corre_experimentos_por_defecto():
    import importlib
    from unittest.mock import patch
    from solucion import run

    for pieza, modulo in run.PIEZAS.items():
        assert importlib.import_module(modulo)
        if modulo.startswith("solucion.experimentos."):
            assert pieza in run.OPCIONALES
    with tempfile.TemporaryDirectory() as d, patch.object(run, "RESULTADOS", Path(d) / "principal"), \
         patch.object(run, "RESULTADOS_EXPERIMENTALES", Path(d) / "experimentos"):
        assert run.guardar("p3", {"sintetico": True}).parent.name == "principal"
        assert run.guardar("precision", {"sintetico": True}).parent.name == "principal"
        assert run.guardar("busqueda", {"sintetico": True}).parent.name == "experimentos"
