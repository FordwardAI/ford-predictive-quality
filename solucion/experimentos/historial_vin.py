"""¿El historial de eventos del VIN mejora la precisión? Experimento de validación (propuesta del 30/09, #33).

El equipo había excluido el historial (AGENTS.md: la disponibilidad previa exige evidencia) y los experimentos anteriores
lo midieron con AUC en 200–260, que hoy es la prueba final. Acá se reabre como experimento, **sin tocar la prueba**:
bloques de Día < 195 (los mismos de `precision.py`), la métrica que decide (precisión en el cupo del 5 %) y seis formas
de usar el historial. Cada modelo se compara con **su par sin historial** (código + atributos del código).

Disponibilidad no verificada. Se miden dos supuestos, siempre juntos:
- A (optimista): todos los eventos del VIN hasta su Día.
- B (conservador): solo eventos con fecha <= Día del VIN − 5 (Gate Release pasa 0–5 días antes de la auditoría).
Si solo A muestra señal se lee como probable fuga, no como hallazgo.

Criterio fijado antes de correr: «el historial aporta» si, con el supuesto B, el modelo con historial (1) supera a su par
sin historial en la precisión acumulada de los bloques de selección, (2) con el rango del 95 % de la diferencia pareada
por días por encima de 0 y (3) también lo supera en el bloque de confirmación. Si no, el resultado es negativo.

Nunca entran el resultado ni el componente de Auditoría Adicional (`datos.EVENTO_COLUMNAS` es una lista cerrada).
Los modelos no son elegibles: no pasan por el preregistro.
"""
import collections

import numpy as np
import scipy.sparse as sp
from scipy.optimize import minimize

from .. import ml
from ..cupo import diferencia, fuente_completa, remuestreos, resultado, simular
from ..datos import MARGEN, PRUEBA_DESDE
from ..precision import BLOQUES_SELECCION, CONFIRMACION, _etiqueta, _precision, _unir
from ..puntaje import Puntaje, atributos_de, suavizada
from ..datos import EVENTO_COLUMNAS
from ..referencias import Azar, TasaFija

SUPUESTOS = {"A": 0, "B": MARGEN}  # Días de retraso con que un evento queda disponible.
MIN_FICHA = 30  # Una ficha entra si aparece en al menos tantos VIN de entrenamiento.
PESO = 20
SEMILLA = 1
INTERNA = 30  # Días finales del entrenamiento que se reservan para elegir hiperparámetros por log-loss.
MODELOS = ("logistica", "lightgbm", "catboost", "riesgo", "mil_media", "mil_atencion", "ranker")
NOMBRES = {"logistica": "regresión logística", "lightgbm": "LightGBM", "catboost": "CatBoost",
           "riesgo": "riesgo histórico por combinaciones", "mil_media": "MIL con promedio de eventos",
           "mil_atencion": "MIL con atención sobre eventos", "ranker": "LightGBM Ranker (lambdarank por día)"}
ORDEN = {m: i for i, m in enumerate(MODELOS)}


def _base_fichas(v, atributos):
    a = atributos.get(v.codigo)
    fichas = [f"codigo={v.codigo}"]
    if a:
        fichas += [f"mercado={a[0]}", f"motor={a[1]}", f"traccion={a[2]}", f"version={a[3]}", f"celda={a[4]}"]
    return fichas


