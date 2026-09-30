"""Representaciones por VIN de todas las columnas admisibles, solo como experimento de disponibilidad A/B."""
import collections

import numpy as np
import scipy.sparse as sp
from sklearn.feature_extraction import DictVectorizer

from . import ml
from .datos import MISSING, day, table
from .puntaje import atributos_de

EXCLUIDAS = {"VIN", "Auditoría Adicional", "Componente Auditoría Adicional", "Código de Catálogo"}
NUMERICAS = {"Fecha Inspección", "Fecha Reparación", "Hora Inspección", "Hora Reparación"}
POLITICAS = ("natural", "balanceado", "sobremuestreo", "sintetico")


def leer_eventos(csv, tabla):
    permitidos = {v.vin for v in tabla.vins if v.dia < 195}
    filas = table(csv)
    next(filas)
    cabecera = next(filas)
    columnas = [h for h in cabecera if h not in EXCLUIDAS]
    eventos = collections.defaultdict(list)
    for fila in filas:
        r = dict(zip(cabecera, fila))
        if r["VIN"] not in permitidos:
            continue
        fechas = [d for h in ("Fecha Inspección", "Fecha Reparación") if (d := day(r[h])) is not None]
        if fechas:
            eventos[r["VIN"]].append((max(fechas), {h: r[h].strip() for h in columnas}))
    return columnas, eventos


def grupo(columna):
    if columna in NUMERICAS:
        return "tiempos"
    if columna.startswith("Rep") or columna == "Código de Reparador":
        return "reparaciones"
    return "inspeccion"


def fichas(v, eventos, columnas, atributos, retraso):
    d = {"base|codigo=" + v.codigo: 1.}
    d.update({f"base|atributo_{i}={a}": 1. for i, a in enumerate(atributos.get(v.codigo, ()))})
    filas = [r for dia, r in eventos[v.vin] if dia <= v.dia - retraso]
    for h in columnas:
        valores = [r[h] for r in filas if r[h] not in MISSING]
        p = h + "|"
        d[p + "eventos"] = len(filas)
        d[p + "nulos"] = len(filas) - len(valores)
        d[p + "distintos"] = len(set(valores))
        if h in NUMERICAS:
            xs = [day(x) - v.dia if h.startswith("Fecha") else float(x.replace(",", ".")) for x in valores]
            if xs:
                d.update({p + "media": float(np.mean(xs)), p + "min": min(xs), p + "max": max(xs),
                          p + "span": max(xs) - min(xs)})
        else:
            d.update({p + "valor=" + x: float(n) for x, n in collections.Counter(valores).items()})
    return d


def espacio(tabla, eventos, columnas, train, evaluados, retraso):
    atributos = atributos_de(tabla.catalogo)
    ft = [fichas(v, eventos, columnas, atributos, retraso) for v in train]
    # El vocabulario se aprende únicamente en entrenamiento. Se conservan las 50 categorías más frecuentes por campo.
    frecuencias = collections.Counter(k for fila in ft for k in fila if "|valor=" in k)
    admitidas = set()
    for h in columnas:
        candidatas = [(n, k) for k, n in frecuencias.items() if k.startswith(h + "|valor=")]
        admitidas.update(k for n, k in sorted(candidatas, reverse=True)[:50] if n >= 30)

    def filtrar(fila):
        return {k: x for k, x in fila.items() if "|valor=" not in k or k in admitidas}

    dv = DictVectorizer()
    X = dv.fit_transform([filtrar(f) for f in ft]).tocsr()
    Z = dv.transform([filtrar(fichas(v, eventos, columnas, atributos, retraso)) for v in evaluados]).tocsr()
    nombres = dv.get_feature_names_out()
    base = np.array([i for i, n in enumerate(nombres) if n.startswith("base|")], dtype=int)
    por_columna = {h: np.array([i for i, n in enumerate(nombres) if n.startswith(h + "|")], dtype=int)
                   for h in columnas}
    numericas = np.array([i for i, n in enumerate(nombres) if any(n.startswith(h + "|") for h in NUMERICAS)
                         and n.rsplit("|", 1)[-1] in ("media", "min", "max", "span")], dtype=int)
    return X, Z, base, por_columna, numericas


def aumentar(X, y, codigos, numericas, politica, semilla):
    """Entrenamiento solamente: ponderación, bootstrap o interpolación numérica entre positivos del mismo código."""
    if politica not in POLITICAS:
        raise ValueError("Política de aumento desconocida")
    y = np.asarray(y)
    if politica == "natural":
        return X, y, np.ones(len(y))
    if politica == "balanceado":
        n = np.bincount(y, minlength=2)
        return X, y, np.array([len(y) / (2 * max(1, n[a])) for a in y])
    rng = np.random.default_rng(semilla)
    positivos = np.flatnonzero(y == 1)
    cantidad = max(0, int((y == 0).sum()) - len(positivos))
    if not len(positivos) or not cantidad:
        return X, y, np.ones(len(y))
    donantes = rng.choice(positivos, cantidad, replace=True)
    extra = X[donantes].copy()
    if politica == "sintetico" and len(numericas):
        grupos = collections.defaultdict(list)
        for i in positivos:
            grupos[codigos[i]].append(i)
        pares = np.array([rng.choice(grupos[codigos[i]]) for i in donantes])
        w = rng.random((cantidad, 1))
        valores = w * X[donantes][:, numericas].toarray() + (1 - w) * X[pares][:, numericas].toarray()
        # Las columnas categóricas se copian completas del donante; no se inventan categorías ni códigos nuevos.
        extra = extra.tolil()
        extra[:, numericas] = valores
        extra = extra.tocsr()
    return sp.vstack([X, extra], format="csr"), np.concatenate([y, np.ones(cantidad, dtype=y.dtype)]), \
        np.ones(len(y) + cantidad)


