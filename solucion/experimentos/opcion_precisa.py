"""¿Cuál es la opción más precisa? Techo del código, estimadores nuevos, palancas operativas y señal por VIN (#33).

Exploratorio: solo Día < 195, ya explorado, entre auditados con actividad QLS de la base ficticia. No relee la
prueba final ni modifica los preregistros. Los parámetros de las familias nuevas se eligen por log-loss
secuencial en 60–149, nunca por aciertos en el cupo; recién después se leen validación y bloques.
"""
import argparse
import collections
import json
from pathlib import Path

import numpy as np

from .. import referencias as R
from ..cupo import (SEMILLA_DESEMPATE, cupo, diario, diferencia, fuente_completa, metricas, remuestreos, seleccionar,
                    version_codigo)
from ..datos import MARGEN, RAIZ, cargar
from ..precision import BLOQUES_SELECCION, CONFIRMACION
from ..puntaje import Contexto, Puntaje, atributos_de, semilla_dia

CACHE = Path.home() / ".cache" / "ford-predictive-quality"
SALIDA = RAIZ / "solucion" / "experimentos" / "resultados" / "opcion_precisa.json"
VALIDACION = (155, 194)
CRITERIO = (60, 149)  # Días cuyo log-loss secuencial elige los parámetros.
GRILLA_SIR = [(v, k) for v in (None, 120, 60) for k in (5, 10, 20, 40)]
GRILLA_OLVIDO = [(v, k) for v in (30, 60, 120) for k in (10, 20, 40)]
PERIODOS = ((1, 49), (50, 99), (100, 149), (155, 194))
SEMILLA_LGBM = 20261001


class RiesgoEstandarizado(Puntaje):
    """Riesgo relativo del código frente a los demás códigos del mismo día, contraído hacia su mercado.

    Modelo multiplicativo E[CALIBRADA del código c el día d] = n_cd · g_d · RR_c. La tasa del día g_d absorbe la
    deriva global, que no cambia el orden dentro de un día; RR_c usa todo el historial del código aunque se haya
    producido en épocas de distinta tasa general. RR_c = (O_c + κ·RR_mercado) / (E_c + κ), con O y E en eventos
    observados y esperados ponderados por antigüedad; el mercado se contrae hacia 1 con el mismo κ.
    """
    familia, orden, necesita_catalogo = "riesgo_estandarizado", (3, 3), True

    def __init__(self, vida=60, kappa=10, mercados=None, margen=MARGEN, nivel_dias=30, iteraciones=60):
        self.vida, self.kappa, self.mercados, self.margen = vida, kappa, mercados or {}, margen
        self.nivel_dias, self.iteraciones = nivel_dias, iteraciones
        self.parametros = {"vida": vida, "kappa": kappa, "margen": margen}
        vida_txt = "todo el historial" if vida is None else f"vida media {vida} d"
        self.nombre = f"riesgo estandarizado, {vida_txt}, κ {kappa}" + (f", margen {margen} d" if margen != MARGEN else "")
        if margen < MARGEN:  # Palanca exploratoria: usa resultados que hoy no se conocerían.
            self.usa_futuro, self.elegible = True, False

    def riesgos(self, ctx):
        """({código: RR}, {mercado: RR}, nivel reciente de la tasa) con resultados de Día <= t − margen."""
        conocidas = ctx.conocidas(ctx.t - self.margen)
        n, cal, dias = conocidas.n, conocidas.cal, conocidas.dias
        w = np.ones(len(dias)) if self.vida is None else 0.5 ** ((ctx.t - dias) / self.vida)
        mercado = np.array([self.mercados.get(c) or "" for c in conocidas.codigos])
        claves = sorted(set(mercado) - {""})
        rr = np.ones(len(conocidas.codigos))
        rr_mercado = {}
        for _ in range(self.iteraciones):
            den = (n * rr[:, None]).sum(0)
            g = np.divide(cal.sum(0), den, out=np.zeros(len(dias)), where=den > 0)
            esperados, observados = (n * (g * w)[None, :]).sum(1), (cal * w[None, :]).sum(1)
            rr_mercado = {m: (observados[mercado == m].sum() + self.kappa) / (esperados[mercado == m].sum() + self.kappa)
                          for m in claves}
            previa = np.array([rr_mercado.get(m, 1.0) for m in mercado])
            nuevo = (observados + self.kappa * previa) / (esperados + self.kappa)
            listo = np.allclose(nuevo, rr, rtol=0, atol=1e-9)
            rr = nuevo
            if listo:
                break
        reciente = dias > ctx.t - self.margen - self.nivel_dias
        base = (n[:, reciente] * rr[:, None]).sum()
        nivel = cal[:, reciente].sum() / base if base > 0 else (cal.sum() / max(n.sum(), 1.0))
        return dict(zip(conocidas.codigos, rr.tolist())), rr_mercado, float(nivel)

    def puntuar(self, ctx, codigos):
        rr, rr_mercado, nivel = self.riesgos(ctx)
        return {c: nivel * rr.get(c, rr_mercado.get(self.mercados.get(c), 1.0)) for c in codigos}


