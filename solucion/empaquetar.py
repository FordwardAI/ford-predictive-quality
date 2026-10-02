"""Arma el .zip de reproducción (P13, E4): código, entorno, resultados agregados y la hoja; nunca datos crudos.

    python -m solucion.empaquetar --destino reproduccion.zip [--salida DIR_HOJA] [--anexo ARCHIVO ...]
        [--csv CSV --catalogo CATALOGO]

Parte de `git ls-files` (lo versionado), así que `.venv`, cachés, `node_modules` y las capturas locales quedan fuera. La hoja y los
anexos se agregan desde fuera del repo. Al generar verifica que el .zip no tenga ningún .csv de datos, ningún VIN de la
tabla (si se pasan `--csv` y `--catalogo`) ni nada con forma de VIN.
"""
import argparse
import io
import re
import subprocess
import sys
import zipfile
from pathlib import Path

from solucion.datos import RAIZ

PREFIJOS = {"solucion/": None, "research/": {".py", ".json", ".md", ".png", ".svg"},
            "docs/": {".md", ".png", ".svg"}, "plataforma/": None, "prototipos/presentacion-3d/": None}
RAIZ_INCLUIDA = {"requirements.txt", ".python-version", "README.md", "AGENTS.md", "CLAUDE.md", "CONTEXT.md", "CONTRIBUTING.md"}
EXCLUIDOS = ("/__pycache__/", "/.venv/", "/node_modules/", "/assets/local/", "/assets/fuente/")
PRESENTACION = "prototipos/presentacion-3d/"
DATOS_CRUDOS = {".csv", ".xlsx", ".xls", ".pickle", ".pkl", ".parquet"}
# Binarios de la presentación (modelo 3D y renders): no tienen texto que revisar y dan falsos positivos de forma de VIN.
BINARIOS = {".glb", ".webp"}
CARPETA_HOJA, CARPETA_ANEXOS = "hoja/", "anexos/"
FORMA_VIN = re.compile(r"\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-HJ-NPR-Z0-9]{17}\b")

README = """# Entrega FordwardAI: cómo ver y reproducir la solución

Versión del código: `{version}`. Fuente de los datos: los hashes de `docs/datos-locales.md` (CSV `a24860d8…c5a82b`,
catálogo `89e5a9d9…3e047`). **Los datos no vienen en este .zip**: la plataforma y la reproducción necesitan los dos
archivos locales (el CSV QLS y el catálogo). La presentación no los necesita.

## 1. Entorno (una vez)

Python 3.13 (ver `.python-version`). Desde esta carpeta:
```sh
python3.13 -m venv .venv
.venv/bin/pip install -r requirements.txt          # Windows: .venv\\Scripts\\pip
```
xgboost y lightgbm necesitan OpenMP del sistema: en macOS, `brew install libomp`; en Linux (Debian/Ubuntu),
`apt-get install libgomp1`. En Windows, el intérprete es `.venv\\Scripts\\python` y hace falta `set PYTHONUTF8=1`.

## 2. Ver la plataforma

MVP con una fuente simulada sobre la base ficticia (Días 155–194):
```sh
.venv/bin/python -m plataforma.servidor --csv "/ruta/Dataset QLS Inspección Adicional.csv" \\
  --catalogo "/ruta/Códigos de catálogo.csv" --puerto 8765
```
Abrir http://127.0.0.1:8765. El día arranca en Día de planta: «Armar la hoja», después Hoja del día, Selección,
Seguimiento, Resultados, Modelo y Reporte para la línea; «Avanzar al día siguiente» simula la llegada de unidades y
resultados. Ningún VIN sale del servidor. Detalle en `plataforma/README.md`.

## 3. Ver la presentación

Sitio estático; necesita internet para three.js, GSAP y las fuentes. Desde esta carpeta:
```sh
python3 -m http.server 8000
```
Abrir http://localhost:8000/prototipos/presentacion-3d/. Se recorre con las flechas; `N` muestra las notas del orador.
Las capturas de la plataforma no vienen en el .zip porque muestran tasas por código: sin ellas se ve un esquema, con
un aviso que `?limpio=1` oculta. Se generan con `prototipos/presentacion-3d/herramientas/capturar_flujo.sh`.

## 4. Comprobar los resultados (opcional)

Los resultados de referencia son los agregados versionados en `solucion/resultados/`, de las corridas documentadas.
- Pruebas sintéticas, sin los datos: `.venv/bin/python -m solucion.pruebas`.
- Recalcular la validación y la hoja de desarrollo del Día 190 (unos minutos; la salida va fuera de esta carpeta):
  ```sh
  .venv/bin/python -m solucion.run --csv "/ruta/Dataset QLS Inspección Adicional.csv" \\
    --catalogo "/ruta/Códigos de catálogo.csv" --salida ../salida
  ```
  Coinciden `preparacion`, `p3`, `p5`, `p8` y `p9`, salvo `version_codigo`. En `p4`, `eleccion` y `p6` (modelos de ML)
  puede variar la 3.ª cifra decimal o la semilla mediana según el procesador, sin cambiar la alternativa ganadora.
- La elección por precisión (`--piezas precision`, donde gana CatBoost) también entrena modelos de ML y depende del
  procesador: sus cifras de referencia son las de `solucion/resultados/precision.json`.

**La prueba final no se vuelve a correr.** Sus tres lecturas (tasa fija y CatBoost con atributos el 30/09,
Random Forest con atributos el 01/10) tienen sus preregistros en `solucion/preregistro.json`,
`solucion/preregistro-precision.json` y `solucion/preregistro-efectividad.json`; la solución es CatBoost. El registro
agregado está en `solucion/resultados/prueba-final.json` y la hoja final incluida se conserva.

## Contenido

`plataforma/` (MVP de la plataforma), `prototipos/presentacion-3d/` (la presentación), `solucion/` (código, pruebas y
`resultados/`, solo agregados), `solucion/experimentos/` (exploratorios, no corren por defecto), `research/`
(auditoría, particiones e informes), `docs/` (borradores del informe y documentación), `{hoja}` (hoja de códigos
prioritarios, sin VIN) y `{anexos}` (material de apoyo). Todas las cifras valen entre auditados con actividad QLS,
base ficticia.
"""