class Espacio:
    """Representación por VIN: fichas del código (base) y fichas de los eventos disponibles (historial).

    El vocabulario se arma solo con los VIN de entrenamiento (sin etiquetas). `retraso` es el supuesto de
    disponibilidad: un evento cuenta si su fecha <= Día del VIN − retraso.
    """

    def __init__(self, tabla, entrenamiento, atributos, retraso):
        self.tabla, self.atributos, self.retraso = tabla, atributos, retraso
        base = collections.Counter(f for v in entrenamiento for f in _base_fichas(v, atributos))
        self.base = {f: i for i, f in enumerate(sorted(base))}
        hist = collections.Counter(f for v in entrenamiento for f in set(self.fichas(v)))
        self.hist = {f: i for i, f in enumerate(sorted(f for f, n in hist.items() if n >= MIN_FICHA))}

    def eventos(self, v):
        return [fichas for dia, fichas in self.tabla.eventos[v.vin] if dia <= v.dia - self.retraso]

    def fichas(self, v):
        return [f for evento in self.eventos(v) for f in evento]

    @staticmethod
    def _csr(filas, columnas):
        indptr, indices = [0], []
        for fila in filas:
            indices.extend(fila)
            indptr.append(len(indices))
        return sp.csr_matrix((np.ones(len(indices), dtype=np.float32), np.array(indices, dtype=np.int32),
                              np.array(indptr, dtype=np.int32)), shape=(len(filas), columnas))

    def matriz_base(self, vins):
        return self._csr([sorted({self.base[f] for f in _base_fichas(v, self.atributos) if f in self.base})
                          for v in vins], len(self.base))

    def matriz_historial(self, vins):
        """Presencia de cada ficha + log(1 + eventos) y log(1 + fichas distintas)."""
        filas, agregados = [], []
        for v in vins:
            eventos = self.eventos(v)
            fichas = {f for e in eventos for f in e}
            filas.append(sorted({self.hist[f] for f in fichas if f in self.hist}))
            agregados.append([np.log1p(len(eventos)), np.log1p(len(fichas))])
        return sp.hstack([self._csr(filas, len(self.hist)), sp.csr_matrix(np.array(agregados, dtype=np.float32))],
                         format="csr")

    def matriz_eventos(self, vins):
        """Una fila por evento (fichas en el vocabulario) y el índice del VIN dueño."""
        filas, dueno = [], []
        for i, v in enumerate(vins):
            for evento in self.eventos(v):
                filas.append(sorted({self.hist[f] for f in evento if f in self.hist}))
                dueno.append(i)
        return self._csr(filas, len(self.hist)), np.array(dueno, dtype=int)


def _log_loss(y, p):
    p = np.clip(p, 1e-6, 1 - 1e-6)
    return float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)))


def _sigmoide(z):
    return 1.0 / (1.0 + np.exp(-np.clip(z, -30, 30)))


# --- MIL: cada evento aporta un puntaje y se agregan con promedio o atención ----------------------------------------


class Mil:
    """Logit del VIN = base lineal + Σ_e a_e · s_e, con s_e = w·x_e y a_e = promedio o softmax(v·x_e) dentro del VIN."""

    def __init__(self, atencion, lam_base=1.0, lam_evento=10.0):
        self.atencion, self.lam_base, self.lam_evento = atencion, lam_base, lam_evento

    def _agregar(self, theta, E, dueno, n):
        h = E.shape[1]
        w = theta[:h]
        s = E @ w
        if not len(dueno):
            return s, np.zeros(0), np.zeros(n)
        if self.atencion:
            g = E @ theta[h:2 * h]
            maximo = np.full(n, -np.inf)
            np.maximum.at(maximo, dueno, g)
            ex = np.exp(g - maximo[dueno])
            a = ex / np.bincount(dueno, ex, n)[dueno]
        else:
            a = 1.0 / np.bincount(dueno, minlength=n)[dueno]
        return s, a, np.bincount(dueno, a * s, n)

    def _partes(self, Xb, E):
        h = E.shape[1]
        return Xb.shape[1], h, (2 * h if self.atencion else h)

    def objetivo(self, theta, Xb, E, dueno, y):
        """(pérdida, gradiente) del promedio de log-loss más la regularización L2."""
        n = len(y)
        pb, h, ne = self._partes(Xb, E)
        u, b0, te = theta[:pb], theta[pb], theta[pb + 1:]
        s, a, agg = self._agregar(te, E, dueno, n)
        p = _sigmoide(Xb @ u + b0 + agg)
        perdida = _log_loss(y, p) + (self.lam_base * u @ u + self.lam_evento * te @ te) / (2 * n)
        r = (p - y) / n
        gu = Xb.T @ r + self.lam_base * u / n
        gte = np.zeros(ne)
        if len(dueno):
            re = r[dueno]
            gte[:h] = E.T @ (re * a)
            if self.atencion:
                gte[h:] = E.T @ (re * a * (s - agg[dueno]))
        gte += self.lam_evento * te / n
        return perdida, np.concatenate([gu, [r.sum()], gte])

    def ajustar(self, Xb, E, dueno, y):
        pb, h, ne = self._partes(Xb, E)
        self.theta = minimize(self.objetivo, np.zeros(pb + 1 + ne), args=(Xb, E, dueno, y), jac=True,
                              method="L-BFGS-B", options={"maxiter": 200}).x
        return self

    def predecir(self, Xb, E, dueno):
        pb, h, ne = self._partes(Xb, E)
        u, b0, te = self.theta[:pb], self.theta[pb], self.theta[pb + 1:]
        _, _, agg = self._agregar(te, E, dueno, Xb.shape[0])
        return _sigmoide(Xb @ u + b0 + agg)

    def pesos_de_atencion(self, E, dueno, n):
        """Pesos a_e de cada evento (para las pruebas y el análisis)."""
        return self._agregar(self.theta[self.theta.size - (2 if self.atencion else 1) * E.shape[1]:], E, dueno, n)[1]


