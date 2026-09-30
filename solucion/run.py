"""Comando único: regenera resultados de validación, figuras y la hoja.

    .venv/bin/python -m solucion.run --csv "<Dataset QLS Inspección Adicional.csv>" \\
        --catalogo "<Códigos de catálogo.csv>" [--salida DIR] [--cache DIR] [--piezas p3,p4]

Cada pieza es un módulo con `correr(tabla, opciones) -> dict`; el resultado se guarda en
solucion/resultados/<pieza>.json (solo agregados, sin VIN ni tasas por código). La prueba
final no se corre desde acá: ver `python -m solucion.preregistro correr --help`.
"""
import argparse
import importlib
import json
import sys
import time
from pathlib import Path

from . import datos

RESULTADOS = datos.RAIZ / "solucion" / "resultados"
PIEZAS = {  # Orden de dependencias del plan de acción.
    "preparacion": "solucion.preparacion",
    "p3": "solucion.referencias",
    "p4": "solucion.ml",
    "eleccion": "solucion.eleccion",
    "p6": "solucion.diferencial",
    "p5": "solucion.exploracion",
    "p8": "solucion.hoja",
    "p9": "solucion.figuras",
    "precision": "solucion.precision",  # Opcional: ~30 min; no entra en el comando por defecto.
}
OPCIONALES = ("precision",)
CACHE = Path.home() / ".cache" / "ford-predictive-quality"


def leer(pieza):
    """Resultado ya guardado de otra pieza."""
    return json.loads((RESULTADOS / f"{pieza}.json").read_text(encoding="utf-8"))


def guardar(pieza, resultado):
    RESULTADOS.mkdir(parents=True, exist_ok=True)
    destino = RESULTADOS / f"{pieza}.json"
    destino.write_text(json.dumps(resultado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    return destino


def main(argv=None):
    assert sys.version_info[:2] == (3, 13), "Usar Python 3.13 (ver .python-version y solucion/README.md)"
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv", required=True, type=Path)
    parser.add_argument("--catalogo", required=True, type=Path)
    parser.add_argument("--salida", type=Path, default=CACHE / "salida",
                        help="Carpeta fuera del repo para la hoja (tiene tasas por código)")
    parser.add_argument("--cache", type=Path, default=CACHE)
    parser.add_argument("--piezas", default=",".join(p for p in PIEZAS if p not in OPCIONALES),
                        help=f"Subconjunto de {','.join(PIEZAS)} (`precision` solo si se pide)")
    parser.add_argument("--dia-hoja", type=int, default=190, help="Día del programa simulado de la hoja (E3)")
    opciones = parser.parse_args(argv)
    assert datos.RAIZ not in opciones.salida.resolve().parents, "La salida de la hoja va fuera del repo"
    tabla = datos.cargar(opciones.csv, opciones.catalogo, cache=opciones.cache)
    for pieza in opciones.piezas.split(","):
        inicio = time.time()
        modulo = importlib.import_module(PIEZAS[pieza])
        resultado = modulo.evidencia(tabla) if pieza == "preparacion" else modulo.correr(tabla, opciones)
        print(f"{pieza}: {guardar(pieza, resultado).relative_to(datos.RAIZ)} ({time.time() - inicio:.0f} s)")


if __name__ == "__main__":
    main()
