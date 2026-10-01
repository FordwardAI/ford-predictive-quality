"""Búsqueda finita amplia de modelos, columnas y ensembles; todos los resultados son exploratorios."""
import collections
import hashlib
import itertools
import pickle
from pathlib import Path

import numpy as np
from scipy.special import expit, logit
from scipy.stats import rankdata
from sklearn.linear_model import LogisticRegression
from threadpoolctl import threadpool_limits

from . import columnas
from .. import ml
from ..cupo import (SEMILLA_DESEMPATE, cupo, diario, diferencia, fuente_completa, metricas, remuestreos,
                  seleccionar, version_codigo)
from ..datos import MARGEN
from .historial_vin import MODELOS, ModeloVin
from ..precision import BLOQUES_SELECCION, CONFIRMACION, grupos_del_bloque
from ..puntaje import Contexto, atributos_de, semilla_dia

CALIBRACION = (70, 94)
PESOS_PARES = tuple(i / 10 for i in range(1, 10))
LOTE = 256


def modelos_bloque(tabla, fuente, a, semilla):
    grupos = grupos_del_bloque(tabla, fuente, a, a + 1, con_ml=False)
    modelos = {k: x[0][0] for k, x in grupos.items() if k not in ("azar", "oraculo")}
    ajustes = {}
    atributos = atributos_de(tabla.catalogo)
    for con_atributos in (False, True):
        ats = atributos if con_atributos else None
        bases = {}
        for modo in ml.MODOS:
            for familia in (ml.ATRIBUTOS_FAMILIAS if con_atributos else tuple(ml.FAMILIAS)):
                aj = ml.ajustar(familia, modo, fuente, ancla=a, atributos=ats)
                clave = f"ml_{familia}{'_atributos' if con_atributos else ''}|{modo}"
                clase = (ml.BASES_ATRIBUTOS if con_atributos else ml.BASES)[familia]
                modelos[clave] = clase(modo, aj["hiperparametros"], semilla, hasta=ml.fin_interno(a),
                                       vida=aj["vida"], ancla=a, atributos=ats)
                ajustes[clave] = aj
                bases.setdefault(modo, {})[familia] = {k: aj[k] for k in ("hiperparametros", "vida")}
            clave = f"ml_promedio{'_atributos' if con_atributos else ''}|{modo}"
            clase = ml.PromedioAtributos if con_atributos else ml.Promedio
            modelos[clave] = clase(modo, bases[modo], semilla, hasta=ml.fin_interno(a), ancla=a, atributos=ats)
            if not con_atributos:
                meta, _, _ = ml.ajustar_meta(bases[modo], modo, semilla, fuente, ancla=a)
                modelos[f"ml_stacking|{modo}"] = ml.Stacking(modo, bases[modo], meta, semilla,
                                                            hasta=ml.fin_interno(a), ancla=a)
    for modelo in MODELOS:
        for supuesto in (None, "A", "B"):
            clave = f"historial|{modelo}|{supuesto or 'sin'}"
            modelos[clave] = ModeloVin(tabla, modelo, supuesto, a - 6, atributos, semilla)
    return modelos, ajustes


