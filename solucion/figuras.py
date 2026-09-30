"""Figuras, tablas y diagramas (P9) para el informe y la presentación.

Lee solo los agregados de solucion/resultados/*.json (nunca el CSV, ningún VIN ni tasas por
código) y escribe PNG a 200 dpi (para el .docx y el .pptx) y SVG en docs/entrega/figuras/,
más un índice README.md con la leyenda de cada figura. Las figuras de piezas que todavía no
tienen resultado (p4, p5, p6) se omiten con su motivo. La salida es determinista: fuente
empaquetada con matplotlib, sal fija del SVG y sin fechas en los metadatos.

    .venv/bin/python -m solucion.run --csv ... --catalogo ... --piezas p9
"""
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch  # noqa: E402
from matplotlib.ticker import FuncFormatter, MaxNLocator  # noqa: E402

from .datos import RAIZ  # noqa: E402

RESULTADOS = RAIZ / "solucion" / "resultados"
FIGURAS = RAIZ / "docs" / "entrega" / "figuras"
DPI = 200

# Paleta de referencia (skill dataviz): un solo acento, el resto en tintas neutras.
ACENTO = "#2a78d6"
ACENTO_CLARO = "#cde2fb"
TINTA = "#0b0b0b"
TINTA_2 = "#52514e"
APAGADO = "#898781"
GRILLA = "#e1e0d9"
EJE = "#c3c2b7"
SUPERFICIE = "#fcfcfb"
CAJA = "#f0efec"

ESTILO = {
    "font.family": "DejaVu Sans",  # Viene con matplotlib: mismo resultado en cualquier equipo.
    "font.size": 10,
    "axes.edgecolor": EJE,
    "axes.labelcolor": TINTA_2,
    "axes.facecolor": SUPERFICIE,
    "figure.facecolor": SUPERFICIE,
    "xtick.color": APAGADO,
    "ytick.color": APAGADO,
    "xtick.labelcolor": TINTA_2,
    "ytick.labelcolor": TINTA_2,
    "svg.hashsalt": "ford-predictive-quality-p9",
    "svg.fonttype": "path",
    "path.simplify": False,
}

FAMILIAS = {
    "tasa_fija": "Tasa fija",
    "movil": "Tasa móvil",
    "movil_mercado": "Suavizado hacia el mercado",
    "decaimiento": "Decaimiento exponencial",
}
REFERENCIAS = ("oraculo", "fuga")


# --- formato ---------------------------------------------------------------------------------

def pct(x, decimales=1):
    """0,15089 -> '15,1 %' (coma decimal)."""
    return f"{x * 100:.{decimales}f}".replace(".", ",") + " %"


def veces(x):
    return f"{x:.2f}".replace(".", ",") + "×"


def _nombre(texto):
    return (texto or "").replace("<=", "≤")


def _capital(texto):
    """Mayúscula inicial solo en letras latinas: «ε = 0» queda igual."""
    texto = _nombre(texto)
    return texto[:1].upper() + texto[1:] if texto[:1].isascii() or texto[:1] in "áéíóúñ" else texto


def _eje_porcentaje(ax):
    ax.xaxis.set_major_locator(MaxNLocator(nbins=7, steps=[1, 2, 5, 10]))
    ax.xaxis.set_major_formatter(FuncFormatter(lambda x, _: pct(x, 0 if abs(x * 100 - round(x * 100)) < 1e-9
                                                                 else 1)))


def _leer(directorio, pieza):
    archivo = Path(directorio) / f"{pieza}.json"
    return json.loads(archivo.read_text()) if archivo.exists() else None


def _guardar(fig, destino, nombre):
    destino.mkdir(parents=True, exist_ok=True)
    png, svg = destino / f"{nombre}.png", destino / f"{nombre}.svg"
    fig.savefig(png, dpi=DPI, metadata={"Software": None})
    fig.savefig(svg, metadata={"Date": None, "Creator": None})
    # matplotlib deja espacios al final de las líneas del SVG; se quitan para que `git diff --check` pase.
    svg.write_text("\n".join(linea.rstrip() for linea in svg.read_text().splitlines()) + "\n")
    plt.close(fig)
    return [png, svg]


def _ejes_limpios(ax):
    for lado in ("top", "right", "left"):
        ax.spines[lado].set_visible(False)
    ax.tick_params(axis="y", length=0)
    ax.grid(axis="x", color=GRILLA, linewidth=0.8)
    ax.set_axisbelow(True)


