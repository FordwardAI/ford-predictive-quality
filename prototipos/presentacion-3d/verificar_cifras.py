"""Verifica que los respaldos de cifras.js coincidan con los agregados del repo.

Uso, desde la raíz del repo:

    python3 prototipos/presentacion-3d/verificar_cifras.py

Lee DEFINICIONES de cifras.js con expresiones regulares simples, resuelve cada
`ruta` en su JSON (misma sintaxis que cifras.js: puntos, índices [n], `a/b`,
`a-b`, `a#largo`, `a#cuenta:campo`) y falla si algún respaldo difiere. Además
comprueba que el formato es-AR de algunas cifras coincida con lo publicado en
docs/entrega/. Solo biblioteca estándar; no lee el CSV ni datos por VIN.
"""

from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
CIFRAS_JS = Path(__file__).resolve().parent / "cifras.js"

# Cifras tal como aparecen en docs/entrega/ (resumen ejecutivo, 2.2, 4, 6).
PUBLICADAS = {
    "base.eventos": "195.808",
    "base.vin": "59.681",
    "base.calibradas": "6.079",
    "base.codigos": "98",
    "base.cohorte260": "4.910",
    "validacion.n": "8.038",
    "validacion.elegidos": "391",
    "validacion.precision": "15,1 %",
    "validacion.precisionRango": "11,6–18,8 %",
    "validacion.azar": "9,9 %",
    "validacion.veces": "1,53 ×",
    "validacion.alternativas": "31",
    "validacion.empates": "29",
    "validacion.mejor": "17,6 %",
    "validacion.fuga": "22,3 %",
    "oraculo": "20,2 %",
    "prueba.n": "13.312",
    "prueba.elegidos": "652",
    "prueba.dias": "68",
    "prueba.precision": "10,9 %",
    "prueba.precisionRango": "8,3–13,6 %",
    "prueba.azar": "8,2 %",
    "prueba.veces": "1,32 ×",
    "prueba.vecesRango": "1,01–1,64 ×",
    "prueba.diferencia": "2,7 puntos",
    "prueba.difMin": "0,07 puntos",
    "prueba.hasta260.n": "13.135",
    "prueba.hasta260.precision": "11,1 %",
    "prueba.hasta260.azar": "8,3 %",
    "dondeMirar.codigo": "61,0 %",
    "dondeMirar.general": "30,5 %",
    "dondeMirar.prueba.codigo": "63,4 %",
    "dondeMirar.prueba.general": "35,2 %",
    "minimo.precision": "15,3 %",
    "minimo.epsilon20": "13,8 %",
    "minimo.prueba": "10,6 %",
    "detector.subeX2": "90,8 %",
    "detector.bajaMitad": "66,9 %",
    "detector.alarmas": "7",
    "detector.prueba.alarmas": "16",
}

BLOQUE = re.compile(r"\{\s*clave:\s*'([^']+)'(.*?)\},\s*$", re.S | re.M)
CAMPO_TEXTO = r"{}:\s*(?:'([^']*)'|null)"
RESPALDO = re.compile(r"respaldo:\s*(\[[^\]]*\]|-?[0-9.eE+-]+|null)")
FORMATO = re.compile(r"formato:\s*'([^']+)'")


def campo(texto: str, nombre: str) -> str | None:
    m = re.search(CAMPO_TEXTO.format(nombre), texto)
    if not m:
        raise ValueError(f"falta el campo {nombre}")
    return m.group(1)


def leer_definiciones() -> list[dict]:
    fuente = CIFRAS_JS.read_text(encoding="utf-8")
    inicio = fuente.index("export const DEFINICIONES")
    fin = fuente.index("];", inicio)
    definiciones = []
    for m in BLOQUE.finditer(fuente[inicio:fin]):
        cuerpo = m.group(2)
        respaldo = RESPALDO.search(cuerpo)
        if not respaldo:
            raise ValueError(f"{m.group(1)}: falta respaldo")
        definiciones.append(
            {
                "clave": m.group(1),
                "archivo": campo(cuerpo, "archivo"),
                "ruta": campo(cuerpo, "ruta"),
                "formato": FORMATO.search(cuerpo).group(1),
                "respaldo": json.loads(respaldo.group(1)),
            }
        )
    return definiciones