class OlvidoMercado(Puntaje):
    """Tasa con olvido exponencial, contraída hacia su mercado (que se contrae hacia la general) con κ VIN."""
    familia, orden, necesita_catalogo = "olvido_mercado", (4, 1), True

    def __init__(self, vida=30, kappa=40, mercados=None):
        self.vida, self.kappa, self.mercados = vida, kappa, mercados or {}
        self.parametros = {"vida": vida, "kappa": kappa}
        self.nombre = f"olvido {vida} d hacia el mercado, κ {kappa}"

    def puntuar(self, ctx, codigos):
        conocidas = ctx.conocidas(ctx.t - MARGEN)
        w = 0.5 ** ((ctx.t - conocidas.dias) / self.vida)
        n, cal = conocidas.n @ w, conocidas.cal @ w
        general = cal.sum() / n.sum() if n.sum() else 0.0
        por_mercado = collections.defaultdict(lambda: [0.0, 0.0])
        for c, a, b in zip(conocidas.codigos, n, cal):
            x = por_mercado[self.mercados.get(c)]
            x[0] += a
            x[1] += b
        previa = {m: (b + self.kappa * general) / (a + self.kappa) for m, (a, b) in por_mercado.items() if m}
        conteo = dict(zip(conocidas.codigos, zip(n, cal)))
        salida = {}
        for c in codigos:
            a, b = conteo.get(c, (0.0, 0.0))
            p = previa.get(self.mercados.get(c), general)
            salida[c] = float((b + self.kappa * p) / (a + self.kappa))
        return salida


def _contexto(fuente, puntaje, t):
    return Contexto(fuente, t, permite_futuro=getattr(puntaje, "usa_futuro", False))


def log_loss_secuencial(tabla, puntaje, lo=CRITERIO[0], hi=CRITERIO[1], fuente=None):
    """Log-loss de todos los VIN de cada día t, prediciendo con lo conocido en t (criterio de elección)."""
    fuente = fuente or fuente_completa(tabla)
    total, n = 0.0, 0
    for t, vins in tabla.por_dia(lo, hi).items():
        p = puntaje.puntuar(_contexto(fuente, puntaje, t), sorted({v.codigo for v in vins}))
        for v in vins:
            q = min(max(p[v.codigo], 1e-4), 1 - 1e-4)
            total -= np.log(q) if v.calibrada else np.log(1 - q)
            n += 1
    return total / n


def _auc_dia(vins, puntos, clave):
    """(pares concordantes, pares) dentro del día; un empate cuenta medio."""
    pos = collections.Counter(puntos[clave(v)] for v in vins if v.calibrada)
    neg = collections.Counter(puntos[clave(v)] for v in vins if not v.calibrada)
    conc = sum(a * b * (1.0 if sp > sn else 0.5 if sp == sn else 0.0) for sp, a in pos.items() for sn, b in neg.items())
    return conc, sum(pos.values()) * sum(neg.values())


