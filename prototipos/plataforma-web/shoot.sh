#!/bin/bash
# Capturas de la galería con Chrome sin interfaz: ./shoot.sh v1  →  shots/v1/*.png
# Necesita data.js (generado por exportar_datos.py). Rutas relativas a esta carpeta.
set -euo pipefail
cd "$(dirname "$0")"
V="${1:-v1}"
# Chrome: la variable CHROME manda; si no está, se busca la ruta habitual de macOS, Windows o Linux.
if [ -z "${CHROME:-}" ]; then
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"            "/c/Program Files/Google/Chrome/Application/chrome.exe"            "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"            "$(command -v google-chrome || true)"; do
    [ -n "$c" ] && [ -x "$c" ] && { CHROME="$c"; break; }
  done
fi
[ -n "${CHROME:-}" ] || { echo "No encuentro Chrome: definir CHROME=/ruta/al/ejecutable" >&2; exit 1; }
W=1840
OUT="shots/$V"
mkdir -p "$OUT"
[ -f data.js ] || { echo "Falta data.js: correr exportar_datos.py primero" >&2; exit 1; }
# En Windows (Git Bash) Chrome necesita file:///C:/…; cygpath -m da esa forma.
DIR="$PWD"
command -v cygpath >/dev/null 2>&1 && DIR="/$(cygpath -m "$PWD")"
BASE="file://$DIR/index.html"
FLAGS=(--headless=new --hide-scrollbars --allow-file-access-from-files --virtual-time-budget=15000)

# Chrome sin interfaz a veces se cuelga: se corta a los 60 s y se reintenta una vez.
chrome() {
  local intento p
  for intento in 1 2; do
    "$CHROME" "${FLAGS[@]}" "$@" 2>/dev/null &
    p=$!
    for _ in $(seq 1 60); do kill -0 "$p" 2>/dev/null || return 0; sleep 1; done
    kill "$p" 2>/dev/null; echo "reintento: $*" >&2
  done
}

medir() {  # $1 = query → altura en px (título «H=…» que escribe la galería con ?measure=1)
  chrome --window-size=$W,1200 --dump-dom "$BASE?$1&measure=1" \
    | sed -n 's/.*<title>H=\([0-9]*\).*/\1/p' | head -1
}

i=1
for s in operacion codigos evidencia implementacion; do
  H=$(medir "s=$s&bare=1&full=1")
  H=${H:-3000}
  chrome --window-size=$W,$H --screenshot="$OUT/$i-$s.png" "$BASE?s=$s&bare=1&full=1" >/dev/null
  echo "$OUT/$i-$s.png ($W × $H)"
  i=$((i + 1))
done

H=$(medir "x=1")
H=${H:-6000}
chrome --window-size=$W,$H --screenshot="$OUT/0-galeria.png" "$BASE" >/dev/null
echo "$OUT/0-galeria.png ($W × $H)"

# Cada pantalla sola, a 1440 × 994 (lo que se ve en el marco).
mkdir -p "$OUT/pantallas"
for p in d-inicio.html d-hoja.html "d-hoja.html?estado=sin-programa" "d-hoja.html?estado=qls-caido" d-ronda.html \
         "d-ronda.html?estado=no-llego" d-codigos.html "d-codigos.html?mercado=primero" "d-codigo.html?c=primero" \
         "d-codigo.html?c=alerta" d-alertas.html "d-alertas.html?estado=sin-alertas" d-evaluacion.html \
         "d-evaluacion.html?vista=ml" d-exploracion.html d-datos.html d-control.html d-config.html \
         "d-config.html?estado=error-archivo"; do
  n=$(echo "$p" | sed 's/\.html//; s/[?=&]/-/g')
  chrome --window-size=1440,994 --screenshot="$OUT/pantallas/$n.png" "file://$DIR/$p" >/dev/null
done
echo "$OUT/pantallas/ ($(ls "$OUT/pantallas" | wc -l | tr -d ' ') capturas)"