def _encabezado(fig, titulo, subtitulo):
    fig.text(0.02, 0.975, titulo, ha="left", va="top", fontsize=13, fontweight="bold", color=TINTA)
    fig.text(0.02, 0.975 - 0.045 * 8 / fig.get_figheight(), subtitulo, ha="left", va="top", fontsize=9,
             color=TINTA_2)


def _pie(fig, texto):
    fig.text(0.02, 0.012, texto, ha="left", va="bottom", fontsize=8, color=APAGADO)


# --- 1. comparación de alternativas ----------------------------------------------------------

def _filas_comparacion(p3, p4):
    alternativas = [dict(r, pieza="p3") for r in p3["resultados"]]
    alternativas += [dict(r, pieza="p4") for r in (p4 or {}).get("resultados", [])]
    alternativas = [r for r in alternativas if r.get("precision_cupo") is not None and r.get("precision_rango95")]
    elegibles = sorted((r for r in alternativas if r.get("elegible")),
                       key=lambda r: tuple(r.get("orden_simplicidad", (99,))))
    referencias = [r for r in alternativas if r.get("familia") in REFERENCIAS]
    filas, anterior = [], None
    for r in elegibles:
        grupo = (r["pieza"], r["familia"])
        if grupo != anterior:
            nombre = FAMILIAS.get(r["familia"], _capital(r["familia"].replace("_", " ")))
            filas.append(("grupo", nombre if r["pieza"] == "p3" else f"Aprendizaje automático: {nombre}"))
            anterior = grupo
        filas.append(("alternativa", r))
    if referencias:
        filas.append(("grupo", "Referencias no elegibles"))
        filas += [("referencia", r) for r in referencias]
    return filas


def _etiqueta(r):
    if r["familia"] == "oraculo":
        return "Oráculo: tasa real del tramo (techo)"
    if r["familia"] == "fuga":
        return _capital(r["alternativa"].removeprefix("con fuga: ")) + " (con fuga, didáctica)"
    return _capital(r["alternativa"])


def figura_comparacion(resultados, destino):
    p3, p4, eleccion = (_leer(resultados, p) for p in ("p3", "p4", "eleccion"))
    if not p3:
        return None, "falta p3.json"
    filas = _filas_comparacion(p3, p4)
    azar = next((r for r in p3["resultados"] if r.get("familia") == "azar"), None)
    comparacion = {c["alternativa"]: c for c in (eleccion or {}).get("comparacion", [])}
    ganadora = (eleccion or {}).get("ganadora", {}).get("alternativa")
    mejor = (eleccion or {}).get("mejor_precision")
    calificador = next(r["calificador"] for _, r in filas if not isinstance(r, str))

    alto = 1.9 + 0.3 * len(filas)
    fig, ax = plt.subplots(figsize=(10, alto))
    fig.subplots_adjust(left=0.37, right=0.80, top=1 - 1.05 / alto, bottom=0.95 / alto)
    _ejes_limpios(ax)
    ys = list(range(len(filas)))[::-1]
    for y, (tipo, r) in zip(ys, filas):
        if tipo == "grupo":
            ax.text(-0.012, y - 0.05, r, transform=ax.get_yaxis_transform(), ha="right", va="center",
                    fontsize=9.5, fontweight="bold", color=TINTA)
            continue
        es_ganadora = r["alternativa"] == ganadora
        lo, hi = r["precision_rango95"]
        if tipo == "referencia":
            color, relleno, marcador, rango_color = TINTA_2, SUPERFICIE, "D", EJE
        elif es_ganadora:
            color, relleno, marcador, rango_color = ACENTO, ACENTO, "o", ACENTO
        else:
            color, relleno, marcador, rango_color = APAGADO, APAGADO, "o", EJE
        ax.plot([lo, hi], [y, y], color=rango_color, linewidth=2, solid_capstyle="round", zorder=2)
        ax.plot([r["precision_cupo"]], [y], marker=marcador, markersize=7, markerfacecolor=relleno,
                markeredgecolor=color if tipo == "referencia" else SUPERFICIE,
                markeredgewidth=1.5, linestyle="none", zorder=3)
        ax.text(-0.012, y, _etiqueta(r), transform=ax.get_yaxis_transform(), ha="right", va="center",
                fontsize=9, color=TINTA if es_ganadora else TINTA_2,
                fontweight="bold" if es_ganadora else "normal")
        nota = []
        if es_ganadora:
            nota.append(f"{pct(r['precision_cupo'])} · ganadora")
        if r["alternativa"] == mejor:
            nota.append(f"{pct(r['precision_cupo'])} · mejor precisión")
        if tipo == "referencia":
            nota.append(pct(r["precision_cupo"]))
        elif r["alternativa"] in comparacion and not nota:
            nota.append("empata con la mejor" if comparacion[r["alternativa"]]["empata"] else "por debajo de la mejor")
        ax.text(1.015, y, " / ".join(nota), transform=ax.get_yaxis_transform(), ha="left", va="center",
                fontsize=8.5, color=TINTA if (es_ganadora or r["alternativa"] == mejor) else APAGADO)
    if azar:
        ax.axvline(azar["azar_mismo_cupo"], color=TINTA_2, linewidth=1, zorder=1)
        ax.text(azar["azar_mismo_cupo"], len(filas) - 0.35, f"  azar al mismo cupo: {pct(azar['azar_mismo_cupo'])}",
                ha="left", va="bottom", fontsize=8.5, color=TINTA_2)
    ax.set_ylim(-0.7, len(filas) - 0.3 + 0.5)
    ax.set_yticks([])
    ax.set_xlim(0, max(0.3, max(r["precision_rango95"][1] for t, r in filas if t != "grupo") + 0.02))
    _eje_porcentaje(ax)
    ax.set_xlabel("Precisión en el cupo: CALIBRADA entre los elegidos (rango del 95 %)", fontsize=9)
    _encabezado(fig, "Comparación de alternativas en validación",
                f"Precisión en el cupo diario del 5 %, {calificador}.\n"
                "Rango del 95 % por bootstrap de días. Los rombos huecos son referencias que no pueden elegirse.")
    _pie(fig, "Regla de elección (#10): mayor precisión en el cupo; si el rango pareado de la diferencia con la "
              "mejor incluye 0, empatan y gana la más simple.")
    fuentes = ["p3.json"] + (["p4.json"] if p4 else []) + (["eleccion.json"] if eleccion else [])
    leyenda = (f"Precisión en el cupo por alternativa, con rango del 95 % (bootstrap por días), {calificador}. "
               f"La ganadora ({_nombre(ganadora)}) es la más simple entre las que empatan con la mejor "
               f"({_nombre(mejor)}). "
               "El oráculo (techo) y la versión con fuga (didáctica) no son elegibles. La línea vertical es "
               "el azar al mismo cupo.")
    if not p4:
        leyenda += " Todavía sin los modelos de aprendizaje automático (p4.json)."
    return {"nombre": "comparacion_alternativas", "archivos": _guardar(fig, destino, "comparacion_alternativas"),
            "fuentes": fuentes, "leyenda": leyenda}, None