def simular_auc(tabla, puntaje, lo, hi, fuente=None, semilla=SEMILLA_DESEMPATE):
    """Como `cupo.simular`, más el AUC dentro de cada día con todos sus VIN."""
    fuente = fuente or fuente_completa(tabla)
    filas, auc = [], []
    for t, vins in tabla.por_dia(lo, hi).items():
        tasas = puntaje.puntuar(_contexto(fuente, puntaje, t), sorted({v.codigo for v in vins}))
        k = cupo(len(vins))
        elegidos = seleccionar(vins, tasas, k, semilla_dia(semilla, t))
        filas.append((t, len(vins), k, sum(v.calibrada for v in vins), sum(v.calibrada for v in elegidos)))
        auc.append(_auc_dia(vins, tasas, lambda v: v.codigo))
    return diario(filas), np.array(auc, dtype=float)


def _auc(a, idx=None):
    if idx is None:
        return float(a[:, 0].sum() / a[:, 1].sum())
    return a[idx, 0].sum(-1) / a[idx, 1].sum(-1)


def _rango(x):
    return [float(np.percentile(x, 2.5)), float(np.percentile(x, 97.5))]


def _registro(d, a, idx):
    m = metricas(d, idx)
    return {"aciertos": m["calibrada_elegidas"], "elegidos": m["elegidos"], "vins": m["vins"], "dias": m["dias"],
            "precision_cupo": m["precision_cupo"], "precision_rango95": m["precision_rango95"],
            "azar_mismo_cupo": m["azar_mismo_cupo"], "veces_azar": m["veces_azar"], "auc_dia": _auc(a),
            "auc_dia_rango95": _rango(_auc(a, idx))}


def _concatenar(partes):
    ds, aucs = zip(*partes)
    filas = np.concatenate([np.stack([d.dias, d.n, d.k, d.cal, d.cal_elegidas], 1) for d in ds])
    return diario(filas.tolist()), np.concatenate(aucs)


def comparar(tabla, fabricas, bloques, nuevo, referencias):
    """Evalúa cada alternativa en los bloques (concatenados) y las diferencias pareadas del nuevo contra cada una."""
    fuente = fuente_completa(tabla)
    sims = {nombre: _concatenar([simular_auc(tabla, crear(a, b), a, b, fuente) for a, b in bloques])
            for nombre, crear in fabricas.items()}
    idx = remuestreos(len(next(iter(sims.values()))[0].dias))
    salida = {"bloques": [list(b) for b in bloques], "alternativas": {n: _registro(d, a, idx) for n, (d, a) in sims.items()},
              "diferencias": {}}
    for ref in referencias:
        salida["diferencias"][f"{nuevo} − {ref}"] = {
            "precision_rango95": diferencia(sims[ref][0], sims[nuevo][0], idx),
            "auc_dia_rango95": _rango(_auc(sims[nuevo][1], idx) - _auc(sims[ref][1], idx))}
    return salida


def simular_playa(tabla, puntaje, lo, hi, permanencia, fuente=None, semilla=SEMILLA_DESEMPATE):
    """El cupo de cada día se elige entre los VIN de los últimos `permanencia` días todavía no elegidos."""
    fuente = fuente or fuente_completa(tabla)
    por_dia = tabla.por_dia(lo - permanencia, hi)
    playa, filas = [], []
    for t in range(lo - permanencia, hi + 1):
        llegan = por_dia.get(t, [])
        playa = [v for v in playa if v.dia >= t - permanencia] + llegan
        if t < lo or not llegan:
            continue
        tasas = puntaje.puntuar(_contexto(fuente, puntaje, t), sorted({v.codigo for v in playa}))
        elegidos = seleccionar(playa, tasas, cupo(len(llegan)), semilla_dia(semilla, t))
        fuera = {v.vin for v in elegidos}
        playa = [v for v in playa if v.vin not in fuera]
        filas.append((t, len(llegan), cupo(len(llegan)), sum(v.calibrada for v in llegan),
                      sum(v.calibrada for v in elegidos)))
    return diario(filas)