def _git(*args):
    return subprocess.run(["git", "-C", str(RAIZ), *args], capture_output=True, text=True, check=True).stdout


def archivos_versionados():
    """Rutas relativas (con `/`) de lo versionado que entra en el .zip."""
    elegidos = []
    for ruta in _git("ls-files").splitlines():
        if any(x in "/" + ruta for x in EXCLUIDOS) or Path(ruta).suffix in DATOS_CRUDOS:
            continue
        if ruta in RAIZ_INCLUIDA:
            elegidos.append(ruta)
            continue
        for prefijo, extensiones in PREFIJOS.items():
            if ruta.startswith(prefijo) and (extensiones is None or Path(ruta).suffix in extensiones):
                elegidos.append(ruta)
    return sorted(elegidos)


def version_codigo():
    sucio = bool(_git("status", "--porcelain", "--untracked-files=no").strip())
    return _git("rev-parse", "HEAD").strip() + ("+cambios" if sucio else "")


def _textos(zf):
    """(nombre, texto) de cada miembro; abre los .xlsx anidados, que guardan el texto en XML."""
    for nombre in zf.namelist():
        if Path(nombre).suffix in BINARIOS:
            continue
        datos = zf.read(nombre)
        if nombre.endswith(".xlsx"):
            with zipfile.ZipFile(io.BytesIO(datos)) as interno:
                yield nombre, " ".join(interno.read(n).decode("utf-8", "replace") for n in interno.namelist())
        else:
            yield nombre, datos.decode("utf-8", "replace")


def controlar(destino, vins=()):
    """Lista de problemas del .zip: CSV de datos, VIN de la tabla o texto con forma de VIN."""
    problemas, vins = [], set(vins)
    with zipfile.ZipFile(destino) as zf:
        for nombre in zf.namelist():
            sufijo = Path(nombre).suffix
            if sufijo in DATOS_CRUDOS and not nombre.startswith(CARPETA_HOJA):
                problemas.append(f"{nombre}: archivo de datos fuera de la hoja")
            fuera = nombre.startswith("prototipos/") and not nombre.startswith(PRESENTACION)
            if (Path(nombre).name == "data.js" or fuera or nombre.startswith(".venv/")
                    or any(x in "/" + nombre for x in EXCLUIDOS)):
                problemas.append(f"{nombre}: no debe ir en el .zip")
        for nombre, texto in _textos(zf):
            palabras = set(re.findall(r"[A-Za-z0-9]+", texto))
            if vins & palabras:
                problemas.append(f"{nombre}: contiene un VIN de la tabla")
            elif FORMA_VIN.search(texto):
                problemas.append(f"{nombre}: contiene texto con forma de VIN")
    return problemas


def armar(destino, salida=None, anexos=(), vins=(), permitir_sucio=False):
    destino = Path(destino)
    assert RAIZ not in destino.resolve().parents, "El .zip se escribe fuera del repo"
    version = version_codigo()
    assert permitir_sucio or not version.endswith("+cambios"), "Hay cambios sin commitear en lo versionado"
    hoja = [p for p in sorted(Path(salida).rglob("*")) if p.is_file()] if salida else []
    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("LEEME.md", README.format(version=version, hoja=CARPETA_HOJA, anexos=CARPETA_ANEXOS))
        for ruta in archivos_versionados():
            zf.write(RAIZ / ruta, ruta)
        for p in hoja:
            zf.write(p, CARPETA_HOJA + p.relative_to(salida).as_posix())
        for p in map(Path, anexos):
            zf.write(p, CARPETA_ANEXOS + p.name)
    problemas = controlar(destino, vins)
    if problemas:
        destino.unlink()
        raise AssertionError("El .zip no pasó los controles:\n" + "\n".join(problemas))
    return destino


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--destino", required=True, type=Path)
    parser.add_argument("--salida", type=Path, help="Carpeta de la hoja generada por solucion.run")
    parser.add_argument("--anexo", action="append", default=[], type=Path)
    parser.add_argument("--csv", type=Path, help="Con --catalogo: busca además los VIN exactos de la tabla")
    parser.add_argument("--catalogo", type=Path)
    parser.add_argument("--permitir-sucio", action="store_true", help="Solo para ensayar la herramienta")
    opciones = parser.parse_args(argv)
    vins = ()
    if opciones.csv and opciones.catalogo:
        from solucion import datos, run
        vins = [v.vin for v in datos.cargar(opciones.csv, opciones.catalogo, cache=run.CACHE).vins]
    destino = armar(opciones.destino, opciones.salida, opciones.anexo, vins, opciones.permitir_sucio)
    print(f"{destino} ({destino.stat().st_size} bytes); VIN buscados: {len(vins) or 'solo forma de VIN'}")


if __name__ == "__main__":
    sys.exit(main())