# --- Un modelo por VIN con su par sin historial --------------------------------------------------------------------


class ModeloVin(Puntaje):
    """Puntúa cada VIN con un modelo entrenado con los VIN de Día <= hasta (hasta = inicio del bloque − 6).

    `supuesto` None es el par sin historial (código + atributos); "A" y "B" suman el historial del VIN.
    """
    familia, elegible, por_vin = "historial_vin", False, True

    def __init__(self, tabla, modelo, supuesto, hasta, atributos=None, semilla=SEMILLA):
        assert modelo in MODELOS and supuesto in (None, *SUPUESTOS)
        self.tabla, self.modelo, self.supuesto, self.hasta, self.semilla = tabla, modelo, supuesto, hasta, semilla
        self.atributos = atributos if atributos is not None else atributos_de(tabla.catalogo)
        con = "sin historial" if supuesto is None else f"con historial, supuesto {supuesto}"
        self.nombre = f"{NOMBRES[modelo]} {con}"
        self.parametros = {"modelo": modelo, "supuesto": supuesto, "entrenado_hasta": hasta, "semilla": semilla,
                           "disponibilidad": "no verificada" if supuesto else "no usa historial"}
        self.orden = (97, ORDEN[modelo])
        self.puntajes, self._predictor = {}, None

    @property
    def historial(self):
        return self.supuesto is not None

    def _entrenamiento(self):
        return [v for v in self.tabla.vins if v.dia <= self.hasta]

    def puntuar(self, ctx, vins):
        if self._predictor is None:
            assert self.hasta <= ctx.t - MARGEN, "El modelo usaría resultados que el día t todavía no conoce"
            self._predictor = self._ajustar()
        p = self._predictor(vins)
        salida = {v.vin: float(x) for v, x in zip(vins, p)}
        self.puntajes.update(salida)
        return salida

    def _ajustar(self):
        train = self._entrenamiento()
        y = np.array([v.calibrada for v in train], dtype=int)
        espacio = Espacio(self.tabla, train, self.atributos, SUPUESTOS.get(self.supuesto, 0))
        return getattr(self, f"_ajustar_{self.modelo.split('_')[0]}")(espacio, train, y)

    # Matrices ---------------------------------------------------------------------------------------------------

    def _x(self, espacio, vins):
        base = espacio.matriz_base(vins)
        return sp.hstack([base, espacio.matriz_historial(vins)], format="csr") if self.historial else base

    def _partir(self, train):
        corte = self.hasta - INTERNA
        ajuste = [i for i, v in enumerate(train) if v.dia <= corte - MARGEN]
        prueba = [i for i, v in enumerate(train) if v.dia > corte]
        return np.array(ajuste, dtype=int), np.array(prueba, dtype=int)

    def _elegir(self, candidatos, X, y, train, construir):
        """Hiperparámetros por log-loss en los últimos INTERNA días del entrenamiento (nunca por precisión)."""
        ajuste, prueba = self._partir(train)
        mejor = min(candidatos, key=lambda c: _log_loss(
            y[prueba], construir(c).fit(X[ajuste], y[ajuste]).predict_proba(X[prueba])[:, 1]))
        return construir(mejor).fit(X, y)

    # Modelos ----------------------------------------------------------------------------------------------------

    def _ajustar_logistica(self, espacio, train, y):
        from sklearn.linear_model import LogisticRegression
        X = self._x(espacio, train)
        modelo = self._elegir((0.03, 0.3, 3.0), X, y, train, lambda c: LogisticRegression(C=c, max_iter=300))
        return lambda vins: modelo.predict_proba(self._x(espacio, vins))[:, 1]

    def _ajustar_lightgbm(self, espacio, train, y):
        from lightgbm import LGBMClassifier
        X = self._x(espacio, train)
        modelo = self._elegir((4, 12), X, y, train, lambda hojas: LGBMClassifier(
            n_estimators=150, learning_rate=0.05, num_leaves=hojas, min_child_samples=50, colsample_bytree=0.5,
            reg_lambda=10.0, random_state=self.semilla, verbose=-1, n_jobs=4))
        return lambda vins: modelo.predict_proba(self._x(espacio, vins))[:, 1]

    def _ajustar_ranker(self, espacio, train, y):
        from lightgbm import LGBMRanker
        orden = np.argsort([v.dia for v in train], kind="stable")
        X = self._x(espacio, train)[orden]
        dias = [train[i].dia for i in orden]
        grupos = np.array([n for _, n in sorted(collections.Counter(dias).items())])
        modelo = LGBMRanker(objective="lambdarank", n_estimators=150, learning_rate=0.05, num_leaves=8,
                            min_child_samples=50, colsample_bytree=0.5, reg_lambda=10.0, random_state=self.semilla,
                            verbose=-1, n_jobs=4)
        modelo.fit(X, y[orden], group=grupos)
        return lambda vins: modelo.predict(self._x(espacio, vins))

    def _ajustar_catboost(self, espacio, train, y):
        from catboost import CatBoostClassifier
        top = [f for f, _ in collections.Counter(f for v in train for f in set(espacio.fichas(v))).most_common(50)]

        def dense(vins):
            filas = []
            for v in vins:
                a = self.atributos.get(v.codigo) or ("?",) * 5
                fila = [v.codigo, *a]
                if self.historial:
                    fichas = set(espacio.fichas(v))
                    fila += [len(espacio.eventos(v)), len(fichas)] + [float(f in fichas) for f in top]
                filas.append(fila)
            return filas

        categoricas = list(range(6))
        modelo = CatBoostClassifier(iterations=200, depth=4, learning_rate=0.05, l2_leaf_reg=10, random_seed=self.semilla,
                                    verbose=False, thread_count=4, cat_features=categoricas,
                                    allow_writing_files=False)
        modelo.fit(dense(train), y)
        return lambda vins: modelo.predict_proba(dense(vins))[:, 1]

    def _ajustar_riesgo(self, espacio, train, y):
        """Tasa del código (hacia su celda y la general) + desvío medio de sus pares (código × ficha)."""
        general = y.mean()
        celdas = collections.defaultdict(lambda: [0.0, 0.0])
        codigos = collections.defaultdict(lambda: [0.0, 0.0])
        pares = collections.defaultdict(lambda: [0.0, 0.0])
        for v, cal in zip(train, y):
            celda = (self.atributos.get(v.codigo) or (None,) * 5)[4]
            for tabla_, clave in ((celdas, celda), (codigos, v.codigo)):
                tabla_[clave][0] += 1
                tabla_[clave][1] += cal
            if self.historial:
                for f in set(espacio.fichas(v)):
                    pares[(v.codigo, f)][0] += 1
                    pares[(v.codigo, f)][1] += cal
        tasa_celda = {k: suavizada(n, c, general, PESO) for k, (n, c) in celdas.items()}

        def tasa_codigo(codigo):
            previa = tasa_celda.get((self.atributos.get(codigo) or (None,) * 5)[4], general)
            n, c = codigos.get(codigo, (0.0, 0.0))
            return suavizada(n, c, previa, PESO)

        def predecir(vins):
            salida = []
            for v in vins:
                base = tasa_codigo(v.codigo)
                desvios = []
                if self.historial:
                    for f in set(espacio.fichas(v)):
                        n, c = pares.get((v.codigo, f), (0.0, 0.0))
                        desvios.append(suavizada(n, c, base, PESO) - base)
                salida.append(base + (float(np.mean(desvios)) if desvios else 0.0))
            return np.array(salida)
        return predecir

    def _ajustar_mil(self, espacio, train, y):
        if not self.historial:  # Sin eventos, el MIL es la regresión logística sobre la base.
            from sklearn.linear_model import LogisticRegression
            Xb = espacio.matriz_base(train)
            modelo = LogisticRegression(C=1.0, max_iter=300).fit(Xb, y)
            return lambda vins: modelo.predict_proba(espacio.matriz_base(vins))[:, 1]
        atencion = self.modelo == "mil_atencion"
        Xb, (E, dueno) = espacio.matriz_base(train), espacio.matriz_eventos(train)
        ajuste, prueba = self._partir(train)

        def recortar(filas):
            nuevo = {f: i for i, f in enumerate(filas)}
            mascara = np.isin(dueno, filas)
            return Xb[filas], E[mascara], np.array([nuevo[d] for d in dueno[mascara]], dtype=int)

        mejor, mejor_perdida = None, np.inf
        for lam in (10.0, 100.0):
            Xa, Ea, da = recortar(ajuste)
            modelo = Mil(atencion, lam_evento=lam).ajustar(Xa, Ea, da, y[ajuste])
            Xp, Ep, dp = recortar(prueba)
            perdida = _log_loss(y[prueba], modelo.predecir(Xp, Ep, dp))
            if perdida < mejor_perdida:
                mejor, mejor_perdida = lam, perdida
        modelo = Mil(atencion, lam_evento=mejor).ajustar(Xb, E, dueno, y)

        def predecir(vins):
            e, d = espacio.matriz_eventos(vins)
            return modelo.predecir(espacio.matriz_base(vins), e, d)
        return predecir


