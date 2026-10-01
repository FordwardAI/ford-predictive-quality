"""Comando único: regenera resultados de validación, figuras y la hoja.

    .venv/bin/python -m solucion.run --csv "<Dataset QLS Inspección Adicional.csv>" \\
        --catalogo "<Códigos de catálogo.csv>" [--salida DIR] [--cache DIR] [--piezas p3,p4]

Cada pieza es un módulo con `correr(tabla, opciones) -> dict`; el resultado se guarda en
solucion/resultados/<pieza>.json; los experimentos, en solucion/experimentos/resultados/
(solo agregados, sin VIN ni tasas por código). La prueba
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
RESULTADOS_EXPERIMENTALES = datos.RAIZ / "solucion" / "experimentos" / "resultados"
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
    "historial_vin": "solucion.experimentos.historial_vin",  # Opcional: experimento de validación sobre el historial del VIN.
    "ensemble": "solucion.experimentos.ensemble",  # Opcional: CatBoost + tasa móvil, solo Día <195.
    "busqueda": "solucion.experimentos.busqueda",  # Opcional: individuales, columnas, aumento y combinaciones amplias.
    "semillas_busqueda": "solucion.experimentos.semillas_busqueda",  # Estabilidad, sin elegir otra mezcla.
    "simulacion": "solucion.experimentos.simulacion",  # Opcional: mundo con verdad conocida; ~80 min, solo Día <195.
}
OPCIONALES = ("precision", "historial_vin", "ensemble", "busqueda", "semillas_busqueda", "simulacion")
CACHE = Path.home() / ".cache" / "ford-predictive-quality"


def guardar(pieza, resultado):
    carpeta = RESULTADOS_EXPERIMENTALES if PIEZAS[pieza].startswith("solucion.experimentos.") else RESULTADOS
    carpeta.mkdir(parents=True, exist_ok=True)
    destino = carpeta / f"{pieza}.json"
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
                        help=f"Subconjunto de {','.join(PIEZAS)} (`precision` y `historial_vin` solo si se piden)")
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
