"""Ningún VIN sale del servidor: toda respuesta y toda descarga pasa por `revisar` antes de enviarse."""
import json
import re

TOKEN = re.compile(r"[A-Za-z0-9_\-]+")


class SinVin(Exception):
    """La respuesta contenía un VIN de la tabla."""


def revisar(contenido, vins):
    """Falla si algún token del contenido (dict, lista, str o bytes) es un VIN de la tabla."""
    if isinstance(contenido, bytes):
        texto = contenido.decode("utf-8", errors="ignore")
    elif isinstance(contenido, str):
        texto = contenido
    else:
        texto = json.dumps(contenido, ensure_ascii=False)
    if any(t in vins for t in TOKEN.findall(texto)):
        raise SinVin("La respuesta contenía un VIN: no se envía")
    return contenido