# --- Evaluación ---------------------------------------------------------------------------------------------------


def _auc(tabla, bloque, puntajes):
    from sklearn.metrics import average_precision_score, roc_auc_score
    vins = [v for lista in tabla.por_dia(*bloque).values() for v in lista]
    y = np.array([v.calibrada for v in vins], dtype=int)
    s = np.array([puntajes[v.vin] for v in vins])
    return {"roc_auc": float(roc_auc_score(y, s)), "pr_auc": float(average_precision_score(y, s)),
            "prevalencia": float(y.mean())}


def clave(modelo, supuesto):
    return f"{modelo}|{supuesto or 'sin'}"


def evaluar_bloques(tabla, bloques, modelos=MODELOS, al_terminar=None):
    """{clave: [Diario por bloque]}, {clave: [AUC por bloque]} y la cobertura del historial de cada supuesto."""
    fuente = fuente_completa(tabla)
    atributos = atributos_de(tabla.catalogo)
    datos, aucs, cobertura = collections.defaultdict(list), collections.defaultdict(list), []
    for a, b in bloques:
        hasta = ml.fin_interno(a)
        fijas = {"azar": Azar(), "tasa_fija": TasaFija(hasta=hasta)}
        for k, p in fijas.items():
            datos[k].append(simular(tabla, p, a, b, fuente))
        for modelo in modelos:
            for supuesto in (None, *SUPUESTOS):
                p = ModeloVin(tabla, modelo, supuesto, hasta, atributos)
                datos[clave(modelo, supuesto)].append(simular(tabla, p, a, b, fuente))
                aucs[clave(modelo, supuesto)].append(_auc(tabla, (a, b), p.puntajes))
        vins = [v for lista in tabla.por_dia(a, b).values() for v in lista]
        cobertura.append({"bloque": [a, b], "vins": len(vins), **{
            f"sin_eventos_{s}": float(np.mean([not any(d <= v.dia - r for d, _ in tabla.eventos[v.vin])
                                               for v in vins])) for s, r in SUPUESTOS.items()}})
        if al_terminar:
            al_terminar(a, b)
    return datos, aucs, cobertura