# --- 2. veces el azar ------------------------------------------------------------------------

def figura_veces_azar(resultados, destino):
    p3, eleccion = _leer(resultados, "p3"), _leer(resultados, "eleccion")
    if not (p3 and eleccion):
        return None, "falta p3.json o eleccion.json"
    g = eleccion["ganadora"]
    por_familia = {r["familia"]: r for r in p3["resultados"]}
    filas = [("Azar: una selección simulada", por_familia.get("azar"), "azar"),
             (f"Ganadora: {_capital(g['alternativa'])}", g, "ganadora"),
             ("Oráculo: tasa real del tramo (techo)", por_familia.get("oraculo"), "techo")]
    filas = [f for f in filas if f[1] and f[1].get("veces_azar") is not None and f[1].get("veces_azar_rango95")]
    fig, ax = plt.subplots(figsize=(10, 3.6))
    fig.subplots_adjust(left=0.33, right=0.77, top=0.70, bottom=0.25)
    _ejes_limpios(ax)
    for y, (texto, r, tipo) in zip(range(len(filas))[::-1], filas):
        lo, hi = r["veces_azar_rango95"]
        color = ACENTO if tipo == "ganadora" else APAGADO if tipo == "azar" else TINTA_2
        ax.plot([lo, hi], [y, y], color=ACENTO if tipo == "ganadora" else EJE, linewidth=2,
                solid_capstyle="round", zorder=2)
        ax.plot([r["veces_azar"]], [y], marker="D" if tipo == "techo" else "o", markersize=8,
                markerfacecolor=SUPERFICIE if tipo == "techo" else color,
                markeredgecolor=color if tipo == "techo" else SUPERFICIE, markeredgewidth=1.5, zorder=3)
        ax.text(-0.012, y, texto, transform=ax.get_yaxis_transform(), ha="right", va="center", fontsize=9.5,
                color=TINTA if tipo == "ganadora" else TINTA_2, fontweight="bold" if tipo == "ganadora" else "normal")
        ax.text(1.015, y, f"{veces(r['veces_azar'])} ({veces(lo)} a {veces(hi)})",
                transform=ax.get_yaxis_transform(), ha="left", va="center", fontsize=9,
                color=TINTA if tipo == "ganadora" else TINTA_2)
    ax.axvline(1, color=TINTA_2, linewidth=1, zorder=1)
    ax.text(1, len(filas) - 0.45, " azar esperado = 1×", ha="left", va="bottom", fontsize=8.5, color=TINTA_2)
    ax.set_yticks([])
    ax.set_ylim(-0.6, len(filas) - 0.1)
    ax.set_xlim(0, max(2.5, max(f[1]["veces_azar_rango95"][1] for f in filas) + 0.1))
    ax.xaxis.set_major_formatter(FuncFormatter(lambda x, _: f"{x:.1f}".replace(".", ",") + "×"))
    ax.set_xlabel("Veces el azar al mismo cupo (rango del 95 %)", fontsize=9)
    azar = g["precision_cupo"] / g["veces_azar"]
    _encabezado(fig, f"De cada 100 elegidos se calibrarían {pct(g['precision_cupo']).removesuffix(' %')}, "
                     f"contra {pct(azar).removesuffix(' %')} al azar",
                f"Veces el azar, {g['calificador']}.\nRango del 95 % por bootstrap de días; lectura: {g['lectura']}.")
    _pie(fig, "El oráculo usa la tasa real del tramo: no es elegible, marca el techo alcanzable con el código.")
    leyenda = (f"Veces el azar de la ganadora ({_nombre(g['alternativa'])}): {veces(g['veces_azar'])}, "
               f"rango del 95 % {veces(g['veces_azar_rango95'][0])} a {veces(g['veces_azar_rango95'][1])}, "
               f"{g['calificador']}. Se compara con una selección al azar simulada y con el oráculo (techo).")
    return {"nombre": "veces_azar", "archivos": _guardar(fig, destino, "veces_azar"),
            "fuentes": ["p3.json", "eleccion.json"], "leyenda": leyenda}, None