def leer_ruta(objeto, ruta: str):
    valor = objeto
    for parte in ruta.split("."):
        m = re.fullmatch(r"([^\[\]]+)((?:\[\d+\])*)", parte)
        if not m:
            raise ValueError(f"ruta inválida: {ruta}")
        valor = valor[m.group(1)]
        for indice in re.findall(r"\[(\d+)\]", m.group(2)):
            valor = valor[int(indice)]
    return valor


def resolver(objeto, ruta: str):
    base, _, op = ruta.partition("#")
    if op == "largo":
        return len(leer_ruta(objeto, base))
    if op.startswith("cuenta:"):
        nombre = op[len("cuenta:"):]
        return sum(1 for x in leer_ruta(objeto, base) if x[nombre] is True)
    if "/" in base:
        a, b = base.split("/")
        return leer_ruta(objeto, a) / leer_ruta(objeto, b)
    if "-" in base:
        a, b = base.split("-")
        return leer_ruta(objeto, a) - leer_ruta(objeto, b)
    return leer_ruta(objeto, base)


def numero_es_ar(x: float, decimales: int) -> str:
    texto = f"{abs(x):.{decimales}f}"
    entero, _, fraccion = texto.partition(".")
    entero = re.sub(r"\B(?=(\d{3})+(?!\d))", ".", entero)
    return ("−" if x < 0 else "") + entero + ("," + fraccion if fraccion else "")


def formatear(formato: str, v) -> str:
    # Igual que FORMATOS en cifras.js, con espacio común en lugar de NBSP.
    return {
        "entero": lambda: numero_es_ar(v, 0),
        "pct1": lambda: numero_es_ar(v * 100, 1) + " %",
        "rangoPct1": lambda: f"{numero_es_ar(v[0] * 100, 1)}–{numero_es_ar(v[1] * 100, 1)} %",
        "veces": lambda: numero_es_ar(v, 2) + " ×",
        "rangoVeces": lambda: f"{numero_es_ar(v[0], 2)}–{numero_es_ar(v[1], 2)} ×",
        "puntos1": lambda: numero_es_ar(v * 100, 1) + " puntos",
        "puntos2": lambda: numero_es_ar(v * 100, 2) + " puntos",
        "segundos1": lambda: numero_es_ar(v, 1) + " s",
        "usd1": lambda: "USD " + numero_es_ar(v, 1),
    }[formato]()


def iguales(a, b) -> bool:
    if isinstance(a, list) or isinstance(b, list):
        return isinstance(a, list) and isinstance(b, list) and len(a) == len(b) and all(
            iguales(x, y) for x, y in zip(a, b)
        )
    return isinstance(a, (int, float)) and isinstance(b, (int, float)) and math.isclose(
        a, b, rel_tol=1e-12, abs_tol=1e-15
    )


def main() -> int:
    definiciones = leer_definiciones()
    errores = []
    claves = [d["clave"] for d in definiciones]
    if len(claves) != len(set(claves)):
        errores.append("hay claves repetidas")
    jsons: dict[str, object] = {}
    comparadas = 0
    for d in definiciones:
        if d["archivo"] is None:
            continue
        ruta_json = RAIZ / d["archivo"]
        if d["archivo"] not in jsons:
            jsons[d["archivo"]] = json.loads(ruta_json.read_text(encoding="utf-8"))
        try:
            real = resolver(jsons[d["archivo"]], d["ruta"])
        except (KeyError, IndexError, TypeError, ValueError) as error:
            errores.append(f"{d['clave']}: no se pudo leer {d['archivo']} → {d['ruta']} ({error!r})")
            continue
        comparadas += 1
        if not iguales(real, d["respaldo"]):
            errores.append(f"{d['clave']}: respaldo {d['respaldo']!r} ≠ JSON {real!r}")

    por_clave = {d["clave"]: d for d in definiciones}
    for clave, esperado in PUBLICADAS.items():
        if clave not in por_clave:
            errores.append(f"{clave}: falta en cifras.js")
            continue
        d = por_clave[clave]
        obtenido = formatear(d["formato"], d["respaldo"])
        if obtenido != esperado:
            errores.append(f"{clave}: formato {obtenido!r} ≠ publicado {esperado!r}")

    if errores:
        print("FALLA:")
        for e in errores:
            print(" -", e)
        return 1
    print(
        f"OK: {len(definiciones)} cifras, {comparadas} contra su JSON, "
        f"{len(PUBLICADAS)} con el formato publicado en docs/entrega/."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
