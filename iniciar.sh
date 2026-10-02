#!/usr/bin/env bash
# Levanta la plataforma (http://127.0.0.1:8765) y la presentación (http://localhost:8000/prototipos/presentacion-3d/).
#
#   ./iniciar.sh                                   # demo: la plataforma usa una base sintética
#   ./iniciar.sh "<Dataset QLS Inspección Adicional.csv>" "<Códigos de catálogo.csv>"   # con la base de Ford
#
# La primera vez crea el entorno .venv con Python 3.13 e instala requirements.txt. Ctrl+C corta los dos servidores.
# Otros puertos: PUERTO_PLATAFORMA=… PUERTO_PRESENTACION=… ./iniciar.sh. Sin abrir el navegador: NO_ABRIR=1.
set -euo pipefail
cd "$(dirname "$0")"

PUERTO_PLATAFORMA="${PUERTO_PLATAFORMA:-8765}"
PUERTO_PRESENTACION="${PUERTO_PRESENTACION:-8000}"

if [ ! -x .venv/bin/python ]; then
  PY=""
  for candidato in python3.13 python3; do
    if command -v "$candidato" >/dev/null 2>&1 && \
       "$candidato" -c 'import sys; sys.exit(sys.version_info[:2] != (3, 13))' 2>/dev/null; then
      PY="$candidato"; break
    fi
  done
  if [ -z "$PY" ]; then
    echo "Hace falta Python 3.13 (https://www.python.org/downloads/). Las versiones de requirements.txt están fijadas para 3.13." >&2
    exit 1
  fi
  echo "Creando el entorno .venv e instalando dependencias (una sola vez, unos minutos)…"
  "$PY" -m venv .venv
  .venv/bin/pip install --disable-pip-version-check -q -r requirements.txt
fi

ARGS=()
if [ $# -ge 2 ]; then
  ARGS=(--csv "$1" --catalogo "$2")
elif [ $# -eq 1 ]; then
  echo "Pasar los dos archivos (CSV y catálogo) o ninguno, para la demo." >&2
  exit 1
fi

.venv/bin/python -m plataforma.servidor ${ARGS[@]+"${ARGS[@]}"} --puerto "$PUERTO_PLATAFORMA" &
PLATAFORMA=$!
.venv/bin/python -m http.server "$PUERTO_PRESENTACION" --bind 127.0.0.1 >/dev/null 2>&1 &
PRESENTACION=$!
trap 'kill "$PLATAFORMA" "$PRESENTACION" 2>/dev/null || true' EXIT INT TERM

# Espera a que la plataforma responda (entrena los modelos al arrancar) y abre el navegador si se puede.
.venv/bin/python -m plataforma.esperar "$PUERTO_PLATAFORMA" || echo "La plataforma tarda en responder: revisar los mensajes de arriba." >&2
PLAT_URL="http://127.0.0.1:$PUERTO_PLATAFORMA"
PRES_URL="http://localhost:$PUERTO_PRESENTACION/prototipos/presentacion-3d/"
echo
echo "Plataforma:   $PLAT_URL"
echo "Presentación: $PRES_URL  (necesita internet para three.js, GSAP y las fuentes)"
echo "Ctrl+C para cortar."
if [ -n "${NO_ABRIR:-}" ]; then :
elif command -v open >/dev/null 2>&1; then open "$PLAT_URL"; open "$PRES_URL"
elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$PLAT_URL" >/dev/null 2>&1; xdg-open "$PRES_URL" >/dev/null 2>&1
fi
wait
