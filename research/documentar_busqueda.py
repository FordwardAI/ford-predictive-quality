"""Regenera el anexo y dos figuras del estudio usando únicamente sus agregados publicados.

Desde la raíz: .venv/bin/python research/documentar_busqueda.py
No entrena modelos, abre datos crudos ni lee etiquetas de la prueba final.
"""
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

RAIZ = Path(__file__).resolve().parents[1]
RESULTADOS = RAIZ / "solucion" / "experimentos" / "resultados"
TRAMOS = ("seleccion", "confirmacion")
COMPARADOS = (
    ("Tasa fija", "tasa_fija"),
    ("Jerárquico 60 días", "jerarquico_60_20"),
    ("CatBoost con atributos", "ml_catboost_atributos|reentrenado"),
    ("XGBoost con atributos", "ml_xgboost_atributos|reentrenado"),
    ("Random Forest con atributos", "ml_rf_atributos|fijo"),
    ("CatBoost OK/componente", "conjunto|catboost"),
    ("60 % stacking + 40 % jerárquico", None),
    ("80 % XGBoost + 20 % historial A", None),
    ("Catálogo + Rep.PosA, logística A", "campos_A|logistica|columna:Rep.PosA|natural"),
)


def leer(nombre):
    return json.loads((RESULTADOS / f"{nombre}.json").read_text(encoding="utf-8"))


def porcentaje(x):
    return f"{100 * x:.2f}".replace(".", ",") + " %"


def celda(m):
    return f"{m['calibrada_elegidas']}/{m['elegidos']} · {porcentaje(m['precision_cupo'])}"


def comparaciones(b, r):
    individuales = {x["componentes"][0]: x for x in b["todos_los_individuales"]}
    return [(nombre, individuales[clave] if clave else r["top_seleccion"][0] if nombre.startswith("60")
             else b["top_seleccion"][0]) for nombre, clave in COMPARADOS]


