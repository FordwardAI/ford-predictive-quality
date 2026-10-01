#!/usr/bin/env bash
# Renders de la escena 3D (WebP 1600×900 en assets/renders/) con Chrome headless.
# Envoltorio de renderizar.py, que levanta el servidor local, abre escena/demo.html?captura=1
# por DevTools y guarda cada escena. Sólo biblioteca estándar de Python.
#
# Uso:
#   CHROME="/ruta/a/chrome" prototipos/presentacion-3d/herramientas/renderizar.sh [escena ...] [--opciones]
# Opciones de renderizar.py: --calidad alta|baja, --p 0.5, --formato webp|png, --extra "env=room",
#   --sufijo=-x, --salida <carpeta>, --gl d3d11|swiftshader|default. Ver --help.
# Requiere internet: three.js, GSAP y el decodificador Draco se cargan por CDN.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON="${PYTHON:-$(command -v python3 || command -v python)}"
CHROME="${CHROME:-$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)}"
if [ -z "$CHROME" ]; then
  echo "Definí CHROME con la ruta a Chrome o Chromium." >&2
  exit 1
fi
# Por defecto la escena se congela (?reducido): renders reproducibles, sin giro ni partículas al azar.
exec "$PYTHON" "$DIR/renderizar.py" --chrome "$CHROME" --extra "${EXTRA:-reducido}" "$@"