def analizar(tabla, datos, aucs, bloques_seleccion=BLOQUES_SELECCION, confirmacion=CONFIRMACION):
    n_sel = len(bloques_seleccion)
    sel = {k: _unir(d[:n_sel]) for k, d in datos.items()}
    conf = {k: d[n_sel] for k, d in datos.items()}
    idx_sel, idx_conf = remuestreos(len(sel["azar"].dias)), remuestreos(len(conf["azar"].dias))
    tramo_sel = f"selección {bloques_seleccion[0][0]}–{bloques_seleccion[-1][1]}"
    tramo_conf = f"confirmación {confirmacion[0]}–{confirmacion[1]}"
    salida = {}
    for k in datos:
        if k in ("azar", "tasa_fija"):
            et = _etiqueta("azar" if k == "azar" else "tasa fija (reajustada al inicio de cada bloque)", k, {},
                           (0, 0) if k == "azar" else (1, 0), k == "tasa_fija")
        else:
            modelo, supuesto = k.split("|")
            nombre = f"{NOMBRES[modelo]} " + ("sin historial" if supuesto == "sin" else
                                              f"con historial, supuesto {supuesto}")
            et = _etiqueta(nombre, "historial_vin", {"modelo": modelo, "supuesto": None if supuesto == "sin" else supuesto},
                           (97, ORDEN[modelo]), False)
        r = resultado(et, sel[k], idx_sel, tabla, tramo_sel)
        r["precision_por_bloque"] = [_precision(d) for d in datos[k][:n_sel]]
        r["confirmacion"] = {x: v for x, v in resultado(et, conf[k], idx_conf, tabla, tramo_conf).items()
                             if x in ("precision_cupo", "precision_rango95", "calibrada_elegidas", "elegidos",
                                      "azar_mismo_cupo", "veces_azar", "veces_azar_rango95", "lectura", "calificador")}
        r["diferencia_con_tasa_fija_seleccion_rango95"] = None if k == "tasa_fija" else diferencia(
            sel["tasa_fija"], sel[k], idx_sel)
        r["diferencia_con_tasa_fija_confirmacion_rango95"] = None if k == "tasa_fija" else diferencia(
            conf["tasa_fija"], conf[k], idx_conf)
        r["auc_por_bloque"] = aucs.get(k)
        r["clave"] = k
        salida[k] = r
    comparaciones = []
    for modelo in MODELOS:
        if clave(modelo, None) not in datos:
            continue
        par = clave(modelo, None)
        for supuesto in SUPUESTOS:
            k = clave(modelo, supuesto)
            dif_sel = diferencia(sel[par], sel[k], idx_sel)
            dif_conf = diferencia(conf[par], conf[k], idx_conf)
            gana_sel = _precision(sel[k]) > _precision(sel[par])
            gana_conf = _precision(conf[k]) > _precision(conf[par])
            aporta = bool(gana_sel and dif_sel is not None and dif_sel[0] > 0 and gana_conf)
            comparaciones.append({
                "modelo": NOMBRES[modelo], "clave": modelo, "supuesto": supuesto,
                "precision_seleccion_con_historial": _precision(sel[k]), "precision_seleccion_par": _precision(sel[par]),
                "diferencia_seleccion_rango95": dif_sel, "precision_confirmacion_con_historial": _precision(conf[k]),
                "precision_confirmacion_par": _precision(conf[par]), "diferencia_confirmacion_rango95": dif_conf,
                "auc_medio_con_historial": float(np.mean([x["roc_auc"] for x in aucs[k]])),
                "auc_medio_par": float(np.mean([x["roc_auc"] for x in aucs[par]])),
                "aporta": aporta})
    return salida, comparaciones