def estimador(nombre, semilla, multiclass=False):
    if nombre == "logistica":
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import make_pipeline
        from sklearn.preprocessing import StandardScaler
        return make_pipeline(StandardScaler(with_mean=False), LogisticRegression(C=.1, max_iter=2000))
    if nombre == "catboost":
        from catboost import CatBoostClassifier
        return CatBoostClassifier(iterations=200, depth=4, learning_rate=.05, l2_leaf_reg=10,
                                  loss_function="MultiClass" if multiclass else "Logloss",
                                  random_seed=semilla, verbose=False, thread_count=4, allow_writing_files=False)
    if nombre == "lightgbm":
        from lightgbm import LGBMClassifier
        return LGBMClassifier(n_estimators=150, learning_rate=.05, num_leaves=8, min_child_samples=50,
                              colsample_bytree=.5, reg_lambda=10, random_state=semilla, verbose=-1, n_jobs=4)
    if nombre == "xgboost":
        return ml._xgboost({"reg_lambda": 10}, semilla)
    if nombre == "rf":
        return ml._rf({"min_samples_leaf": 50}, semilla)
    raise ValueError(nombre)


def ajustar_predecir(nombre, X, Z, y, pesos, semilla, objetivo_conjunto=False):
    if nombre == "catboost":
        X, Z = X.copy(), Z.copy()
        for matriz in (X, Z):
            matriz.indices = matriz.indices.astype(np.int32)
            matriz.indptr = matriz.indptr.astype(np.int32)
    modelo = estimador(nombre, semilla, objetivo_conjunto)
    kw = {"logisticregression__sample_weight" if nombre == "logistica" else "sample_weight": pesos}
    modelo.fit(X, y, **kw)
    pred = modelo.predict_proba(Z)
    if objetivo_conjunto:
        ok = list(modelo.classes_).index("OK")
        return 1 - pred[:, ok]
    return pred[:, 1]


def predicciones_bloque(tabla, eventos, columnas, a, b, semilla=1):
    train = [v for v in tabla.vins if v.dia <= a - 6]
    evaluados = [v for vs in tabla.por_dia(a, b).values() for v in vs]
    y = np.array([v.calibrada for v in train], dtype=int)
    codigos = [v.codigo for v in train]
    salida, cobertura = {}, {}
    for supuesto, retraso in (("A", 0), ("B", 5)):
        X, Z, base, por_col, nums = espacio(tabla, eventos, columnas, train, evaluados, retraso)
        cobertura[supuesto] = {"sin_eventos": sum(not any(d <= v.dia - retraso for d, _ in eventos[v.vin])
                                                  for v in evaluados), "vins": len(evaluados), "rasgos": X.shape[1]}
        grupos = {"base": base, "todas": np.arange(X.shape[1])}
        for h, inds in por_col.items():
            grupos["columna:" + h] = np.concatenate([base, inds])
        for g in ("tiempos", "reparaciones", "inspeccion"):
            partes = [inds for h, inds in por_col.items() if grupo(h) == g]
            indices = np.concatenate(partes) if partes else np.array([], dtype=int)
            grupos["grupo:" + g] = np.concatenate([base, indices])
            grupos["sin:" + g] = np.setdiff1d(np.arange(X.shape[1]), indices)
        for clave, indices in grupos.items():
            salida[f"campos_{supuesto}|logistica|{clave}|natural"] = ajustar_predecir(
                "logistica", X[:, indices], Z[:, indices], y, np.ones(len(y)), semilla)
        for nombre in ("catboost", "lightgbm", "xgboost", "rf"):
            for clave in ("base", "todas"):
                inds = grupos[clave]
                salida[f"campos_{supuesto}|{nombre}|{clave}|natural"] = ajustar_predecir(
                    nombre, X[:, inds], Z[:, inds], y, np.ones(len(y)), semilla)
        selector = estimador("logistica", semilla).fit(X, y)
        coef = np.abs(selector[-1].coef_[0])
        orden = sorted(columnas, key=lambda h: (-float(coef[por_col[h]].sum()), h))
        for n in (5, 10, 20):
            inds = np.concatenate([base, *(por_col[h] for h in orden[:n])])
            for nombre in ("logistica", "catboost", "lightgbm"):
                salida[f"campos_{supuesto}|{nombre}|top{n}|natural"] = ajustar_predecir(
                    nombre, X[:, inds], Z[:, inds], y, np.ones(len(y)), semilla)
        for politica in POLITICAS[1:]:
            XX, yy, ww = aumentar(X, y, codigos, nums, politica, semilla)
            for nombre in ("logistica", "catboost", "lightgbm"):
                p = ajustar_predecir(nombre, XX, Z, yy, ww, semilla)
                salida[f"campos_{supuesto}|{nombre}|todas|{politica}"] = p
                previa, aumentada = y.mean(), np.average(yy, weights=ww)
                razon = (previa / (1 - previa)) / (aumentada / (1 - aumentada))
                salida[f"campos_{supuesto}|{nombre}|todas|{politica}_prior"] = razon * p / (1 - p + razon * p)
        if supuesto == "A":  # El objetivo es posterior; los predictores de este control son solo catálogo y atributos.
            yc = np.array([v.componente or "CALIBRADA_SIN_COMPONENTE" if v.calibrada else "OK" for v in train])
            for nombre in ("logistica", "catboost", "lightgbm"):
                salida[f"conjunto|{nombre}"] = ajustar_predecir(nombre, X[:, base], Z[:, base], yc,
                                                              np.ones(len(y)), semilla, True)
        print(f"columnas: bloque {a}–{b}, supuesto {supuesto}, {len(salida)} variantes", flush=True)
    return salida, evaluados, cobertura
