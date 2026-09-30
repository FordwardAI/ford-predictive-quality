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
        assert empaquetar.controlar(_zip(d, {"prototipos/plataforma-web/data.js": "var D = {}"}))


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


def test_lo_versionado_incluye_codigo_y_excluye_datos_y_prototipo():
    if not (RAIZ / ".git").exists():
        return  # Dentro del .zip de reproducción no hay repositorio.
    archivos = empaquetar.archivos_versionados()
    assert "solucion/run.py" in archivos and "requirements.txt" in archivos and ".python-version" in archivos
    assert not [a for a in archivos if a.startswith(("prototipos/", "docs/")) or a.endswith((".csv", ".xlsx"))]