def correr(tabla, opciones=None):
    assert not tabla.desbloqueada, "El experimento de historial no relee la prueba final"
    bloques = (*BLOQUES_SELECCION, CONFIRMACION)
    assert all(b <= PRUEBA_DESDE - MARGEN - 1 for _, b in bloques), "Solo Día < 195"
    datos, aucs, cobertura = evaluar_bloques(tabla, bloques, al_terminar=lambda a, b: print(
        f"historial_vin: bloque {a}-{b} listo", flush=True))
    resultados, comparaciones = analizar(tabla, datos, aucs)
    aportan = [c for c in comparaciones if c["aporta"] and c["supuesto"] == "B"]
    solo_a = [c for c in comparaciones if c["aporta"] and c["supuesto"] == "A"
              and not any(x["aporta"] and x["clave"] == c["clave"] and x["supuesto"] == "B" for x in comparaciones)]
    return {"pieza": "Historial del VIN: experimento de validación (propuesta del 30/09, #33)",
            "rotulo": "evaluado en validación (Día < 195); prueba final no releída; disponibilidad no verificada",
            "criterio": __doc__.split("Criterio fijado antes de correr: ")[1].split("\n\nNunca")[0].replace("\n", " "),
            "protocolo": {"bloques_seleccion": [list(b) for b in BLOQUES_SELECCION], "confirmacion": list(CONFIRMACION),
                          "supuestos": {"A": "todos los eventos hasta el Día del VIN",
                                        "B": f"eventos con fecha <= Día del VIN − {MARGEN}"},
                          "modelos_probados": len(MODELOS), "semilla": SEMILLA,
                          "columnas_de_eventos": sorted(EVENTO_COLUMNAS),
                          "predictores_prohibidos": "resultado y componente de Auditoría Adicional"},
            "cobertura_del_historial": cobertura,
            "veredicto": {"aporta_con_supuesto_B": [c["modelo"] for c in aportan],
                          "aporta_solo_con_supuesto_A_probable_fuga": [c["modelo"] for c in solo_a],
                          "lectura": "el historial aporta" if aportan else "resultado negativo: el historial no aporta"},
            "comparaciones": comparaciones, "resultados": sorted(resultados.values(), key=lambda r: r["clave"])}