def estructura(tabla):
    """Heterogeneidad entre códigos, estabilidad del riesgo relativo, agrupamiento por día y rotación de la mezcla."""
    from scipy import optimize
    from scipy.special import betaln, expit, logit
    vis = [v for v in tabla.vins if v.dia < 195]
    salida = {"heterogeneidad": [], "estabilidad": [], "rotacion": []}
    conteos = {}
    for lo, hi in PERIODOS:
        c = collections.defaultdict(lambda: [0, 0])
        for v in vis:
            if lo <= v.dia <= hi:
                c[v.codigo][0] += 1
                c[v.codigo][1] += v.calibrada
        conteos[(lo, hi)] = dict(c)
        n, y = np.array([x[0] for x in c.values()], float), np.array([x[1] for x in c.values()], float)

        def nll(p):
            m, s = expit(p[0]), np.exp(p[1])
            return -np.sum(betaln(y + m * s, n - y + (1 - m) * s) - betaln(m * s, (1 - m) * s))
        r = optimize.minimize(nll, [logit(y.sum() / n.sum()), 3.0], method="Nelder-Mead")
        m, s = float(expit(r.x[0])), float(np.exp(r.x[1]))
        salida["heterogeneidad"].append({"dias": [lo, hi], "vins": int(n.sum()), "codigos": len(n), "tasa": m,
                                         "desvio_entre_codigos": float(np.sqrt(m * (1 - m) / (s + 1)))})
    for i, a in enumerate(PERIODOS):
        for b in PERIODOS[i + 1:]:
            A, B = conteos[a], conteos[b]
            oa = sum(x[1] for x in A.values()) / sum(x[0] for x in A.values())
            ob = sum(x[1] for x in B.values()) / sum(x[0] for x in B.values())
            comunes = [c for c in A if c in B and A[c][0] >= 60 and B[c][0] >= 60]
            if len(comunes) < 4:
                salida["estabilidad"].append({"periodos": [list(a), list(b)], "codigos_comunes": len(comunes)})
                continue

            def lor(x, o):
                p = (x[1] + .5) / (x[0] + 1)
                return np.log(p / (1 - p)) - np.log(o / (1 - o)), 1 / (x[1] + .5) + 1 / (x[0] - x[1] + .5)
            xa, xb = np.array([lor(A[c], oa) for c in comunes]), np.array([lor(B[c], ob) for c in comunes])
            va, vb = np.var(xa[:, 0]) - xa[:, 1].mean(), np.var(xb[:, 0]) - xb[:, 1].mean()
            cov = np.cov(xa[:, 0], xb[:, 0], ddof=0)[0, 1]
            salida["estabilidad"].append({
                "periodos": [list(a), list(b)], "codigos_comunes": len(comunes),
                "correlacion_observada": float(np.corrcoef(xa[:, 0], xb[:, 0])[0, 1]),
                "correlacion_desatenuada": float(cov / np.sqrt(va * vb)) if va > 0 and vb > 0 else None})
    # Agrupamiento por día dentro del código (Pearson): la tasa de referencia sale de ±15 días sin el propio día.
    por_codigo = collections.defaultdict(lambda: collections.defaultdict(lambda: [0, 0]))
    for v in vis:
        por_codigo[v.codigo][v.dia][0] += 1
        por_codigo[v.codigo][v.dia][1] += v.calibrada
    x2, celdas = 0.0, 0
    for dias in por_codigo.values():
        for d, (n, y) in dias.items():
            vecinos = [dias[e] for e in dias if e != d and abs(e - d) <= 15]
            N, Y = sum(x[0] for x in vecinos), sum(x[1] for x in vecinos)
            if N < 30 or n < 2 or Y in (0, N):
                continue
            p = Y / N
            x2 += (y - n * p) ** 2 / (n * p * (1 - p))
            celdas += 1
    salida["agrupamiento_codigo_dia"] = {"celdas": celdas, "phi": x2 / celdas}
    # Rotación de la mezcla: conteos de VIN por código, sin etiquetas (también en la prueba final).
    tramos = (*PERIODOS, (200, 260))
    por_tramo = {t: collections.Counter(v.codigo for v in tabla.vins if t[0] <= v.dia <= t[1]) for t in tramos}
    for t in tramos:
        total = sum(por_tramo[t].values())
        salida["rotacion"].append({"dias": list(t), "vins": total, "codigos": len(por_tramo[t]),
                                   "pct_vins_con_codigo_presente_en": {
                                       f"{u[0]}-{u[1]}": sum(n for c, n in por_tramo[t].items() if c in por_tramo[u]) / total
                                       for u in tramos}})
    return salida


