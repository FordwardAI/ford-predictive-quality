"""Espera a que la plataforma responda; la usan iniciar.sh e iniciar.bat antes de abrir el navegador.

    python -m plataforma.esperar [puerto] [segundos]
"""
import sys
import time
import urllib.request


def esperar(puerto=8765, segundos=180):
    """True cuando http://127.0.0.1:<puerto>/ responde; False si se acaba el tiempo (arrancar entrena los modelos)."""
    for _ in range(segundos):
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{puerto}/", timeout=2)
            return True
        except OSError:
            time.sleep(1)
    return False


if __name__ == "__main__":
    sys.exit(0 if esperar(*map(int, sys.argv[1:3])) else 1)
