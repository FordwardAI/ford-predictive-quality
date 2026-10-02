#!/bin/bash
# Capturas del flujo de la plataforma (plataforma/) para la sección 05 de la presentación.
#
#   FORD_CSV=… FORD_CATALOGO=… prototipos/presentacion-3d/herramientas/capturar_flujo.sh [último día]
#
# Levanta su propio servidor (puerto 8766, caché temporal: no toca el estado del 8765), recorre el
# ciclo de planta con la fuente simulada desde el Día 155 hasta el último día (por defecto 166) y
# captura cada vista con Chrome sin interfaz (otra ruta con CHROME=…). Cada día se arma la hoja con
# el modelo por defecto (CatBoost), se envía el cupo completo y se cierra la ronda; el último día
# queda a medio camino (≈ 40 % del cupo, ronda 1 abierta) para que Selección y Seguimiento muestren
# un día en curso.
#
# Deja flujo-1-dia … flujo-7-linea.png en prototipos/presentacion-3d/assets/local/ y el resumen del
# escenario en assets/local/flujo/escenario.txt. Las capturas muestran tasas por código de la base
# ficticia: assets/local/ queda fuera de Git y no se versiona.
set -euo pipefail

AQUI="$(cd "$(dirname "$0")" && pwd)"
PRESENTACION="$(dirname "$AQUI")"
RAIZ="$(cd "$PRESENTACION/../.." && pwd)"
DESTINO="$PRESENTACION/assets/local"
ULTIMO="${1:-166}"
PUERTO="${FLUJO_PUERTO:-8766}"
BASE="http://127.0.0.1:$PUERTO"

if [ -z "${FORD_CSV:-}" ] || [ -z "${FORD_CATALOGO:-}" ] || [ ! -f "${FORD_CSV:-}" ] || [ ! -f "${FORD_CATALOGO:-}" ]; then
  cat >&2 <<EOF
Faltan el CSV o el catálogo (están fuera del repo). Definir:
  FORD_CSV="/ruta/al/Dataset QLS Inspección Adicional.csv"
  FORD_CATALOGO="/ruta/a/Códigos de catálogo.csv"
Ver docs/datos-locales.md.
EOF
  exit 1
fi
[ -x "$RAIZ/.venv/bin/python" ] || { echo "Falta el entorno .venv (ver solucion/README.md)" >&2; exit 1; }

# Chrome: la variable CHROME manda; si no está, la ruta habitual de macOS, Windows o Linux.
if [ -z "${CHROME:-}" ]; then
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
           "/c/Program Files/Google/Chrome/Application/chrome.exe" \
           "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
           "$(command -v google-chrome || true)"; do
    [ -n "$c" ] && [ -x "$c" ] && { CHROME="$c"; break; }
  done
fi
[ -n "${CHROME:-}" ] || { echo "No encuentro Chrome: definir CHROME=/ruta/al/ejecutable" >&2; exit 1; }

# Caché propia: FLUJO_CACHE para reutilizarla entre corridas (el primer arranque entrena los modelos).
CACHE="${FLUJO_CACHE:-$(mktemp -d)}"
BORRAR_CACHE=$([ -z "${FLUJO_CACHE:-}" ] && echo 1 || echo 0)
SERVIDOR=""
terminar() {
  [ -n "$SERVIDOR" ] && kill "$SERVIDOR" 2>/dev/null || true
  [ "$BORRAR_CACHE" = 1 ] && rm -rf "$CACHE" || true
}
trap terminar EXIT

cd "$RAIZ"
.venv/bin/python -m plataforma.servidor --csv "$FORD_CSV" --catalogo "$FORD_CATALOGO" \
  --puerto "$PUERTO" --cache "$CACHE" >"$CACHE/servidor.log" 2>&1 &
SERVIDOR=$!
echo "Servidor en $BASE (registro: $CACHE/servidor.log); esperando a que cargue…"
for _ in $(seq 1 600); do
  curl -sf "$BASE/api/meta" >/dev/null 2>&1 && break
  kill -0 "$SERVIDOR" 2>/dev/null || { cat "$CACHE/servidor.log" >&2; exit 1; }
  sleep 1
done

mkdir -p "$DESTINO/flujo"
# Escenario por la API (misma lógica que la pantalla): solo la fuente simulada de la base ficticia.
.venv/bin/python - "$BASE" "$ULTIMO" "$DESTINO/flujo/escenario.txt" <<'PY'
import json, sys, urllib.request, urllib.error