# --- 3. piezas posteriores (p5, p6): se leen con tolerancia --------------------------------

def _puntos(fig_nombre, titulo, filas, calificador, destino, xlabel, formato, referencia=None):
    """Gráfico de punto e intervalo genérico. filas: (etiqueta, valor, rango o None, destacada)."""
    alto = 2.3 + 0.38 * len(filas)
    fig, ax = plt.subplots(figsize=(10, alto))
    fig.subplots_adjust(left=0.33, right=0.80, top=1 - 1.1 / alto, bottom=0.8 / alto)
    _ejes_limpios(ax)
    for y, (texto, valor, rango, destacada) in zip(range(len(filas))[::-1], filas):
        if rango:
            ax.plot(rango, [y, y], color=ACENTO if destacada else EJE, linewidth=2, solid_capstyle="round", zorder=2)
        ax.plot([valor], [y], marker="o", markersize=8, markerfacecolor=ACENTO if destacada else APAGADO,
                markeredgecolor=SUPERFICIE, markeredgewidth=1.5, zorder=3)
        ax.text(-0.012, y, texto, transform=ax.get_yaxis_transform(), ha="right", va="center", fontsize=9.5,
                color=TINTA if destacada else TINTA_2, fontweight="bold" if destacada else "normal")
        ax.text(1.015, y, formato(valor), transform=ax.get_yaxis_transform(), ha="left", va="center",
                fontsize=9, color=TINTA if destacada else TINTA_2)
    if referencia:
        ax.axvline(referencia[1], color=TINTA_2, linewidth=1, zorder=1)
        ax.text(referencia[1], len(filas) - 0.45, f" {referencia[0]}: {formato(referencia[1])}", ha="left",
                va="bottom", fontsize=8.5, color=TINTA_2)
    ax.set_yticks([])
    ax.set_ylim(-0.6, len(filas) - 0.1)
    tope = max([v for _, v, _, _ in filas] + [r[1] for _, _, r, _ in filas if r] + [referencia[1] if referencia else 0])
    ax.set_xlim(0, tope * 1.15 or 1)
    _eje_porcentaje(ax)
    ax.set_xlabel(xlabel, fontsize=9)
    _encabezado(fig, titulo, f"{_capital(calificador)}.")
    return _guardar(fig, destino, fig_nombre)


