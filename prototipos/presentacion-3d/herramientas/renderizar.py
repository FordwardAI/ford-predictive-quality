"""Renders de la escena 3D con Chrome headless, sin dependencias fuera de la biblioteca estándar.

Levanta un servidor HTTP local sobre la raíz del repositorio, abre Chrome headless con el
protocolo de DevTools, navega a ``escena/demo.html?captura=1`` para cada escena y espera a que la
página deje el render codificado (WebP 1600×900 por defecto) en ``#salida``. El tiempo virtual
de Chrome (``--virtual-time-budget``) no sirve acá: no espera al decodificador Draco, que corre
en un worker, así que se sondea en tiempo real.

Uso desde la raíz del repositorio (los envoltorios renderizar.ps1 / renderizar.sh lo llaman):
    python prototipos/presentacion-3d/herramientas/renderizar.py --chrome "<ruta a chrome>" [escena ...]

Requiere internet: three.js, GSAP y el decodificador Draco se cargan por CDN.
"""
from __future__ import annotations

import argparse
import base64
import functools
import http.server
import json
import os
import re
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import threading
import time
import urllib.request

DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # prototipos/presentacion-3d
RAIZ = os.path.dirname(os.path.dirname(DIR))
ESCENAS = ['portada', 'linea', 'datos', 'predictor', 'validacion', 'resultado', 'seguridad',
           'factibilidad', 'donde-mirar', 'futuro', 'cierre']


class WebSocket:
    """Cliente WebSocket mínimo (RFC 6455) para hablar con DevTools por localhost."""

    def __init__(self, url: str):
        m = re.match(r'ws://([^:/]+):(\d+)(/.*)', url)
        host, puerto, ruta = m.group(1), int(m.group(2)), m.group(3)
        self.sock = socket.create_connection((host, puerto), timeout=120)
        clave = base64.b64encode(os.urandom(16)).decode()
        self.sock.sendall((f'GET {ruta} HTTP/1.1\r\nHost: {host}:{puerto}\r\nUpgrade: websocket\r\n'
                           f'Connection: Upgrade\r\nSec-WebSocket-Key: {clave}\r\nSec-WebSocket-Version: 13\r\n\r\n').encode())
        respuesta = b''
        while b'\r\n\r\n' not in respuesta:
            respuesta += self.sock.recv(4096)
        if b' 101 ' not in respuesta.split(b'\r\n', 1)[0]:
            raise RuntimeError('DevTools rechazó el WebSocket')
        self.resto = respuesta.split(b'\r\n\r\n', 1)[1]
        self.siguiente_id = 0
        self.errores: list[str] = []  # errores de consola y excepciones de la página

    def _leer(self, n: int) -> bytes:
        while len(self.resto) < n:
            datos = self.sock.recv(1 << 16)
            if not datos:
                raise RuntimeError('WebSocket cerrado')
            self.resto += datos
        out, self.resto = self.resto[:n], self.resto[n:]
        return out

    def enviar(self, texto: str) -> None:
        carga = texto.encode()
        n = len(carga)
        cabecera = bytes([0x81])
        if n < 126:
            cabecera += bytes([0x80 | n])
        elif n < 1 << 16:
            cabecera += bytes([0x80 | 126]) + struct.pack('>H', n)
        else:
            cabecera += bytes([0x80 | 127]) + struct.pack('>Q', n)
        mascara = os.urandom(4)
        self.sock.sendall(cabecera + mascara + bytes(b ^ mascara[i % 4] for i, b in enumerate(carga)))

    def recibir(self) -> str:
        partes = b''
        while True:
            b0, b1 = self._leer(2)
            n = b1 & 0x7F
            if n == 126:
                n = struct.unpack('>H', self._leer(2))[0]
            elif n == 127:
                n = struct.unpack('>Q', self._leer(8))[0]
            carga = self._leer(n)
            if b0 & 0x0F == 0x8:
                raise RuntimeError('WebSocket cerrado por Chrome')
            if b0 & 0x0F in (0x9, 0xA):  # ping/pong: se ignoran
                continue
            partes += carga
            if b0 & 0x80:
                return partes.decode('utf-8', errors='replace')

    def llamar(self, metodo: str, **params):
        self.siguiente_id += 1
        mid = self.siguiente_id
        self.enviar(json.dumps({'id': mid, 'method': metodo, 'params': params}))
        while True:
            msg = json.loads(self.recibir())
            metodo_evento = msg.get('method')
            if metodo_evento == 'Runtime.exceptionThrown':
                d = msg['params']['exceptionDetails']
                self.errores.append(d.get('exception', {}).get('description') or d.get('text', ''))
            elif metodo_evento == 'Runtime.consoleAPICalled' and msg['params'].get('type') in ('error', 'warning'):
                self.errores.append(' '.join(str(a.get('value', a.get('description', ''))) for a in msg['params'].get('args', [])))
            if msg.get('id') == mid:
                if 'error' in msg:
                    raise RuntimeError(f'{metodo}: {msg["error"]}')
                return msg.get('result', {})


class ManejadorSilencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):  # sin una línea por pedido
        pass


class ServidorSilencioso(http.server.ThreadingHTTPServer):
    def handle_error(self, request, client_address):  # Chrome corta pedidos al navegar: no es un error
        pass