def recoger(tabla, opciones, semilla=1):
    assert not tabla.desbloqueada
    columnas_csv, eventos = columnas.leer_eventos(opciones.csv, tabla)
    huella = hashlib.sha256()
    carpeta = Path(__file__).parent
    for modulo in ("busqueda", "columnas", "ml", "historial_vin", "datos", "referencias", "puntaje"):
        base = carpeta if modulo in ("busqueda", "columnas", "historial_vin") else carpeta.parent
        huella.update((base / f"{modulo}.py").read_bytes())
    huella.update(repr((tabla.fuente, semilla, CALIBRACION, BLOQUES_SELECCION, CONFIRMACION)).encode())
    cache = Path(opciones.cache) / f"busqueda-{huella.hexdigest()[:16]}.pickle"
    if cache.exists():
        with cache.open("rb") as f:
            salida = pickle.load(f)
        if salida.get("terminado"):
            return salida
    else:
        salida = {"columnas": columnas_csv, "dias": [], "ajustes": [], "cobertura": [], "nombres": None}
    fuente = fuente_completa(tabla)
    for a, b in (CALIBRACION, *BLOQUES_SELECCION, CONFIRMACION):
        assert b < 195
        if any(x["bloque"] == [a, b] for x in salida["ajustes"]):
            continue
        modelos, ajustes = modelos_bloque(tabla, fuente, a, semilla)
        print(f"busqueda: modelos de catálogo ajustados, bloque {a}–{b}", flush=True)
        campos, evaluados, cobertura = columnas.predicciones_bloque(tabla, eventos, columnas_csv, a, b, semilla)
        nombres = sorted([*modelos, *campos])
        assert salida["nombres"] in (None, nombres), "Cambió el catálogo de candidatos entre bloques"
        salida["nombres"] = nombres
        salida["ajustes"].append({"bloque": [a, b], "configuraciones": ajustes})
        salida["cobertura"].append({"bloque": [a, b], **cobertura})
        posicion = 0
        for t, vins in tabla.por_dia(a, b).items():
            assert t < 195
            pred = {}
            ctx = Contexto(fuente, t)
            codigos = sorted({v.codigo for v in vins})
            for clave, modelo in modelos.items():
                por_vin = getattr(modelo, "por_vin", False)
                p = modelo.puntuar(ctx, vins if por_vin else codigos)
                xs = np.array([p[v.vin if por_vin else v.codigo] for v in vins])
                if clave.startswith("historial|ranker"):
                    xs = rankdata(xs) / (len(xs) + 1)  # LambdaMART da puntuaciones, no probabilidades.
                pred[clave] = xs
            for clave, p in campos.items():
                pred[clave] = p[posicion:posicion + len(vins)]
            posicion += len(vins)
            P = np.array([pred[n] for n in nombres])
            assert np.isfinite(P).all() and ((P >= 0) & (P <= 1)).all()
            salida["dias"].append({"t": t, "n": len(vins), "k": cupo(len(vins)),
                                   "y": np.array([v.calibrada for v in vins], dtype=np.uint8), "P": P,
                                   "azar": semilla_dia(SEMILLA_DESEMPATE, t).random(len(vins))})
        assert posicion == len(evaluados)
        ml._MODELOS.clear()  # La caché de modelos de un bloque no se necesita en el siguiente.
        cache.parent.mkdir(parents=True, exist_ok=True)
        with cache.open("wb") as f:
            pickle.dump(salida, f)
        print(f"busqueda: bloque {a}–{b}, {len(nombres)} individuales listos", flush=True)
    salida["terminado"] = True
    with cache.open("wb") as f:
        pickle.dump(salida, f)
    return salida


def aciertos(P, y, k, azar):
    """Equivalente vectorizado de seleccionar: score descendente y desempate fijo por VIN."""
    orden = np.lexsort((np.broadcast_to(azar, P.shape), -P), axis=1)[:, :k]
    return y[orden].sum(axis=1)


def familia(nombre):
    if nombre.startswith("campos_"):
        return "campos_" + nombre.split("|")[0][-1]
    if nombre.startswith("conjunto|"):
        return "conjunto"
    if nombre.startswith("historial|"):
        return "historial"
    if nombre.startswith("ml_"):
        return nombre.split("|")[0].replace("_atributos", "")
    if nombre.startswith("movil_mercado"):
        return "movil_mercado"
    return nombre.split("_")[0] if nombre != "tasa_fija" else "tasa_fija"


