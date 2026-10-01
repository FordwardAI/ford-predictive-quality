#!/bin/bash
# Capturas locales de la plataforma para la presentación 3D.
#
#   prototipos/presentacion-3d/herramientas/capturar_plataforma.sh [versión]
#
# Corre prototipos/plataforma-web/shoot.sh (Chrome sin interfaz; otra ruta con
# CHROME=…) y copia d-hoja, d-inicio, d-codigos y d-alertas a
# prototipos/presentacion-3d/assets/local/. Esas capturas muestran tasas por
# código de la base ficticia: assets/local/ queda fuera de Git y no se versiona.
#
# Necesita prototipos/plataforma-web/data.js, que genera exportar_datos.py con el
# CSV crudo. Este script no genera datos: si falta data.js, falla y avisa.
set -euo pipefail

AQUI="$(cd "$(dirname "$0")" && pwd)"
PRESENTACION="$(dirname "$AQUI")"
PLATAFORMA="$(cd "$PRESENTACION/../plataforma-web" && pwd)"
DESTINO="$PRESENTACION/assets/local"
V="${1:-presentacion}"

if [ ! -f "$PLATAFORMA/data.js" ]; then
  cat >&2 <<EOF
Falta prototipos/plataforma-web/data.js.
Se genera con exportar_datos.py, que necesita el CSV crudo y el catálogo (fuera del repo):
  cd prototipos/plataforma-web
  ../../.venv/bin/python exportar_datos.py --csv "/ruta/al/Dataset QLS Inspección Adicional.csv" \\
    --catalogo "/ruta/a/Códigos de catálogo.csv"
Este script no genera datos. Sin las capturas, la presentación muestra los esquemas
de assets/ilustraciones/ (plataforma-mock.svg y hoja-mock.svg).
EOF
  exit 1
fi

# En Windows, la ruta habitual de Chrome si CHROME no está definida.
if [ -z "${CHROME:-}" ] && [ -x "/c/Program Files/Google/Chrome/Application/chrome.exe" ]; then
  export CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
fi

bash "$PLATAFORMA/shoot.sh" "$V"

mkdir -p "$DESTINO"
faltan=0
for p in d-hoja d-inicio d-codigos d-alertas; do
  origen="$PLATAFORMA/shots/$V/pantallas/$p.png"
  if [ -f "$origen" ]; then
    cp "$origen" "$DESTINO/$p.png"
    echo "assets/local/$p.png"
  else
    echo "No se generó $origen" >&2
    faltan=1
  fi
done

# Control: nada de assets/local/ debe quedar a la vista de Git.
if git -C "$PRESENTACION" status --porcelain -- assets/local | grep -q .; then
  echo "ATENCIÓN: assets/local/ no está ignorado por Git; no subir estas capturas." >&2
  exit 1
fi
exit "$faltan"