def estabilidad_ranking():
    """Correlación entre el orden en selección y en confirmación de las alternativas de `precision.json`."""
    from scipy.stats import spearmanr
    ranking = json.loads((RAIZ / "solucion" / "resultados" / "precision.json").read_text())["ranking"]
    elegibles = [r for r in ranking if r["elegible"]]
    sel = [r["calibrada_elegidas_seleccion"] for r in elegibles]
    conf = [r["confirmacion"]["calibrada_elegidas"] for r in elegibles]
    rho = spearmanr(sel, conf)
    primeras = sorted(elegibles, key=lambda r: -r["calibrada_elegidas_seleccion"])[:10]
    return {"alternativas": len(elegibles), "spearman": float(rho.statistic), "p_valor": float(rho.pvalue),
            "primeras_10": [{"alternativa": r["alternativa"], "seleccion": r["calibrada_elegidas_seleccion"],
                             "confirmacion": r["confirmacion"]["calibrada_elegidas"]} for r in primeras]}


def senal_vin(tabla, mercados, entrenamiento=(100, 149), evaluacion=VALIDACION):
    """¿Agrega señal el historial QLS del VIN (supuesto A: todos sus eventos) dentro del día, sobre el código?

    LightGBM con hiperparámetros fijos, sin ajuste en evaluación. El vocabulario se aprende en entrenamiento. La
    disponibilidad del historial desde la playa no está acreditada.
    """
    import lightgbm as lgb
    fuente = fuente_completa(tabla)
    sir = RiesgoEstandarizado(60, 10, mercados)
    cache = {}

    def log_rr(v):
        if v.dia not in cache:
            cache[v.dia] = sir.riesgos(Contexto(fuente, v.dia))
        rr, rr_m, _ = cache[v.dia]
        return float(np.log(rr.get(v.codigo, rr_m.get(mercados.get(v.codigo), 1.0))))
    tr = [v for v in tabla.vins if entrenamiento[0] <= v.dia <= entrenamiento[1]]
    ev = [v for v in tabla.vins if evaluacion[0] <= v.dia <= evaluacion[1]]
    vocabulario = collections.Counter(x for v in tr for _, fichas in tabla.eventos.get(v.vin, ()) for x in set(fichas))
    top = {x: i for i, (x, n) in enumerate(vocabulario.most_common(300)) if n >= 200}

    def fila(v):
        h = tabla.historial[v.vin]
        conteo = np.zeros(len(top))
        for _, fichas in tabla.eventos.get(v.vin, ()):
            for x in fichas:
                if x in top:
                    conteo[top[x]] += 1
        nan = float("nan")
        return np.concatenate([[log_rr(v), h.eventos, h.incidencias_distintas,
                                nan if h.reparacion_media is None else h.reparacion_media,
                                nan if h.reparacion_max is None else h.reparacion_max, h.dias_primero_ultimo,
                                nan if v.primera is None else v.dia - v.primera], conteo])
    xtr, ytr = np.array([fila(v) for v in tr]), np.array([v.calibrada for v in tr], int)
    xev = np.array([fila(v) for v in ev])
    params = dict(objective="binary", learning_rate=0.03, num_leaves=15, min_child_samples=200, feature_fraction=0.7,
                  bagging_fraction=0.8, bagging_freq=1, lambda_l2=10, verbose=-1, seed=SEMILLA_LGBM, num_threads=1,
                  deterministic=True, force_row_wise=True)
    variantes = {"solo código (riesgo estandarizado)": xev[:, 0]}
    for nombre, cols in (("código + historial QLS", slice(None)), ("solo historial QLS", slice(1, None))):
        modelo = lgb.train(params, lgb.Dataset(xtr[:, cols], ytr), num_boost_round=400)
        variantes[nombre] = np.round(modelo.predict(xev[:, cols]), 6)  # LightGBM varía en la 7.ª cifra entre corridas.
    por_dia = collections.defaultdict(list)
    for i, v in enumerate(ev):
        por_dia[v.dia].append(i)
    dias = sorted(por_dia)
    idx = remuestreos(len(dias))
    sims = {}
    for nombre, p in variantes.items():
        filas, auc = [], []
        for d in dias:
            vins = [ev[i] for i in por_dia[d]]
            puntos = {ev[i].vin: float(p[i]) for i in por_dia[d]}
            elegidos = seleccionar(vins, puntos, cupo(len(vins)), semilla_dia(SEMILLA_DESEMPATE, d), por_vin=True)
            filas.append((d, len(vins), cupo(len(vins)), sum(v.calibrada for v in vins),
                          sum(v.calibrada for v in elegidos)))
            auc.append(_auc_dia(vins, puntos, lambda v: v.vin))
        sims[nombre] = (diario(filas), np.array(auc, dtype=float))
    base, extra = sims["solo código (riesgo estandarizado)"], sims["código + historial QLS"]
    return {"entrenamiento": list(entrenamiento), "evaluacion": list(evaluacion), "variables": int(xtr.shape[1]),
            "vins_entrenamiento": len(tr), "supuesto": "A: todos los eventos QLS del VIN; disponibilidad no acreditada",
            "alternativas": {n: _registro(d, a, idx) for n, (d, a) in sims.items()},
            "historial_menos_codigo": {"precision_rango95": diferencia(base[0], extra[0], idx),
                                       "auc_dia_rango95": _rango(_auc(extra[1], idx) - _auc(base[1], idx))}}