def catalogo(nombres, individuales, dias):
    sel = [i for i, d in enumerate(dias) if 100 <= d["t"] <= 174]
    total = individuales[:, sel].sum(axis=1)
    grupos = collections.defaultdict(list)
    for i, nombre in enumerate(nombres):
        grupos[familia(nombre)].append(i)
    # Un representante de cada familia base + dos escenarios de columnas + objetivo conjunto + historial.
    usadas = ("ml_logistica", "ml_nb", "ml_rf", "ml_xgboost", "ml_lightgbm", "ml_catboost", "ml_mlp",
              "tasa_fija", "movil", "movil_mercado", "jerarquico", "decaimiento", "campos_A", "campos_B",
              "conjunto", "historial")
    pool = [min(grupos[f], key=lambda i: (-int(total[i]), nombres[i])) for f in usadas if f in grupos]
    candidatos = []
    for i in range(len(nombres)):
        candidatos.append({"metodo": "individual", "indices": [i], "pesos": [1.]})
    for i, j in itertools.combinations(range(len(nombres)), 2):
        for p in PESOS_PARES:
            candidatos.append({"metodo": "pares", "indices": [i, j], "pesos": [p, 1 - p]})
    for cantidad in range(2, len(pool) + 1):
        for inds in itertools.combinations(pool, cantidad):
            for metodo in ("promedio", "rangos", "mediana"):
                candidatos.append({"metodo": metodo, "indices": list(inds), "pesos": [1 / cantidad] * cantidad})
    # Todas las asignaciones no negativas en pasos de 25 % sobre los representantes (hasta cuatro componentes).
    for repetidos in itertools.combinations_with_replacement(pool, 4):
        conteos = collections.Counter(repetidos)
        if len(conteos) < 3:
            continue  # Individuales y pares ya están cubiertos con una grilla más fina.
        candidatos.append({"metodo": "pesos_25", "indices": list(conteos),
                           "pesos": [n / 4 for n in conteos.values()]})
    return candidatos, pool


def optimizar_continuo(dias, pool):
    from scipy.optimize import differential_evolution
    evaluaciones = []
    seleccion = [d for d in dias if 100 <= d["t"] <= 174]

    def objetivo(w):
        w = w / w.sum()
        encontrados = sum(int(aciertos((w @ d["P"][pool])[None, :], d["y"], d["k"], d["azar"])[0])
                          for d in seleccion)
        evaluaciones.append({"metodo": "continuo_precision", "indices": list(pool), "pesos": w.tolist()})
        return -encontrados

    for semilla in (1, 2):
        differential_evolution(objetivo, [(1e-8, 1.)] * len(pool), rng=np.random.default_rng(semilla),
                               popsize=4, maxiter=30, polish=False, tol=0, atol=0)
    print(f"busqueda: {len(evaluaciones)} pesos continuos evaluados", flush=True)
    return evaluaciones


def evaluar(dias, candidatos):
    salida = np.zeros((len(candidatos), len(dias)), dtype=np.uint16)
    # Agrupar por método y cantidad hace que la mediana se pueda calcular en lotes sin un bucle por candidato.
    grupos = collections.defaultdict(list)
    for i, c in enumerate(candidatos):
        grupos[(c["metodo"], len(c["indices"]))].append(i)
    for (metodo, _), filas in grupos.items():
        for inicio in range(0, len(filas), LOTE):
            ids = filas[inicio:inicio + LOTE]
            indices = np.array([candidatos[i]["indices"] for i in ids])
            pesos = np.array([candidatos[i]["pesos"] for i in ids])
            for j, d in enumerate(dias):
                P = d["rangos"] if metodo == "rangos" else d["P"]
                valores = P[indices]
                ps = np.median(valores, axis=1) if metodo == "mediana" else np.einsum("im,imv->iv", pesos, valores)
                salida[ids, j] = aciertos(ps, d["y"], d["k"], d["azar"])
        print(f"busqueda: {metodo}, {len(filas)} candidatos de {len(candidatos[filas[0]]['indices'])} componentes", flush=True)
    return salida


def diario_de(dias, cuentas, indices):
    return diario([(d["t"], d["n"], d["k"], int(d["y"].sum()), int(cuentas[i]))
                   for i in indices for d in (dias[i],)])


