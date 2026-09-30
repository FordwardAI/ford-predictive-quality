"""Exporta los datos del prototipo de plataforma web a `data.js` (window.B = {...}).

    <repo>/.venv/bin/python exportar_datos.py --csv "<Dataset QLS Inspección Adicional.csv>" \\
        --catalogo "<Códigos de catálogo.csv>" [--repo <raíz del repo>] [--p6-detalle <p6-detalle.json>]

Reutiliza el paquete `solucion` del repo: la tabla por VIN enmascarada (Día >= 200 sin etiquetas), la hoja del
Día 190 con un programa simulado (ids ficticios U-0001…), la ganadora de validación, el detector y el componente.
Solo exporta agregados por código y por día de validación (155–194): nunca un VIN. Al terminar busca en la carpeta
cualquier VIN de la tabla y falla si encuentra uno. `data.js` tiene tasas reales por código: no se versiona.
"""
import argparse
import collections
import json
import re
import sys
from pathlib import Path

import numpy as np

AQUI = Path(__file__).resolve().parent
DIA = 190
SEMILLA_AZAR_QLS = 20261030  # Sorteo de la pantalla «resultados no disponibles» (selección al azar como hoy).
VENTANA_SERIE = 60  # Días de resultados por punto en la serie de un código.
PASO_SERIE = 5