def _numero(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def _calificador(*objetos):
    for o in objetos:
        if isinstance(o, dict):
            if isinstance(o.get("calificador"), str):
                return o["calificador"]
            for r in o.get("resultados", []) if isinstance(o.get("resultados"), list) else []:
                if isinstance(r, dict) and isinstance(r.get("calificador"), str):
                    return r["calificador"]
    return "entre auditados con actividad QLS, validación 155–194, base ficticia"


def figura_etiquetas_parciales(resultados, destino):
    p5 = _leer(resultados, "p5")
    if not p5:
        return None, "falta p5.json (P5 todavía sin resultado)"
    filas = []
    elegida = (p5.get("politica") or {}).get("nombre") if isinstance(p5.get("politica"), dict) else None
    for r in p5.get("resultados", []) if isinstance(p5.get("resultados"), list) else []:
        nombre = next((r[k] for k in ("alternativa", "nombre", "politica") if isinstance(r.get(k), str)), None)
        rango = r.get("precision_rango95")
        if nombre and _numero(r.get("precision_cupo")):
            filas.append((_capital(nombre), r["precision_cupo"], rango if isinstance(rango, list) else None,
                          bool(r.get("elegida") or r.get("ganadora") or nombre == elegida)))
    if not filas:
        return None, "p5.json no trae una lista `resultados` con `precision_cupo`"
    calificador = _calificador(p5)
    archivos = _puntos("etiquetas_parciales", "Políticas con etiquetas parciales en validación", filas, calificador,
                       destino, "Precisión en el cupo (rango del 95 %)", pct)
    return {"nombre": "etiquetas_parciales", "archivos": archivos, "fuentes": ["p5.json"],
            "leyenda": f"Precisión en el cupo de cada política de exploración con etiquetas parciales "
                       f"(solo se conoce lo auditado desde el Día 155), {calificador}."}, None


def figura_componente(resultados, destino):
    p6 = _leer(resultados, "p6")
    c = (p6 or {}).get("componente")
    if not isinstance(c, dict):
        return None, "falta p6.json o su bloque `componente`" if not p6 else "p6.json sin bloque `componente`"
    grupos = (("todas_las_calibrada", "todas"), ("calibrada_elegidas_por_la_ganadora", "elegidas"))
    filas = []
    for clave, rotulo in grupos:
        g = c.get(clave)
        if not isinstance(g, dict) or not _numero(g.get("acierto_codigo")):
            continue
        n = g.get("calibrada_evaluadas")
        for k, texto, propia in (("acierto_codigo", "Top 3 del código", True),
                                 ("acierto_general", "Top 3 general", False)):
            rango = g.get(f"{k}_rango95")
            filas.append((f"{texto} · {rotulo} (n = {n})", g[k], rango if isinstance(rango, list) else None, propia))
    if not filas:
        return None, "p6.json `componente` sin `todas_las_calibrada.acierto_codigo`"
    calificador = _calificador(c.get("todas_las_calibrada", {}), p6)
    archivos = _puntos("donde_mirar", "«Dónde mirar»: acierto del componente en los 3 primeros", filas,
                       calificador, destino, "CALIBRADA cuyo componente está entre los 3 sugeridos", pct)
    return {"nombre": "donde_mirar", "archivos": archivos, "fuentes": ["p6.json"],
            "leyenda": f"Acierto en los 3 primeros componentes por código («top 3 del código») frente a los 3 "
                       f"más frecuentes en general, sobre todas las CALIBRADA de validación y sobre las CALIBRADA "
                       f"que eligió la ganadora, {calificador}."}, None


def figura_detector(resultados, destino):
    p6 = _leer(resultados, "p6")
    d = (p6 or {}).get("detector")
    potencia = d.get("potencia_validacion") if isinstance(d, dict) else None
    if not isinstance(potencia, dict):
        return None, ("falta p6.json o su bloque `detector.potencia_validacion`" if not p6
                      else "p6.json sin `detector.potencia_validacion`")
    rotulos = {"sube_x2": "La tasa se duplica", "baja_a_la_mitad": "La tasa baja a la mitad"}
    filas = []
    for clave, texto in rotulos.items():
        v = potencia.get(clave)
        if isinstance(v, dict) and _numero(v.get("deteccion")):
            demora = v.get("demora_mediana_dia")
            filas.append((f"{texto} (demora mediana {demora:.0f} días)" if _numero(demora) else texto,
                          v["deteccion"], None, False))
    if not filas:
        return None, "p6.json `detector.potencia_validacion` sin `deteccion`"
    calificador = _calificador(d, p6)
    archivos = _puntos("detector_potencia", "Detector de cambios: detección de cambios sintéticos", filas,
                       calificador, destino, "Cambios sintéticos detectados", pct)
    return {"nombre": "detector_potencia", "archivos": archivos, "fuentes": ["p6.json"],
            "leyenda": f"Detección del CUSUM de Bernoulli por código (umbral calibrado con ≤149 para ≤1 falsa "
                       f"alarma cada 30 días) ante cambios sintéticos inyectados en validación en "
                       f"{potencia.get('codigos')} códigos, {calificador}."}, None


# --- 4 y 5. diagramas ------------------------------------------------------------------------

def _caja(ax, x, y, w, h, texto, destacada=False, tamano=10.5, negrita=True, detalle=None):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=0.12",
                                facecolor=ACENTO_CLARO if destacada else CAJA,
                                edgecolor=ACENTO if destacada else EJE, linewidth=1.4 if destacada else 1))
    if detalle:
        ax.text(x + w / 2, y + h * 0.66, texto, ha="center", va="center", fontsize=tamano,
                fontweight="bold" if negrita else "normal", color=TINTA)
        ax.text(x + w / 2, y + h * 0.30, detalle, ha="center", va="center", fontsize=tamano - 2.2, color=TINTA_2,
                linespacing=1.3)
    else:
        ax.text(x + w / 2, y + h / 2, texto, ha="center", va="center", fontsize=tamano,
                fontweight="bold" if negrita else "normal", color=TINTA, linespacing=1.3)