def pesos_aprendidos(datos, pool):
    """Stacking y pesos convexos se ajustan con predicciones temporales pasadas y etiquetas disponibles."""
    from scipy.optimize import minimize
    dias = datos["dias"]
    salidas = {f"stacking_C{c}": [] for c in (.01, .1, 1., 10.)}
    salidas.update({"convexo_logloss": [], "convexo_brier": []})
    configuraciones = []
    # Se fijan doce entradas por nombre antes de elegir por rendimiento; no se usan campeones elegidos con futuro.
    fijos = [f"ml_{b}_atributos|reentrenado" for b in ml.ATRIBUTOS_FAMILIAS]
    fijos += ["ml_nb|fijo", "tasa_fija", "movil_60_20", "movil_mercado_60", "jerarquico_60_20", "decaimiento_30"]
    inds = [datos["nombres"].index(n) for n in fijos if n in datos["nombres"]]
    for a, b in (*BLOQUES_SELECCION, CONFIRMACION):
        anteriores = [d for d in dias if d["t"] <= a - 6]
        X = np.concatenate([d["P"][inds].T for d in anteriores])
        y = np.concatenate([d["y"] for d in anteriores])
        modelos = {}
        for c in (.01, .1, 1., 10.):
            m = LogisticRegression(C=c, max_iter=2000).fit(logit(np.clip(X, 1e-6, 1 - 1e-6)), y)
            modelos[f"stacking_C{c}"] = lambda Z, m=m: m.predict_proba(logit(np.clip(Z, 1e-6, 1 - 1e-6)))[:, 1]
        for tipo in ("logloss", "brier"):
            def perdida(w):
                p = np.clip(X @ w, 1e-6, 1 - 1e-6)
                return float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))) if tipo == "logloss" \
                    else float(np.mean((p - y) ** 2))
            ajuste = minimize(perdida, np.ones(len(inds)) / len(inds), method="SLSQP",
                              bounds=[(0, 1)] * len(inds), constraints={"type": "eq", "fun": lambda w: w.sum() - 1})
            assert ajuste.success, ajuste.message
            w = np.maximum(ajuste.x, 0)
            w /= w.sum()
            modelos[f"convexo_{tipo}"] = lambda Z, w=w: Z @ w
            configuraciones.append({"bloque": [a, b], "metodo": tipo, "entradas": fijos,
                                    "pesos": w.tolist(), "hasta_meta": max(d["t"] for d in anteriores)})
        for d in dias:
            if a <= d["t"] <= b:
                Z = d["P"][inds].T
                for nombre, modelo in modelos.items():
                    salidas[nombre].append(int(aciertos(modelo(Z)[None, :], d["y"], d["k"], d["azar"])[0]))
        for nombre in ("rf", "lightgbm"):
            modelo = columnas.estimador(nombre, 1).fit(X, y)
            clave = f"stacking_{nombre}"
            salidas.setdefault(clave, [])
            for d in dias:
                if a <= d["t"] <= b:
                    p = modelo.predict_proba(d["P"][inds].T)[:, 1]
                    salidas[clave].append(int(aciertos(p[None, :], d["y"], d["k"], d["azar"])[0]))
    return salidas, configuraciones


