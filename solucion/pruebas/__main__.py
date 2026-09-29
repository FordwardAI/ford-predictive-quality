"""Corre todas las pruebas sintéticas: python3 -m solucion.pruebas (no requiere el CSV)."""
import importlib
import pkgutil
import sys
import traceback

import solucion.pruebas as paquete

fallas = 0
for modulo in sorted(m.name for m in pkgutil.iter_modules(paquete.__path__) if m.name.startswith("test_")):
    mod = importlib.import_module(f"solucion.pruebas.{modulo}")
    for nombre in sorted(n for n in dir(mod) if n.startswith("test_")):
        try:
            getattr(mod, nombre)()
            print(f"PASS {modulo}.{nombre}")
        except Exception:  # noqa: BLE001 - se informa cada falla y se sigue.
            fallas += 1
            print(f"FAIL {modulo}.{nombre}")
            traceback.print_exc()
print("PASS" if not fallas else f"{fallas} FALLAS")
sys.exit(1 if fallas else 0)