def _flecha(ax, a, b, destacada=False, curva=0.0):
    ax.add_patch(FancyArrowPatch(a, b, arrowstyle="-|>,head_length=6,head_width=3.5",
                                 connectionstyle=f"arc3,rad={curva}", color=ACENTO if destacada else TINTA_2,
                                 linewidth=1.6 if destacada else 1.2, shrinkA=0, shrinkB=0, zorder=3))


def _lienzo():
    fig = plt.figure(figsize=(12, 6.75))  # 16:9
    ax = fig.add_axes((0, 0, 1, 1))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 9)
    ax.axis("off")
    return fig, ax


def diagrama_proceso(destino):
    fig, ax = _lienzo()
    ax.text(0.5, 8.45, "Dónde entra la hoja de códigos prioritarios", fontsize=16, fontweight="bold", color=TINTA)
    ax.text(0.5, 7.95, "Proceso de la planta (ficha técnica) y operación de selección informada por Ford el 29/09",
            fontsize=10, color=TINTA_2)
    pasos = [("Body", None), ("Pintura", None), ("Montaje", None), ("Calidad", "verificación\nde calidad"),
             ("Gate\nRelease", None), ("Playa de\ndespacho", "selección de\nunidades"),
             ("Auditoría\nAdicional", "OK o\nCALIBRADA")]
    w, h, y, gap = 1.8, 1.5, 3.6, 0.35
    x0 = (16 - (len(pasos) * w + (len(pasos) - 1) * gap)) / 2
    xs = [x0 + i * (w + gap) for i in range(len(pasos))]
    for i, (x, (texto, detalle)) in enumerate(zip(xs, pasos)):
        _caja(ax, x, y, w, h, texto, destacada=i == 5, detalle=detalle, tamano=11)
        if i:
            _flecha(ax, (xs[i - 1] + w, y + h / 2), (x, y + h / 2))
    # La hoja entra en la playa de despacho, antes de la Auditoría Adicional.
    hx, hy, hw, hh = xs[5] - 1.35, 6.0, w + 2.7, 1.45
    _caja(ax, hx, hy, hw, hh, "Hoja de códigos prioritarios", destacada=True, tamano=11.5,
          detalle="al inicio del día, con el programa del día\ny el cupo diario de Calidad de Planta")
    _flecha(ax, (xs[5] + w / 2, hy), (xs[5] + w / 2, y + h), destacada=True)
    # Notas de la operación, bajo la selección.
    notas = ("Equipo de analistas, en rondas de ~2 h\n"
             "Lee el código de catálogo en la etiqueta del parabrisas\n"
             "Hoy: 5 % al azar. Con la hoja: por código prioritario")
    ax.plot([xs[5] + w / 2, xs[5] + w / 2], [y, 2.75], color=EJE, linewidth=1)
    ax.text(xs[5] + w, 2.6, notas, ha="right", va="top", fontsize=9.5, color=TINTA_2, linespacing=1.5,
            multialignment="right")
    # Resultados que vuelven a QLS y alimentan el recálculo.
    ax.text(xs[6] + 0.25, 2.6, "Resultado a QLS:\nentra al recálculo\ncon Día ≤ t−5", ha="left", va="top",
            fontsize=9.5, color=TINTA_2, linespacing=1.5)
    ax.plot([xs[6] + w / 2, xs[6] + w / 2], [y, 2.75], color=EJE, linewidth=1)
    ax.text(0.5, 0.45, "La herramienta predictiva no cambia el proceso ni el cupo: cambia qué unidades se "
            "eligen para la Auditoría Adicional después de Gate Release.", fontsize=9.5, color=TINTA_2)
    return {"nombre": "diagrama_proceso", "archivos": _guardar(fig, destino, "diagrama_proceso"),
            "fuentes": ["docs/plan-de-accion.md (revisión de fuentes y operación de selección)"],
            "leyenda": "Proceso Body → Pintura → Montaje → Calidad → Gate Release → Auditoría Adicional. La hoja "
                       "de códigos prioritarios entra en la playa de despacho, donde el equipo de analistas elige "
                       "las unidades en rondas de ~2 h leyendo el código en la etiqueta del parabrisas, con el "
                       "cupo diario que fija Calidad de Planta."}, None