def anexo(b, r, semillas):
    poblacion = b["todos_los_individuales"][0]
    def tramo(tr, periodo):
        m = poblacion[tr]
        return (f"- {periodo}: {m['vins']:,} VIN, {m['calibrada_tramo']:,} CALIBRADA, "
                f"{m['elegidos']} elegidos, {m['dias']} días con actividad.")

    lineas = ["# Anexo del estudio: catálogo y resultados completos", "",
              "Generado por [`documentar_busqueda.py`](documentar_busqueda.py) a partir de agregados publicados. "
              "No contiene VIN ni datos crudos. Interpretación y límites en [el estudio](busqueda-amplia.md).", "",
              "## Fuentes y denominadores", "",
              f"- CSV SHA-256: `{b['fuente']['csv_sha256']}`.",
              f"- Catálogo SHA-256: `{b['fuente']['catalogo_sha256']}`.",
              f"- Código de la corrida principal: `{b['version_codigo']}`.",
              f"- Código de revisión: `{r['version_codigo']}`; semillas: `{semillas['version_codigo']}`.",
              "- Unidad VIN; base ficticia, solo auditados con actividad QLS; semilla primaria 1.",
              tramo("seleccion", "Selección 100–174"), tramo("confirmacion", "Comprobación 175–194"),
              "- Todos los períodos ya vistos; el orden usa selección, nunca comprobación.", "",
              "## Comparaciones principales", "",
              "| Alternativa | Selección | Comprobación | Lift posterior | Recall posterior |",
              "| --- | ---: | ---: | ---: | ---: |"]
    for nombre, x in comparaciones(b, r):
        c = x["confirmacion"]
        lineas.append(f"| {nombre} | {celda(x['seleccion'])} | {celda(c)} | {c['veces_azar']:.2f}× | {porcentaje(c['recupero'])} |")
    lineas += ["", "## Estabilidad: cinco semillas", "",
               "Mismos VIN en cada semilla; el promedio no agrega nuevas inspecciones ni muestras independientes. "
               "Pesos de mezcla congelados. No se escoge la mejor semilla.", "",
               "| Alternativa | Aciertos selección, semillas 1–5 | Media selección | Aciertos comprobación, semillas 1–5 | Media comprobación |",
               "| --- | --- | ---: | --- | ---: |"]
    for nombre, clave in (("RF atributos", "rf_atributos"), ("Mezcla", "mezcla"),
                          ("CatBoost conjunto", "conjunto_catboost"), ("Jerárquico", "jerarquico"), ("Stacking", "stacking")):
        datos = [[x[t][clave]["calibrada_elegidas"] for x in semillas["resultados"]] for t in TRAMOS]
        k = [semillas["resultados"][0][t][clave]["elegidos"] for t in TRAMOS]
        medias = [f"{np.mean(v):.1f}".replace(".", ",") for v in datos]
        lineas.append(f"| {nombre} | {', '.join(map(str, datos[0]))} | {medias[0]}/{k[0]} "
                      f"({porcentaje(np.mean(datos[0]) / k[0])}) | {', '.join(map(str, datos[1]))} | "
                      f"{medias[1]}/{k[1]} ({porcentaje(np.mean(datos[1]) / k[1])}) |")
    lineas += ["", "## Las 37 columnas adicionales evaluadas", "",
               "Se ensayan con catálogo como base, no como sustituto. A: eventos hasta Día del VIN; "
               "B: hasta Día−5. Ninguno acredita disponibilidad operativa.", ""]
    lineas += [f"{i}. `{c}`" for i, c in enumerate(b["protocolo"]["columnas_evaluadas"], 1)]
    lineas += ["", "VIN agrupa unidades; Auditoría Adicional y su componente son objetivos; Código de Catálogo "
               "es la base explícita. Por eso no aparecen en esta lista de adicionales.", "",
               "## Cobertura por método y tamaño", "",
               "El mejor de cada fila se eligió por aciertos en selección. El pool de 16 representantes se eligió "
               "en ese mismo período. No todas las configuraciones representan hipótesis independientes.", "",
               "| Método | Entradas/pool | Configuraciones | Mejor selección | Su comprobación |",
               "| --- | ---: | ---: | ---: | ---: |"]
    for x in b["cobertura_por_metodo_y_tamano"]:
        n = str(x["componentes"]) if x["componentes"] else "12 (meta)"
        lineas.append(f"| `{x['metodo']}` | {n} | {x['evaluados']} | "
                      f"{celda(x['mejor']['seleccion'])} | {celda(x['mejor']['confirmacion'])} |")
    lineas += ["", f"Total: **{b['candidatos_evaluados']:,}** configuraciones. "
               f"Revisión de catálogo: **{r['candidatos_evaluados']:,}**, con solapamiento; no sumar ambos totales.", "",
               "Los tamaños de conjuntos cuentan entradas, que pueden ser estimadores o ensembles internos. "
               "En búsqueda continua 16 es el pool; un peso cercano a cero puede hacer que una entrada apenas influya.", "",
               "### Pool de representantes", ""]
    lineas += [f"- `{x}`" for x in b["protocolo"]["pool"]]
    lineas += ["", "## Todos los pipelines individuales", "",
               "Ordenados por aciertos de selección, con desempate por nombre para presentar la tabla. "
               "Identificadores técnicos conservados para localizar hiperparámetros y resultados en los JSON.", "",
               "- `ml_*`: catálogo, código o atributos; `fijo`/`reentrenado` son modos del protocolo existente.",
               "- `campos_A/B`: catálogo + representación de columnas; `base` usa solo catálogo.",
               "- `historial|…|sin`: control sin eventos; A/B son supuestos de disponibilidad.",
               "- `conjunto`: objetivo OK/componente, con entradas de catálogo.",
               "- `natural`, `balanceado`, `sobremuestreo`, `sintetico`: políticas de entrenamiento; `_prior` añade corrección de proporciones.",
               "- `columna:` añade un campo; `top` selecciona campos en entrenamiento; `sin_` excluye un grupo.", "",
               "| # | Pipeline | Selección | Comprobación | Lift posterior | Recall posterior |",
               "| ---: | --- | ---: | ---: | ---: | ---: |"]
    filas = sorted(b["todos_los_individuales"], key=lambda x: (-x["seleccion"]["calibrada_elegidas"], x["componentes"][0]))
    for i, x in enumerate(filas, 1):
        n = x["componentes"][0].replace("|", "\\|")
        c = x["confirmacion"]
        lineas.append(f"| {i} | `{n}` | {celda(x['seleccion'])} | {celda(c)} | "
                      f"{c['veces_azar']:.2f}× | {porcentaje(c['recupero'])} |")
    lineas += ["", "## Evidencia detallada", "",
               "Los JSON conservan rangos bootstrap, treinta máximos, pesos, controles, ajustes por bloque y metas. "
               "Las bandas por búsqueda son condicionales; consultar el informe antes de interpretar diferencias.", "",
               "- [Búsqueda principal](../solucion/experimentos/resultados/busqueda.json)",
               "- [Catálogo y diagnóstico adaptativo](../solucion/experimentos/resultados/robustez_busqueda.json)",
               "- [Cinco semillas](../solucion/experimentos/resultados/semillas_busqueda.json)", ""]
    return "\n".join(lineas)