def servidor(puerto: int, raiz: str = RAIZ):
    manejador = functools.partial(ManejadorSilencioso, directory=raiz)
    srv = ServidorSilencioso(('127.0.0.1', puerto), manejador)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def puerto_libre() -> int:
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def main() -> int:
    for flujo in (sys.stdout, sys.stderr):  # consolas de Windows en cp1252
        if hasattr(flujo, 'reconfigure'):
            flujo.reconfigure(errors='replace')
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('escenas', nargs='*', default=ESCENAS)
    ap.add_argument('--chrome', default=os.environ.get('CHROME'), help='binario de Chrome/Chromium (o variable CHROME)')
    ap.add_argument('--salida', default=os.path.join(DIR, 'assets', 'renders'))
    ap.add_argument('--calidad', default='alta')
    ap.add_argument('--p', default='0.5', help='progreso de cada escena (0..1)')
    ap.add_argument('--formato', default='webp', choices=['webp', 'png'])
    ap.add_argument('--ancho', type=int, default=1600)
    ap.add_argument('--alto', type=int, default=900)
    ap.add_argument('--espera', type=int, default=2500, help='ms entre la escena lista y la captura')
    ap.add_argument('--extra', default='', help='parámetros extra para demo.html (ej. "env=estudio")')
    ap.add_argument('--sufijo', default='', help='sufijo del archivo (ej. "-baja")')
    ap.add_argument('--pantalla', action='store_true',
                    help='captura de pantalla vía DevTools (con UI) en vez del render de ?captura=1; '
                         'sirve para comparar con versiones de demo.html sin modo captura')
    ap.add_argument('--raiz', default=RAIZ, help='carpeta a servir (por defecto, la raíz del repo)')
    ap.add_argument('--gl', default='d3d11' if os.name == 'nt' else 'default',
                    help='backend ANGLE (d3d11, swiftshader, default)')
    args = ap.parse_args()
    if not args.chrome:
        print('Falta --chrome o la variable CHROME.', file=sys.stderr)
        return 1
    os.makedirs(args.salida, exist_ok=True)

    puerto_http = puerto_libre()
    srv = servidor(puerto_http, args.raiz)
    puerto_dt = puerto_libre()
    perfil = tempfile.mkdtemp(prefix='render-chrome-')
    banderas = ['--headless=new', f'--remote-debugging-port={puerto_dt}', f'--user-data-dir={perfil}',
                '--window-size=1920,1080', '--hide-scrollbars', '--no-first-run', '--mute-audio']
    if args.gl == 'swiftshader':
        banderas += ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    elif args.gl != 'default':
        banderas += [f'--use-angle={args.gl}']
    chrome = subprocess.Popen([args.chrome, *banderas, 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    fallas = 0
    try:
        destino = None
        for _ in range(100):
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{puerto_dt}/json/list', timeout=2) as r:
                    paginas = [p for p in json.load(r) if p.get('type') == 'page']
                if paginas:
                    destino = paginas[0]['webSocketDebuggerUrl']
                    break
            except OSError:
                pass
            time.sleep(0.2)
        if not destino:
            print('Chrome no abrió el puerto de DevTools.', file=sys.stderr)
            return 1
        ws = WebSocket(destino)
        ws.llamar('Page.enable')
        ws.llamar('Runtime.enable')
        for escena in args.escenas:
            consulta = (f'escena={escena}&p={args.p}&calidad={args.calidad}&captura=1&espera={args.espera}'
                        f'&formato={args.formato}&ancho={args.ancho}&alto={args.alto}')
            if args.extra:
                consulta += '&' + args.extra
            url = f'http://127.0.0.1:{puerto_http}/prototipos/presentacion-3d/escena/demo.html?{consulta}'
            ws.llamar('Page.navigate', url=url)
            if args.pantalla:
                time.sleep(8 + args.espera / 1000)
                r = ws.llamar('Page.captureScreenshot', format='png')
                ruta = os.path.join(args.salida, f'{escena}{args.sufijo}.png')
                with open(ruta, 'wb') as f:
                    f.write(base64.b64decode(r['data']))
                print(ruta)
                continue
            texto, limite = '', time.time() + 90
            while time.time() < limite:
                time.sleep(0.5)
                r = ws.llamar('Runtime.evaluate', returnByValue=True,
                              expression="(document.getElementById('salida')||{}).textContent||''")
                texto = r.get('result', {}).get('value', '')
                if texto.startswith('RENDER:'):
                    break
            for e in ws.errores:
                if 'Program Info Log' in e and 'error' not in e.lower():
                    continue  # avisos del compilador HLSL de ANGLE sobre shaders de three
                print(f'  [{escena}] consola: {e[:300]}', file=sys.stderr)
            ws.errores.clear()
            m = re.match(r'RENDER:data:image/(webp|png);base64,([A-Za-z0-9+/=]+):FIN', texto)
            if not m:
                print(f'Sin render para «{escena}» (¿sin internet o sin WebGL?).', file=sys.stderr)
                fallas += 1
                continue
            datos = base64.b64decode(m.group(2))
            ruta = os.path.join(args.salida, f'{escena}{args.sufijo}.{m.group(1)}')
            with open(ruta, 'wb') as f:
                f.write(datos)
            print(f'{os.path.relpath(ruta, RAIZ)}: {len(datos) // 1024} KB')
    finally:
        chrome.terminate()
        try:
            chrome.wait(10)
        except subprocess.TimeoutExpired:
            chrome.kill()
        srv.shutdown()
        shutil.rmtree(perfil, ignore_errors=True)
    return 1 if fallas else 0


if __name__ == '__main__':
    sys.exit(main())