def diagrama_solucion(destino):
    fig, ax = _lienzo()
    ax.text(0.5, 8.45, "Cómo funciona la solución cada día", fontsize=16, fontweight="bold", color=TINTA)
    ax.text(0.5, 7.95, "Entradas, recálculo diario y salidas. El código de catálogo es el único predictor.",
            fontsize=10, color=TINTA_2)
    columnas = {"Entradas": 0.5, "Recálculo diario": 5.9, "Salidas": 11.3}
    for titulo, x in columnas.items():
        ax.text(x, 7.25, titulo.upper(), fontsize=9.5, fontweight="bold", color=APAGADO)
    entradas = [("Programa del día", "desde producción: código de\ncatálogo de cada unidad"),
                ("Cupo diario", "lo fija Calidad de Planta"),
                ("Resultados de auditorías", "desde QLS, solo con Día ≤ t−5"),
                ("Catálogo de códigos", "mercado de destino y agrupación")]
    ew, eh, egap, ey0 = 4.2, 1.2, 0.35, 6.9
    ys = [ey0 - eh - i * (eh + egap) for i in range(len(entradas))]
    for (texto, detalle), ey in zip(entradas, ys):
        _caja(ax, 0.5, ey, ew, eh, texto, detalle=detalle, tamano=11)
    # Recálculo diario.
    rx, rw, ry, rh = 5.9, 4.3, ys[-1], ey0 - ys[-1]
    ax.add_patch(FancyBboxPatch((rx, ry), rw, rh, boxstyle="round,pad=0,rounding_size=0.15", facecolor=SUPERFICIE,
                                edgecolor=TINTA_2, linewidth=1.2))
    pasos = [("Tasa de calibración por código", "la alternativa elegida en validación;\nsin historial: tasa general "
              "o de su mercado"),
             ("Mínimo por código", "rotación de auditorías para seguir\naprendiendo de todos los códigos"),
             ("Detector de cambios", "CUSUM por código: avisa si un\ncódigo empeora o mejora")]
    pw, ph, pgap = rw - 0.5, 1.45, 0.3
    pys = [ey0 - 0.3 - ph - i * (ph + pgap) for i in range(len(pasos))]
    for (texto, detalle), py in zip(pasos, pys):
        _caja(ax, rx + 0.25, py, pw, ph, texto, detalle=detalle, tamano=10.5)
    for i in range(len(pasos) - 1):
        _flecha(ax, (rx + rw / 2, pys[i]), (rx + rw / 2, pys[i + 1] + ph))
    ax.text(rx + rw / 2, ry + 0.25, "ordena los códigos del programa del día", ha="center", va="center",
            fontsize=8.5, color=TINTA_2, style="italic")
    for ey in ys:
        _flecha(ax, (0.5 + ew, ey + eh / 2), (rx, ey + eh / 2 if ry < ey + eh / 2 < ry + rh else ry + rh / 2))
    # Salidas.
    sx, sw = 11.3, 4.2
    sy1 = 4.2
    sh1 = ey0 - sy1
    ax.add_patch(FancyBboxPatch((sx, sy1), sw, sh1, boxstyle="round,pad=0,rounding_size=0.12",
                                facecolor=ACENTO_CLARO, edgecolor=ACENTO, linewidth=1.4))
    ax.text(sx + sw / 2, sy1 + sh1 - 0.45, "Hoja de códigos prioritarios", ha="center", va="center", fontsize=11.5,
            fontweight="bold", color=TINTA)
    ax.text(sx + 0.3, sy1 + sh1 - 0.85,
            "• Planilla (CSV/XLSX) e imprimible\n"
            "• Cantidad sugerida por código, con\n  tasa, rango y veces la tasa general\n"
            "• Lista de unidades sugeridas\n• «Por qué este código»",
            ha="left", va="top", fontsize=9.5, color=TINTA, linespacing=1.4)
    sh2 = 1.45
    sy2 = sy1 - 0.35 - sh2
    _caja(ax, sx, sy2, sw, sh2, "«Dónde mirar»", detalle="componente sugerido por código,\nsolo si se sostiene",
          tamano=11)
    sy3 = ry
    _caja(ax, sx, sy3, sw, sy2 - 0.35 - sy3, "Aviso del detector", detalle="para revisar el código señalado",
          tamano=10.5)
    _flecha(ax, (rx + rw, sy1 + sh1 / 2), (sx, sy1 + sh1 / 2), destacada=True)
    _flecha(ax, (rx + rw, sy2 + sh2 / 2), (sx, sy2 + sh2 / 2))
    _flecha(ax, (rx + rw, sy3 + (sy2 - 0.35 - sy3) / 2), (sx, sy3 + (sy2 - 0.35 - sy3) / 2))
    ax.text(0.5, 0.45, "Los analistas auditan lo sugerido en la playa de despacho; esos resultados vuelven a QLS "
            "y entran al recálculo con 5 días de margen.", fontsize=9.5, color=TINTA_2)
    return {"nombre": "diagrama_solucion", "archivos": _guardar(fig, destino, "diagrama_solucion"),
            "fuentes": ["docs/plan-de-accion.md (contrato común, P5, P6 y P8)"],
            "leyenda": "Entradas (programa del día, cupo diario de Calidad de Planta, resultados de auditorías "
                       "con Día ≤ t−5 desde QLS y catálogo), recálculo diario (tasa por código de la alternativa "
                       "elegida en validación, mínimo por código y detector de cambios) y salidas (hoja de "
                       "códigos prioritarios en planilla e imprimible con la lista de unidades sugeridas, y "
                       "«dónde mirar» si se sostiene)."}, None