def argumentos(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--csv", required=True, type=Path)
    p.add_argument("--catalogo", required=True, type=Path)
    p.add_argument("--repo", type=Path, default=AQUI.parent.parent,
                   help="Raíz del repo ford-predictive-quality (por defecto, dos niveles arriba de esta carpeta)")
    p.add_argument("--p6-detalle", type=Path, help="p6-detalle.json de la corrida (opcional, para contrastar)")
    p.add_argument("--cache", type=Path, default=Path.home() / ".cache" / "ford-predictive-quality")
    p.add_argument("--salida", type=Path, default=AQUI / "data.js")
    return p.parse_args(argv)


def r4(x):
    return None if x is None else round(float(x), 4)


def main(argv=None):
    a = argumentos(argv)
    repo = a.repo.resolve()
    assert (repo / "solucion" / "hoja.py").exists(), f"--repo no apunta al repo: {repo}"
    sys.path.insert(0, str(repo))

    from solucion import cupo as cupo_mod
    from solucion import datos, diferencial, exploracion, hoja
    from solucion.cupo import diario, fuente_completa
    from solucion.datos import MARGEN, TRAMOS
    from solucion.eleccion import ganadora
    from solucion.puntaje import Contexto, wilson

    res = repo / "solucion" / "resultados"
    leer = lambda n: json.loads((res / f"{n}.json").read_text())  # noqa: E731
    prep, p3, p4, p5, p6, p8, elec = (leer(n) for n in ("preparacion", "p3", "p4", "p5", "p6", "p8", "eleccion"))
    prereg = json.loads((repo / "solucion" / "preregistro.json").read_text())

    tabla = datos.cargar(a.csv, a.catalogo, cache=a.cache)
    assert not tabla.desbloqueada, "La tabla tiene que estar enmascarada"
    lo_v, hi_v = TRAMOS["validacion"]

    # --- Hoja del Día 190 --------------------------------------------------------------------------------------
    programa = hoja.simular_programa(tabla, DIA)
    h = hoja.armar(tabla, programa, DIA, programa_simulado=True)
    tx = hoja.textos(h)
    filas = [{"codigo": f.codigo, "sugerida": f.sugerida, "tasa": r4(f.tasa),
              "rango": [r4(x) for x in f.rango] if f.rango else None, "n": f.n, "cal": f.cal, "veces": r4(f.veces),
              "programadas": f.programadas, "acumulado": f.acumulado, "mercado": f.mercado, "version": f.version,
              "motor": f.motor, "traccion": f.traccion} for f in h.filas]
    ranking = [f.codigo for f in h.filas]
    programadas = collections.Counter(c for _, c in programa)

    # Ronda en la playa: un código prioritario llega con menos unidades y uno del mínimo no llega.
    sugeridas = collections.Counter({f.codigo: f.sugerida for f in h.filas if f.sugerida})
    for c, _ in h.exploracion:
        sugeridas[c] += 1
    primero = next(f.codigo for f in h.filas if f.sugerida)
    ausente = h.exploracion[-1][0] if h.exploracion else None
    llego_primero = max(0, sugeridas[primero] - 7)
    llegados = dict(programadas)
    llegados[primero] = llego_primero
    if ausente:
        llegados[ausente] = 0
    nueva, al_azar = hoja.reasignar(dict(sugeridas), ranking, llegados)
    # Caso extremo: el ranking se agota (solo llegan 3 unidades en total a la playa).
    pocos = {primero: 2, ranking[1]: 1}
    nueva_pocos, azar_pocos = hoja.reasignar(dict(sugeridas), ranking, pocos)

    # Fallback con QLS caído: sorteo al azar del cupo entre las unidades programadas, como hoy.
    rng = np.random.default_rng([SEMILLA_AZAR_QLS, DIA])
    sorteo = sorted(programa[i][0] for i in rng.choice(len(programa), size=h.cupo, replace=False))
    sorteo_cod = {u: c for u, c in programa}

    # --- Series por código (resultados conocidos, validación) -------------------------------------------------
    fuente = fuente_completa(tabla)
    codigos = ranking
    # Solo resultados conocidos el Día DIA (Día <= DIA − MARGEN): la pantalla se ve ese día.
    finales = sorted(set([e for e in range(99, DIA - MARGEN + 1, PASO_SERIE)] + [DIA - MARGEN]))
    series = {c: [] for c in codigos}
    series_general, series_mercado = [], collections.defaultdict(list)
    for e in finales:
        ctx = Contexto(fuente, e + MARGEN)  # Se conoce el Día e + 5.
        con = ctx.conocidas(e, desde=e - VENTANA_SERIE + 1)
        por = con.por_codigo()
        g = con.general()
        series_general.append({"hasta": e, "tasa": r4(g), "n": int(con.n.sum())})
        mercados = collections.defaultdict(lambda: [0.0, 0.0])
        for c, (n, cal) in por.items():
            m = tabla.mercado(c)
            if m:
                mercados[m][0] += n
                mercados[m][1] += cal
        for m, (n, cal) in mercados.items():
            series_mercado[m].append({"hasta": e, "tasa": r4(cal / n), "n": int(n)})
        for c in codigos:
            n, cal = por.get(c, (0.0, 0.0))
            series[c].append({"hasta": e, "n": int(n), "cal": int(cal), "tasa": r4(cal / n) if n else None,
                              "rango": [r4(x) for x in wilson(cal, n)] if n else None})

    # Tasa por mercado de destino en validación (resultados de 155 a 185, conocidos el Día 190).
    ctx_m = Contexto(fuente, DIA)
    con_m = ctx_m.conocidas(DIA - MARGEN, desde=lo_v)
    mercado_val = collections.defaultdict(lambda: [0.0, 0.0, set()])
    for c, (n, cal) in con_m.por_codigo().items():
        m = tabla.mercado(c)
        if m:
            mercado_val[m][0] += n
            mercado_val[m][1] += cal
            mercado_val[m][2].add(c)
    mercados = [{"mercado": m, "n": int(n), "cal": int(cal), "tasa": r4(cal / n),
                 "rango": [r4(x) for x in wilson(cal, n)], "codigos": len(cs),
                 "programados_hoy": sum(1 for c in codigos if tabla.mercado(c) == m)}
                for m, (n, cal, cs) in sorted(mercado_val.items())]

    # --- Detector (CUSUM) --------------------------------------------------------------------------------------
    hh = p6["detector"]["configuracion"]["h"]
    p0, general149 = diferencial.referencia(tabla, TRAMOS["entrenamiento"][1])
    alarmas = diferencial.alarmas_reales(tabla, p0, general149, hh, lo_v, hi_v)
    cod_val = sorted({v.codigo for v in tabla.vins if lo_v <= v.dia <= hi_v})
    n_d, x_d = diferencial.matriz_diaria(tabla, cod_val, lo_v, hi_v)
    arriba, abajo = diferencial.incrementos(n_d, x_d, np.array([p0.get(c, general149) for c in cod_val]))
    su, sd = np.zeros(len(cod_val)), np.zeros(len(cod_val))
    cusum = {c: [] for c in cod_val}
    mias = []
    for j in range(arriba.shape[-1]):
        su, sd = np.maximum(0, su + arriba[:, j]), np.maximum(0, sd + abajo[:, j])
        for i, c in enumerate(cod_val):
            cusum[c].append([r4(su[i]), r4(sd[i])])
        au, ad = su > hh, sd > hh
        mias += [(cod_val[i], lo_v + j, "sube") for i in np.flatnonzero(au)]
        mias += [(cod_val[i], lo_v + j, "baja") for i in np.flatnonzero(ad)]
        su, sd = np.where(au, 0, su), np.where(ad, 0, sd)
    assert sorted(mias) == sorted(alarmas), "El CUSUM exportado no reproduce las alarmas del detector"
    vol_val = collections.Counter(v.codigo for v in tabla.vins if lo_v <= v.dia <= hi_v)
    alertas = []
    for c, d, s in sorted(alarmas, key=lambda x: x[1]):
        antes = sum(v.calibrada for v in tabla.vins if v.codigo == c and v.dia <= TRAMOS["entrenamiento"][1])
        n_antes = sum(1 for v in tabla.vins if v.codigo == c and v.dia <= TRAMOS["entrenamiento"][1])
        desde = [v for v in tabla.vins if v.codigo == c and lo_v <= v.dia <= d]
        alertas.append({"codigo": c, "dia": d, "conocida": d + MARGEN, "sentido": s, "mercado": tabla.mercado(c),
                        "p0": r4(p0.get(c, general149)), "n_149": n_antes, "cal_149": antes,
                        "n_desde_155": len(desde), "cal_desde_155": sum(v.calibrada for v in desde),
                        "programado_hoy": c in programadas})

    # --- Dónde mirar (componente) ------------------------------------------------------------------------------
    # Lo que se conoce el Día DIA: CALIBRADA con Día <= DIA − MARGEN (185), igual que la hoja.
    conocidas_c = [v for v in tabla.vins if v.dia <= DIA - MARGEN and v.calibrada]
    por_codigo = collections.defaultdict(collections.Counter)
    for v in conocidas_c:
        por_codigo[v.codigo][v.componente] += 1
    dist = diferencial._general(collections.Counter(v.componente for v in conocidas_c))
    donde = {}
    for c in codigos:
        d_c = diferencial.distribucion_suavizada(por_codigo.get(c, {}), dist)
        top = diferencial.primeros(d_c)
        donde[c] = {"top": [{"componente": k, "prop": r4(d_c[k]), "general": r4(dist.get(k, 0))} for k in top],
                    "cal_con_componente": int(sum(por_codigo.get(c, {}).values()))}
    top_general = list(diferencial.primeros(dist))
    contraste = None
    if a.p6_detalle and a.p6_detalle.exists():
        det = json.loads(a.p6_detalle.read_text())
        # p6-detalle tiene el componente al cierre de la validación (hasta el 189): solo se contrastan las alarmas.
        al_ref = sorted((x["codigo"], x["dia"], x["sentido"]) for x in det.get("alarmas_validacion", []))
        contraste = {"alarmas_coinciden": al_ref == sorted(alarmas)}

    # --- Días de control (P5, simulación en validación) --------------------------------------------------------
    puntaje = ganadora(tabla)
    elegida = next(p for p in exploracion.politicas() if p.nombre == p5["politica"]["nombre"])
    dias_v = list(tabla.por_dia(lo_v, hi_v))
    control = {t for i, t in enumerate(dias_v) if i % 2 == 1}
    d_c, _ = exploracion.simular_parcial(tabla, puntaje, elegida, lo_v, hi_v, control=lambda t: t in control)
    control_diario = [{"dia": int(t), "control": int(t) in control, "k": int(k), "cal": int(ce), "n": int(n)}
                      for t, n, k, ce in zip(d_c.dias, d_c.n, d_c.k, d_c.cal_elegidas)]
    rng_c = np.random.default_rng(cupo_mod.SEMILLA_BOOTSTRAP)
    acumulado = []
    for j in range(len(control_diario)):
        hs = [x for x in control_diario[:j + 1] if not x["control"]]
        cs = [x for x in control_diario[:j + 1] if x["control"]]
        fila = {"dia": control_diario[j]["dia"], "dias_hoja": len(hs), "dias_control": len(cs)}
        if hs and cs and sum(x["cal"] for x in cs):
            ph = sum(x["cal"] for x in hs) / sum(x["k"] for x in hs)
            pc = sum(x["cal"] for x in cs) / sum(x["k"] for x in cs)
            kh, ch = np.array([x["k"] for x in hs]), np.array([x["cal"] for x in hs])
            kc, cc = np.array([x["k"] for x in cs]), np.array([x["cal"] for x in cs])
            ih = rng_c.integers(0, len(hs), size=(2000, len(hs)))
            ic = rng_c.integers(0, len(cs), size=(2000, len(cs)))
            pch = cc[ic].sum(1) / kc[ic].sum(1)
            est = (ch[ih].sum(1) / kh[ih].sum(1)) / np.where(pch > 0, pch, np.nan)
            fila.update({"prec_hoja": r4(ph), "prec_control": r4(pc), "veces": r4(ph / pc),
                         "rango": [r4(np.nanpercentile(est, 2.5)), r4(np.nanpercentile(est, 97.5))]})
        acumulado.append(fila)
    ultimo = acumulado[-1]
    assert abs(ultimo["veces"] - p5["dias_de_control"]["veces_azar_estimado_con_control"]) < 0.01

    # --- Evaluación --------------------------------------------------------------------------------------------
    empates = {x["alternativa"]: x["empata"] for x in elec["comparacion"]}

    def alt(r, pieza):
        s = r.get("semillas_modelo")
        return {"alternativa": r["alternativa"], "familia": r["familia"], "pieza": pieza, "elegible": r["elegible"],
                "modo": r["parametros"].get("modo") if pieza == "p4" else None,
                "precision": r4(r["precision_cupo"]), "rango": [r4(x) for x in r["precision_rango95"]],
                "veces": r4(r["veces_azar"]), "veces_rango": [r4(x) for x in r["veces_azar_rango95"]],
                "cal": r["calibrada_elegidas"], "elegidos": r["elegidos"], "lectura": r["lectura"],
                "empata": empates.get(r["alternativa"]),
                "semillas": {"min": r4(s["min"]), "max": r4(s["max"]), "mediana": r4(s["mediana"]),
                             "n": len(s["semillas"])} if s else None}

    alternativas = [alt(r, "p3") for r in p3["resultados"]] + [alt(r, "p4") for r in p4["resultados"]]
    g = elec["ganadora"]
    ref = p3["resultados"][0]
    evaluacion = {"regla": elec["regla"], "mejor": elec["mejor_precision"], "ganadora": g["alternativa"],
                  "precision": r4(g["precision_cupo"]), "rango": [r4(x) for x in g["precision_rango95"]],
                  "veces": r4(g["veces_azar"]), "veces_rango": [r4(x) for x in g["veces_azar_rango95"]],
                  "lectura": g["lectura"], "azar_mismo_cupo": r4(ref["azar_mismo_cupo"]),
                  "azar_sorteo": r4(ref["precision_cupo"]), "elegidos": ref["elegidos"], "dias": ref["dias"],
                  "vins": ref["vins"], "cal_tramo": ref["calibrada_tramo"],
                  "elegibles": sum(x["elegible"] for x in alternativas),
                  "empatan": sum(1 for x in alternativas if x["elegible"] and x["empata"]),
                  "cal_ganadora": next(x["cal"] for x in alternativas if x["alternativa"] == g["alternativa"]),
                  "semillas_bootstrap": ref["semillas"], "alternativas": alternativas}

    # --- Exploración (P5) --------------------------------------------------------------------------------------
    politicas = []
    emp5 = {x["alternativa"]: x["empata"] for x in p5["eleccion"]["comparacion"]}
    for r in p5["resultados"]:
        dd = r["diario"]
        cum_k, cum_c, acum = 0, 0, []
        for k, c in zip(dd["k"], dd["cal_elegidas"]):
            cum_k, cum_c = cum_k + k, cum_c + c
            acum.append(r4(cum_c / cum_k))
        politicas.append({"alternativa": r["alternativa"], "elegible": r["elegible"], "tipo": r["politica"],
                          "precision": r4(r["precision_cupo"]), "rango": [r4(x) for x in r["precision_rango95"]],
                          "veces": r4(r["veces_azar"]), "cal": r["calibrada_elegidas"], "elegidos": r["elegidos"],
                          "empata": emp5.get(r["alternativa"]), "acumulada": acum})

    # --- Datos y preparación -----------------------------------------------------------------------------------
    cp = prep["control_particiones"]
    particiones = [
        {"nombre": "Entrenamiento (comparación)", "dias": "hasta 149", "vins": cp["entrenamiento_comparacion"]["vins"],
         "cal": cp["entrenamiento_comparacion"]["calibrada"]},
        {"nombre": "Validación", "dias": f"{lo_v}–{hi_v}", "vins": cp["validacion"]["vins"],
         "cal": cp["validacion"]["calibrada"]},
        {"nombre": "Entrenamiento final", "dias": "hasta 194", "vins": cp["entrenamiento_final"]["vins"],
         "cal": cp["entrenamiento_final"]["calibrada"]},
        {"nombre": "Prueba final", "dias": "desde 200", "vins": cp["prueba_final"]["vins"], "cal": None},
        {"nombre": "Prueba final hasta 260", "dias": "200–260", "vins": cp["prueba_final_hasta_260"]["vins"],
         "cal": None},
        {"nombre": "Prueba final después de 260", "dias": "después de 260",
         "vins": cp["prueba_final_despues_260"]["vins"], "cal": None},
        {"nombre": "Cohorte posterior a 260 (sensibilidad)", "dias": "primera inspección después de 260",
         "vins": cp["cohorte_posterior_260"]["vins"], "cal": None},
    ]
    comp = p6["componente"]
    det = p6["detector"]
    sub = p6["subcategorizacion"]

    n_val = cp["validacion"]["vins"]
    B = {
        "meta": {
            "wordmark": "FordwardAI · Calidad predictiva",
            "dia": DIA, "margen": MARGEN, "tramo_validacion": [lo_v, hi_v],
            "n_validacion": n_val, "cal_validacion": cp["validacion"]["calibrada"],
            "poblacion": cp["poblacion_principal"]["vins"],
            "fuente": {"csv": prep["fuente"]["csv"], "csv_sha": prep["fuente"]["csv_sha256"][:12],
                       "catalogo": prep["fuente"]["catalogo"], "catalogo_sha": prep["fuente"]["catalogo_sha256"][:12]},
            "version_codigo": p8["version_codigo"][:8],
            "dias_validacion": [{"dia": int(d), "n": int(n), "k": int(k)} for d, n, k in
                                zip(ref["diario"]["dias"], ref["diario"]["n"], ref["diario"]["k"])],
        },
        "hoja": {"dia": h.dia, "cupo": h.cupo, "cupo_5": h.cupo_5, "programadas": h.programadas,
                 "codigos": len(h.filas), "filas": filas,
                 "exploracion": [{"codigo": c, "ultimo": u} for c, u in h.exploracion],
                 "unidades": [{"codigo": c, "motivo": m, "ids": ids} for c, m, ids in h.unidades],
                 "sin_cubrir": h.sin_cubrir, "predictor": h.predictor, "ventana": list(h.ventana),
                 "general": r4(h.general), "n_ventana": h.n_ventana, "P": h.minimo[0], "P_origen": h.minimo[1],
                 "por_que": [{k: (r4(v) if isinstance(v, float) else v) for k, v in p.items()} for p in h.por_que],
                 "ventana_mercado": list(h.ventana_mercado),
                 "agrupaciones": {k: {"chi2": r4(v["chi2"]), "grupos": v["grupos"]}
                                  for k, v in h.agrupaciones.items()},
                 "uso": tx["uso"], "semillas": p8["semillas"],
                 "programa_muestra": [list(x) for x in programa[:6]],
                 "sorteo_qls": [{"unidad": u, "codigo": sorteo_cod[u]} for u in sorteo],
                 "semilla_sorteo": SEMILLA_AZAR_QLS},
        "ronda": {"primero": primero, "llego_primero": llego_primero, "ausente": ausente,
                  "sugeridas": dict(sugeridas), "nueva": nueva, "azar": al_azar,
                  "pocos": pocos, "nueva_pocos": nueva_pocos, "azar_pocos": azar_pocos},
        "series": {"finales": finales, "ventana": VENTANA_SERIE, "codigos": series, "general": series_general,
                   "mercado": dict(series_mercado)},
        "mercados": mercados, "ventana_mercados": [lo_v, DIA - MARGEN],
        "detector": {"h": hh, "falsas_30": r4(det["calibracion_149"]["falsas_alarmas_cada_30_dia"]),
                     "codigos_calibracion": det["calibracion_149"]["codigos"],
                     "permutaciones": det["calibracion_149"]["permutaciones"],
                     "potencia": det["potencia_validacion"], "reales": det["etiquetas_reales_validacion"],
                     "alertas": alertas, "cusum": {c: cusum[c] for c in codigos if c in cusum},
                     "cusum_dias": [lo_v, hi_v], "p0": {c: r4(p0.get(c, general149)) for c in codigos},
                     "p0_general": r4(general149), "p0_hasta": TRAMOS["entrenamiento"][1], "volumen_validacion": {c: vol_val.get(c, 0) for c in codigos}},
        "donde": {"por_codigo": donde, "top_general": top_general, "hasta": DIA - MARGEN,
                  "todas": {k: comp["todas_las_calibrada"][k] for k in
                            ("calibrada_evaluadas", "aciertos_codigo", "acierto_codigo", "acierto_codigo_rango95",
                             "aciertos_general", "acierto_general", "acierto_general_rango95",
                             "lectura_contra_general")},
                  "elegidas": {k: comp["calibrada_elegidas_por_la_ganadora"][k] for k in
                               ("calibrada_evaluadas", "aciertos_codigo", "acierto_codigo", "acierto_codigo_rango95",
                                "aciertos_general", "acierto_general", "acierto_general_rango95",
                                "lectura_contra_general")},
                  "contraste_p6_detalle": contraste},
        "evaluacion": evaluacion,
        "exploracion": {"politicas": politicas, "dias": ref["diario"]["dias"], "elegida": p5["politica"]["nombre"],
                        "P": p5["minimo_por_codigo"]["P"], "periodos": p5["configuracion"]["periodos"],
                        "control": p5["dias_de_control"], "supuesto": p5["supuesto"]},
        "control": {"diario": control_diario, "acumulado": acumulado},
        "subcategorizacion": {"k": sub["k"], "codigos": sub["codigos_con_perfil"],
                              "tau": r4(sub["orden_en_validacion"]["tau_kendall"]),
                              "se_mantiene": sub["orden_en_validacion"]["se_mantiene"]},
        "datos": {"eventos": prep["eventos"]["filas"], "duplicados": prep["eventos"]["duplicados_exactos_conservados"],
                  "na_reparacion": prep["eventos"]["na_en_fecha_reparacion"],
                  "desalineadas": prep["eventos"]["descripciones_desalineadas_38_40"],
                  "particiones": particiones, "todo_coincide": prep["todo_coincide"],
                  "cupo_diario": prep["cupo_diario"], "codigos_nuevos": prep["codigos_nuevos"],
                  "fuga": prep["componente_como_fuga_hasta_194"],
                  "etiquetas_prueba": prep["etiquetas_prueba_final"]},
        "preregistro": {"estado": prereg["estado"], "fecha": prereg["fecha"],
                        "ganadora": prereg["ganadora"]["alternativa"],
                        "en_prueba": prereg["ganadora_en_prueba"]["modo"],
                        "P": prereg["piezas"]["p5"]["minimo_por_codigo"]["P"],
                        "h": prereg["piezas"]["p6"]["detector"]["h"],
                        "semillas": {k: v for k, v in prereg["semillas"].items() if k != "modelo"},
                        "tramos": [{"nombre": t["nombre"], "desde": t["desde"], "hasta": t["hasta"],
                                    "vin": t.get("vin_esperados"), "lectura": t.get("lectura")}
                                   for t in prereg["tramos"]],
                        "e3": prereg["piezas"]["e3"]["dia"], "como_acordar": prereg["como_acordar"]},
    }

    texto = "// Generado por exportar_datos.py: datos reales de la base ficticia. No se versiona.\nwindow.B = " + \
        json.dumps(B, ensure_ascii=False, indent=1) + ";\n"
    a.salida.write_text(texto, encoding="utf-8")

    # --- Control: ningún VIN en la carpeta ---------------------------------------------------------------------
    vins = {v.vin for v in tabla.vins} | {v.vin for v in tabla.cohorte}
    hallados, revisados = set(), 0
    for archivo in AQUI.rglob("*"):
        if archivo.is_file() and archivo.suffix in (".js", ".html", ".css", ".md", ".py", ".sh", ".json", ".txt"):
            revisados += 1
            hallados |= vins & set(re.findall(r"[A-Za-z0-9]+", archivo.read_text(encoding="utf-8", errors="replace")))
    assert not hallados, f"{len(hallados)} VIN en la carpeta del prototipo"
    print(json.dumps({"data_js": str(a.salida), "bytes": a.salida.stat().st_size, "archivos_revisados": revisados,
                      "vin_encontrados": 0, "vins_en_la_tabla": len(vins), "contraste_p6_detalle": contraste},
                     ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
