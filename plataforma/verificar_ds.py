"""Control del design system de Ford sobre el frontend: .venv/bin/python -m plataforma.verificar_ds

Revisa `front/src` (React + Tailwind + shadcn/ui):
- el tema borra las paletas, sombras, tamaños y pesos por defecto de Tailwind (§1, §2, §4);
- ningún archivo usa un color fuera de la paleta: ni hex, ni rgb/hsl/oklch, ni transparencias sobre colores. La única
  excepción es el velo de los paneles, Twilight al 60 %, que propone §9.9;
- no hay tamaños de letra arbitrarios ni sombras en estilos inline.
"""
import re
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent / "front" / "src"
PALETA = {"#00095b", "#00142e", "#066fef", "#ffffff", "#f0f0f0", "#0f0f0f", "#000000"}
TAMANOS = {"16", "20", "24", "40"}
TEMA = ("--color-*: initial", "--shadow-*: initial", "--text-*: initial", "--font-weight-*: initial")
VELO = "ford-twilight/60"


def revisar(src=SRC):
    errores = []
    tema = (src / "index.css").read_text(encoding="utf-8")
    errores += [f"index.css: el tema no borra los valores por defecto ({t})" for t in TEMA if t not in tema]
    for archivo in sorted(src.rglob("*")):
        if archivo.suffix not in (".css", ".ts", ".tsx"):
            continue
        texto = re.sub(r"/\*.*?\*/", "", archivo.read_text(encoding="utf-8"), flags=re.S)
        nombre = archivo.relative_to(src)
        for h in re.findall(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b", texto):
            if h.lower() not in PALETA:
                errores.append(f"{nombre}: color fuera de la paleta {h}")
        if re.search(r"\b(rgba?|hsla?|oklch|oklab)\(", texto):
            errores.append(f"{nombre}: color por función: usar solo la paleta")
        for m in re.findall(r"\b(?:bg|text|border|ring|fill|stroke|outline)-[a-z-]+/\d+", texto):
            if not m.endswith(VELO):
                errores.append(f"{nombre}: transparencia sobre un color ({m})")
        for t in re.findall(r"text-\[(\d+)px\]", texto) + re.findall(r"fontSize:\s*(\d+)", texto):
            if t not in TAMANOS:
                errores.append(f"{nombre}: tamaño de letra {t}px fuera de 16/20/24/40")
        for sombra in re.findall(r"boxShadow:\s*['\"]([^'\"]+)", texto):
            if sombra != "none":
                errores.append(f"{nombre}: sombra inline ({sombra})")
        if re.search(r"text-(center|right)[^\"']*\"[^>]*>\s*<?h[1-3]|<h[1-3][^>]*text-(center|right)", texto):
            errores.append(f"{nombre}: título alineado al centro o a la derecha (§2)")
    return errores


if __name__ == "__main__":
    errores = revisar()
    for e in errores:
        print("FAIL", e)
    print("PASS" if not errores else f"{len(errores)} FALLAS")
    sys.exit(1 if errores else 0)