def correr(tabla):
    assert not tabla.desbloqueada, "Este experimento no relee la prueba final"
    mercados = {c: a.get("mercado") for c, a in tabla.catalogo.items()}
    atributos = atributos_de(tabla.catalogo)
    criterio = {"riesgo_estandarizado": [], "olvido_mercado": []}
    for vida, kappa in GRILLA_SIR:
        p = RiesgoEstandarizado(vida, kappa, mercados)
        criterio["riesgo_estandarizado"].append({"vida": vida, "kappa": kappa, "log_loss": log_loss_secuencial(tabla, p)})
    for vida, kappa in GRILLA_OLVIDO:
        p = OlvidoMercado(vida, kappa, mercados)
        criterio["olvido_mercado"].append({"vida": vida, "kappa": kappa, "log_loss": log_loss_secuencial(tabla, p)})
    elegido_sir = min(criterio["riesgo_estandarizado"], key=lambda r: r["log_loss"])
    elegido_olvido = min(criterio["olvido_mercado"], key=lambda r: r["log_loss"])
    sir = lambda margen=MARGEN: RiesgoEstandarizado(elegido_sir["vida"], elegido_sir["kappa"], mercados, margen)  # noqa: E731
    olvido = OlvidoMercado(elegido_olvido["vida"], elegido_olvido["kappa"], mercados)
    nuevo, nuevo2 = sir().nombre, olvido.nombre
    comunes = {"azar": lambda a, b: R.Azar(),
               "jerárquico 60 d, peso 20": lambda a, b: R.Jerarquico(60, 20, atributos),
               "móvil 120 d hacia el mercado, peso 20": lambda a, b: R.MovilMercado(120, 20, mercados),
               nuevo: lambda a, b: sir(), nuevo2: lambda a, b: olvido}
    referencias = ("jerárquico 60 d, peso 20", "móvil 120 d hacia el mercado, peso 20")
    fija_val = {"tasa fija (<= 149)": lambda a, b: R.TasaFija()}
    fija_bloque = {"tasa fija (reajustada al inicio de cada bloque)": lambda a, b: R.TasaFija(hasta=a - 6)}
    tramos = {
        "validación 155–194": comparar(tabla, {**comunes, **fija_val, "oráculo (no elegible)": lambda a, b: R.Oraculo(a, b)},
                                       [VALIDACION], nuevo, (*fija_val, *referencias)),
        "selección 100–174": comparar(tabla, {**comunes, **fija_bloque, "oráculo (no elegible)": lambda a, b: R.Oraculo(a, b)},
                                      BLOQUES_SELECCION, nuevo, (*fija_bloque, *referencias)),
        "confirmación 175–194": comparar(tabla, {**comunes, **fija_bloque, "oráculo (no elegible)": lambda a, b: R.Oraculo(a, b)},
                                         [CONFIRMACION], nuevo, (*fija_bloque, *referencias)),
    }
    fuente = fuente_completa(tabla)
    palancas = {"margen": {}, "playa": {}}
    for nombre, (lo, hi) in {"validación 155–194": VALIDACION, "100–194": (100, 194)}.items():
        idx = remuestreos(len(tabla.por_dia(lo, hi)))
        palancas["margen"][nombre] = {m: _registro(*simular_auc(tabla, sir(m), lo, hi, fuente), idx) for m in (1, 2, 3, 5, 10)}
        palancas["playa"][nombre] = {}
        for etiqueta, p in (("riesgo estandarizado", sir()), ("azar", R.Azar())):
            palancas["playa"][nombre][etiqueta] = {}
            for permanencia in (0, 1, 2, 3):
                m = metricas(simular_playa(tabla, p, lo, hi, permanencia, fuente), idx)
                palancas["playa"][nombre][etiqueta][permanencia] = {
                    k: m[k] for k in ("calibrada_elegidas", "elegidos", "precision_cupo", "precision_rango95")}
    return {"pieza": "opción más precisa (exploratorio)", "tramo": "Día < 195; prueba final no releída",
            "calificador": "entre auditados con actividad QLS, base ficticia; períodos ya explorados",
            "criterio_parametros": {"dias": list(CRITERIO), "metrica": "log-loss secuencial de todos los VIN",
                                    "resultados": criterio, "elegido_riesgo_estandarizado": elegido_sir,
                                    "elegido_olvido_mercado": elegido_olvido},
            "estructura": estructura(tabla), "tramos": tramos, "estabilidad_ranking": estabilidad_ranking(),
            "palancas": palancas, "senal_vin": senal_vin(tabla, mercados),
            "fuente_sha256": tabla.fuente.get("csv_sha256"), "catalogo_sha256": tabla.fuente.get("catalogo_sha256"),
            "version_codigo": version_codigo()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", required=True)
    parser.add_argument("--catalogo", required=True)
    parser.add_argument("--cache", type=Path, default=CACHE)
    parser.add_argument("--salida", type=Path, default=SALIDA, help="JSON con agregados, sin filas individuales")
    opciones = parser.parse_args()
    salida = correr(cargar(opciones.csv, opciones.catalogo, cache=opciones.cache))
    opciones.salida.parent.mkdir(parents=True, exist_ok=True)
    opciones.salida.write_text(json.dumps(salida, indent=2, ensure_ascii=False, allow_nan=False) + "\n")


if __name__ == "__main__":
    main()
