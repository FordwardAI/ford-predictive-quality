"""Control del design system de Ford sobre la web de la plataforma: .venv/bin/python -m plataforma.verificar_ds

Falla si los CSS, el HTML o el JS de `web/` usan un color fuera de la paleta (§1), sombras (§4), más de 4 tamaños de
letra o un peso distinto de 400/500 (§2), o alinean títulos al centro o a la derecha (§2).
"""
import re
import sys
from pathlib import Path

WEB = Path(__file__).resolve().parent / "web"
PALETA = {"#00095b", "#00142e", "#066fef", "#ffffff", "#f0f0f0", "#0f0f0f", "#000000"}
TAMANOS_MAX = 4


def _sin_comentarios(texto):
    return re.sub(r"/\*.*?\*/", "", texto, flags=re.S)


def revisar(carpeta=WEB):
    errores, tamanos = [], set()
    for archivo in sorted(carpeta.glob("*")):
        if archivo.suffix not in (".css", ".html", ".js"):
            continue
        texto = _sin_comentarios(archivo.read_text(encoding="utf-8"))
        nombre = archivo.name
        for h in re.findall(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b", texto):
            if h.lower() not in PALETA:
                errores.append(f"{nombre}: color fuera de la paleta {h}")
        if re.search(r"rgba?\(|hsla?\(", texto):
            errores.append(f"{nombre}: color por función (rgb/hsl): usar solo los tokens de la paleta")
        if "box-shadow" in texto or "text-shadow" in texto or "drop-shadow" in texto:
            errores.append(f"{nombre}: sombra (el sistema es plano, §4)")
        for peso in re.findall(r"font-weight\s*:\s*([0-9]+)", texto):
            if peso not in ("400", "500"):
                errores.append(f"{nombre}: peso {peso} (solo 400 y 500)")
        if re.search(r"font-weight\s*:\s*(bold|bolder|600|700|800|900)", texto):
            errores.append(f"{nombre}: negrita: el énfasis se da con el tamaño (§2)")
        tamanos |= set(re.findall(r"font-size\s*:\s*(\d+)px", texto))
        tamanos |= set(re.findall(r"font-size=\"(\d+)\"", texto))
        if re.search(r"h[1-3][^{]*\{[^}]*text-align\s*:\s*(center|right)", texto):
            errores.append(f"{nombre}: título alineado al centro o a la derecha (§2)")
    tokens = (carpeta / "ford-tokens.css").read_text(encoding="utf-8")
    usados = set()
    for archivo in carpeta.glob("*"):
        if archivo.suffix in (".css", ".html", ".js"):
            usados |= set(re.findall(r"font-size\s*:\s*var\(--(fs-[a-z0-9-]+)\)", archivo.read_text(encoding="utf-8")))
    for token in usados:
        m = re.search(rf"--{token}\s*:\s*(\d+)px", tokens)
        if m:
            tamanos.add(m.group(1))
    if len(tamanos) > TAMANOS_MAX:
        errores.append(f"Más de {TAMANOS_MAX} tamaños de letra: {sorted(tamanos, key=int)}")
    return errores, sorted(tamanos, key=int)


if __name__ == "__main__":
    errores, tamanos = revisar()
    for e in errores:
        print("FAIL", e)
    print(f"Tamaños de letra: {', '.join(tamanos)} px")
    print("PASS" if not errores else f"{len(errores)} FALLAS")
    sys.exit(1 if errores else 0)