def figuras(b, r, semillas):
    destino = RAIZ / "research" / "figuras"
    destino.mkdir(exist_ok=True)
    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "axes.spines.top": False,
                         "axes.spines.right": False, "axes.spines.left": False})
    filas = comparaciones(b, r)
    fig, axes = plt.subplots(1, 2, figsize=(13, 6.8), sharey=True)
    y = np.arange(len(filas))
    colores = ["#b56b22" if "historial A" in n or "Rep.PosA" in n else "#245b88" for n, _ in filas]
    for ax, tramo, titulo in zip(axes, TRAMOS, ("Selección · 740 inspecciones", "Posterior · 225 inspecciones")):
        m = [x[tramo] for _, x in filas]
        valores = [100 * x["precision_cupo"] for x in m]
        ax.barh(y, valores, color=colores, height=.65)
        for i, (v, x) in enumerate(zip(valores, m)):
            ax.text(v + .25, i, f"{x['calibrada_elegidas']}/{x['elegidos']} · {v:.2f} %", va="center", fontsize=9)
        azar = 100 * m[0]["azar_mismo_cupo"]
        ax.axvline(azar, color="#444444", linestyle="--", linewidth=1.2)
        ax.text(azar + .2, -.7, f"Azar esperado: {azar:.2f} %", fontsize=9)
        ax.set(xlim=(0, 29), xlabel="Precisión dentro del cupo (%)", title=titulo)
        ax.set_axisbelow(True)
        ax.grid(axis="x", alpha=.15)
    axes[0].set_yticks(y, [n for n, _ in filas])
    axes[0].invert_yaxis()
    fig.suptitle("Comparación de candidatos · semilla primaria 1", fontsize=15)
    fig.text(.02, .02, "Base ficticia; auditados con actividad QLS. Selección: 15.279 VIN; posterior: 4.626 VIN.\n"
             "Día 100–174 / 175–194, ya vistos. Naranja: disponibilidad de campos sin acreditar. Sin intervalos en esta figura.", fontsize=9)
    fig.tight_layout(rect=(0, .09, 1, .95))
    fig.savefig(destino / "busqueda-comparacion.png", dpi=160, metadata={"Software": "FordwardAI"})
    plt.close(fig)

    claves = (("Random Forest", "rf_atributos"), ("Ensemble", "mezcla"),
              ("CatBoost conjunto", "conjunto_catboost"), ("Jerárquico", "jerarquico"))
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.8), sharey=True)
    for ax, tramo, titulo in zip(axes, TRAMOS, ("Selección · cupo de 740 inspecciones", "Posterior · cupo de 225 inspecciones")):
        for i, (_, clave) in enumerate(claves):
            valores = [100 * x[tramo][clave]["precision_cupo"] for x in semillas["resultados"]]
            ax.scatter(valores, i + np.linspace(-.16, .16, len(valores)), color="#245b88", s=35,
                       label="Cada semilla" if i == 0 else None)
            ax.scatter(np.mean(valores), i, color="#b56b22", marker="D", s=45,
                       label="Media" if i == 0 else None)
        ax.set(xlim=(15.5, 21.5), xlabel="Precisión dentro del cupo (%)", title=titulo)
        ax.grid(axis="x", alpha=.2)
        ax.legend(loc="lower right", fontsize=9)
    axes[0].set_yticks(range(len(claves)), [n for n, _ in claves])
    axes[0].invert_yaxis()
    fig.suptitle("Estabilidad con cinco semillas · pesos de la mezcla congelados", fontsize=14)
    fig.text(.02, .02, "Cada punto corresponde a una semilla; el desplazamiento vertical permite ver coincidencias.\n"
             "Mismos VIN, base ficticia, períodos ya vistos. La dispersión entre semillas no es un intervalo de confianza.", fontsize=9)
    fig.tight_layout(rect=(0, .12, 1, .95))
    fig.savefig(destino / "busqueda-semillas.png", dpi=160, metadata={"Software": "FordwardAI"})
    plt.close(fig)


def main():
    b, r, s = (leer(x) for x in ("busqueda", "robustez_busqueda", "semillas_busqueda"))
    (RAIZ / "research" / "anexo-busqueda.md").write_text(anexo(b, r, s), encoding="utf-8")
    figuras(b, r, s)
    print("Anexo y dos figuras del estudio regenerados desde agregados.")


if __name__ == "__main__":
    main()