# --- índice y entrada ------------------------------------------------------------------------

FIGURAS_DATOS = (figura_comparacion, figura_veces_azar, figura_etiquetas_parciales, figura_componente,
                 figura_detector)


def _indice(destino, generadas, omitidas):
    lineas = ["# Figuras de la entrega", "",
              "Generado por `solucion/figuras.py` (P9, [#33](https://github.com/FordwardAI/ford-predictive-"
              "quality/issues/33)); no editar a mano. Se regenera con:", "",
              "```sh", '.venv/bin/python -m solucion.run --csv "<CSV>" --catalogo "<catálogo>" --piezas p9', "```",
              "", "Las figuras de resultados usan solo los agregados de `solucion/resultados/` y cifras de "
              "**validación** (Día del VIN 155–194), no de la prueba final. PNG a 200 dpi para el informe y la "
              "presentación; SVG para editar.", ""]
    for g in generadas:
        png, svg = (Path(a).name for a in g["archivos"])
        lineas += [f"## {g['nombre']}", "", f"![{g['nombre']}]({png})", "",
                   f"- Archivos: [`{png}`]({png}), [`{svg}`]({svg})",
                   f"- Fuente: {', '.join(g['fuentes'])}", f"- Leyenda: {g['leyenda']}", ""]
    if omitidas:
        lineas += ["## Omitidas", "", "Se generan solas cuando la pieza tiene resultado.", ""]
        lineas += [f"- `{o['nombre']}`: {o['motivo']}." for o in omitidas] + [""]
    archivo = destino / "README.md"
    archivo.write_text("\n".join(lineas))
    return archivo


def generar(resultados=RESULTADOS, destino=FIGURAS):
    destino = Path(destino)
    destino.mkdir(parents=True, exist_ok=True)
    generadas, omitidas = [], []
    with plt.rc_context(ESTILO):
        for funcion in FIGURAS_DATOS:
            figura, motivo = funcion(resultados, destino)
            if figura:
                generadas.append(figura)
            else:
                omitidas.append({"nombre": funcion.__name__.removeprefix("figura_"), "motivo": motivo})
                print(f"p9: se omite {funcion.__name__.removeprefix('figura_')}: {motivo}")
        for diagrama in (diagrama_proceso, diagrama_solucion):
            generadas.append(diagrama(destino)[0])
    indice = _indice(destino, generadas, omitidas)

    def relativa(p):
        p = Path(p).resolve()
        return str(p.relative_to(RAIZ)) if RAIZ in p.parents else p.name

    return {"pieza": "P9 figuras", "destino": relativa(destino), "indice": relativa(indice),
            "generadas": [{"nombre": g["nombre"], "archivos": [relativa(a) for a in g["archivos"]],
                           "fuentes": g["fuentes"]} for g in generadas],
            "omitidas": omitidas}


def correr(tabla=None, opciones=None):
    """La tabla no se usa: las figuras salen solo de los agregados ya guardados."""
    return generar()


if __name__ == "__main__":
    print(json.dumps(generar(), ensure_ascii=False, indent=2))