def analizar(datos, candidatos, cuentas, aprendidos, configuraciones):
    dias = [d for d in datos["dias"] if d["t"] >= 100]
    nombres = datos["nombres"]
    sel = [i for i, d in enumerate(dias) if d["t"] <= 174]
    conf = [i for i, d in enumerate(dias) if d["t"] >= 175]
    for nombre, cs in aprendidos.items():
        candidatos.append({"metodo": nombre, "indices": [], "pesos": []})
        cuentas = np.vstack([cuentas, cs])
    totals = cuentas[:, sel].sum(axis=1)
    orden = sorted(range(len(candidatos)), key=lambda i: (-int(totals[i]), len(candidatos[i]["indices"]),
                                                         candidatos[i]["metodo"], candidatos[i]["indices"]))
    mejor_individual = next(i for i in orden if candidatos[i]["metodo"] == "individual")
    idx_sel, idx_conf = remuestreos(len(sel)), remuestreos(len(conf))

    def resumen(i):
        c = candidatos[i]
        ds, dc = diario_de(dias, cuentas[i], sel), diario_de(dias, cuentas[i], conf)
        rs, rc = diario_de(dias, cuentas[mejor_individual], sel), diario_de(dias, cuentas[mejor_individual], conf)
        return {"metodo": c["metodo"], "componentes": [nombres[j] for j in c["indices"]], "pesos": c["pesos"],
                "seleccion": metricas(ds, idx_sel), "confirmacion": metricas(dc, idx_conf),
                "diferencia_individual_seleccion_rango95": diferencia(rs, ds, idx_sel),
                "diferencia_individual_confirmacion_rango95": diferencia(rc, dc, idx_conf)}
    grupos = collections.defaultdict(list)
    for i, c in enumerate(candidatos):
        grupos[(c["metodo"], len(c["indices"]))].append(i)
    cobertura = []
    for (metodo, n), ids in sorted(grupos.items()):
        mejor = min(ids, key=lambda i: (-int(totals[i]), i))
        cobertura.append({"metodo": metodo, "componentes": n, "evaluados": len(ids), "mejor": resumen(mejor)})
    # Banda simultánea del bootstrap centrado sobre todo el catálogo fijo de mezclas (condicional al pool elegido).
    k = np.array([dias[i]["k"] for i in sel])
    base = cuentas[mejor_individual, sel].astype(float)
    denominadores = k[idx_sel].sum(axis=1)
    incidencias = np.zeros((len(sel), len(idx_sel)))
    for j, inds in enumerate(idx_sel):
        incidencias[:, j] = np.bincount(inds, minlength=len(sel))
    extremos = np.zeros(len(idx_sel))
    for inicio in range(0, len(candidatos), LOTE):
        delta = cuentas[inicio:inicio + LOTE][:, sel].astype(float) - base
        centrado = delta @ incidencias / denominadores - delta.sum(axis=1)[:, None] / k.sum()
        extremos = np.maximum(extremos, np.max(np.abs(centrado), axis=0))
    critico = float(np.percentile(extremos, 95))
    dif_ganador = float((totals[orden[0]] - totals[mejor_individual]) / k.sum())
    return {"candidatos_evaluados": len(candidatos), "individuales": len(nombres), "top_seleccion": [resumen(i) for i in orden[:30]],
            "mejor_individual": resumen(mejor_individual), "cobertura_por_metodo_y_tamano": cobertura,
            "todos_los_individuales": [resumen(i) for i, c in enumerate(candidatos) if c["metodo"] == "individual"],
            "ajuste_sobrebusqueda_condicional": {"metodo": "bootstrap centrado, máximo absoluto en todo el catálogo",
                                                "radio_simultaneo95": critico,
                                                "ganador_menos_individual_rango95": [dif_ganador - critico, dif_ganador + critico],
                                                "limite": "Condicional al pool elegido; no corrige decisiones previas sobre datos ya vistos."},
            "configuraciones_meta": configuraciones}


def correr(tabla, opciones):
    assert not tabla.desbloqueada
    with threadpool_limits(limits=1):
        datos = recoger(tabla, opciones)
        dias = [d for d in datos["dias"] if d["t"] >= 100]
        individuales = np.array([aciertos(d["P"], d["y"], d["k"], d["azar"]) for d in dias]).T
        candidatos, pool = catalogo(datos["nombres"], individuales, dias)
        candidatos.extend(optimizar_continuo(dias, pool))
        print(f"busqueda: {len(candidatos)} combinaciones; pool de {len(pool)} familias", flush=True)
        for d in dias:
            d["rangos"] = rankdata(d["P"], axis=1) / (d["n"] + 1)
        cuentas = evaluar(dias, candidatos)
        aprendidos, configs = pesos_aprendidos(datos, pool)
        resultado = analizar(datos, candidatos, cuentas, aprendidos, configs)
    return {"pieza": "Búsqueda amplia de modelos, columnas y ensembles", "fuente": tabla.fuente,
            "version_codigo": version_codigo(), "protocolo": {"semilla": 1, "calibracion_meta": CALIBRACION,
            "seleccion": BLOQUES_SELECCION, "confirmacion": CONFIRMACION, "prueba_final": "no releída",
            "pesos_pares": PESOS_PARES, "pool": [datos["nombres"][i] for i in pool],
            "columnas_evaluadas": datos["columnas"], "columnas_excluidas": sorted(columnas.EXCLUIDAS),
            "sinteticos": "Solo entrenamiento: ponderación, bootstrap y valores numéricos interpolados entre positivos del mismo código",
            "limites": "Exploratorio, datos ya vistos, base ficticia; disponibilidad de historial/columnas no verificada. "
                       "No es una búsqueda de todas las arquitecturas, columnas derivadas o pesos continuos posibles."},
            "cobertura_campos": datos["cobertura"], "ajustes_por_bloque": datos["ajustes"], **resultado}