base, ultimo, salida = sys.argv[1], int(sys.argv[2]), sys.argv[3]

def api(ruta, cuerpo=None):
    datos = None if cuerpo is None else json.dumps(cuerpo).encode()
    req = urllib.request.Request(f"{base}/api/{ruta}", data=datos, method="GET" if cuerpo is None else "POST",
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{ruta}: {e.code} {e.read().decode()}")

def enviar(hasta):
    """Envía unidades de los códigos pendientes, en orden de la hoja, hasta `hasta` enviadas."""
    estado = api("estado")
    while estado["tomadas"] < hasta and estado["pendientes"]:
        estado = api("tomar", {"codigo": estado["pendientes"][0]["codigo"]})["estado"]
    return estado

planta = api("planta/reiniciar", {})["planta"]
while True:
    t = planta["dia"]
    if planta["playa"] == 0:
        if t >= ultimo:
            raise SystemExit(f"Día {t}: playa vacía, elegir otro último día")
        planta = api("planta/avanzar", {})["planta"]
        continue
    hoja = api("dia", {})["hoja"]
    if t < ultimo:
        enviar(hoja["cupo"])
        api("ronda", {})
        planta = api("planta/avanzar", {})["planta"]
        print(f"Día {t}: cupo {hoja['cupo']}, versión v{hoja['version']['numero']}", flush=True)
        continue
    estado = enviar(max(1, round(0.4 * hoja["cupo"])))
    break

envios = api("envios")["cifras"]
modelo = api("modelo")
resumen = (f"Último día: {t} · modelo {hoja['modelo']} v{hoja['version']['numero']} "
           f"(resultados hasta el Día {hoja['version']['entrenado_hasta']})\n"
           f"Cupo del día: {hoja['cupo']} · enviadas hoy: {estado['tomadas']}\n"
           f"Enviadas en total: {envios['enviadas']} · con resultado: {envios['con_resultado']}\n"
           f"Versiones del modelo: {len(modelo['versiones'])}\n")
open(salida, "w", encoding="utf-8").write(resumen)
print(resumen, end="")
PY

# Capturas: una por vista, 1440×900, como las ve el navegador.
capturar() {
  local archivo="$1" vista="$2" p
  "$CHROME" --headless=new --hide-scrollbars --window-size=1440,900 --virtual-time-budget=8000 \
    --user-data-dir="$CACHE/chrome" --screenshot="$DESTINO/$archivo" "$BASE/#$vista" >/dev/null 2>&1 &
  p=$!
  for _ in $(seq 1 60); do kill -0 "$p" 2>/dev/null || break; sleep 1; done
  kill "$p" 2>/dev/null || true
  [ -s "$DESTINO/$archivo" ] || { echo "No se generó $archivo" >&2; return 1; }
  echo "assets/local/$archivo"
}
capturar flujo-1-dia.png hoy
capturar flujo-2-hoja.png hoja
capturar flujo-3-seleccion.png seleccion
capturar flujo-4-seguimiento.png seguimiento
capturar flujo-5-resultados.png resultados
capturar flujo-6-modelo.png modelo
capturar flujo-7-linea.png linea

# Selección con la respuesta a un código (necesita interacción: Node ≥ 22 y el protocolo de DevTools).
if command -v node >/dev/null 2>&1; then
  PUERTO_CDP="${FLUJO_PUERTO_CDP:-9333}"
  "$CHROME" --headless=new --hide-scrollbars --remote-debugging-port="$PUERTO_CDP" \
    --user-data-dir="$CACHE/chrome-cdp" about:blank >/dev/null 2>&1 &
  CDP=$!
  for _ in $(seq 1 30); do curl -sf "http://127.0.0.1:$PUERTO_CDP/json/version" >/dev/null 2>&1 && break; sleep 1; done
  node "$AQUI/capturar_respuesta.mjs" "$PUERTO_CDP" "$BASE/#seleccion" "$DESTINO/flujo-3b-respuesta.png" \
    || echo "No se generó flujo-3b-respuesta.png (la presentación usa flujo-3-seleccion.png)" >&2
  kill "$CDP" 2>/dev/null || true
else
  echo "Sin Node: se omite flujo-3b-respuesta.png (la presentación usa flujo-3-seleccion.png)" >&2
fi

# Control: nada de assets/local/ debe quedar a la vista de Git.
if git -C "$PRESENTACION" status --porcelain -- assets/local | grep -q .; then
  echo "ATENCIÓN: assets/local/ no está ignorado por Git; no subir estas capturas." >&2
  exit 1
fi
