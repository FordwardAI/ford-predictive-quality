"""Diferencial (P6): componente, detector de cambios, subcategorización y anexo de historial.

Todo se evalúa en validación (Día del VIN 155–194) con etiquetas de Día <= t − 5.
Ninguna pieza modifica al predictor ni lo alimenta:

- El componente es lo que se predice («dónde mirar»), nunca un predictor del resultado.
- El detector de cambios produce observaciones, no causas.
- La subcategorización usa el historial y es descriptiva: no predice ni suaviza.
- El anexo de historial no es elegible: «disponibilidad no probada».

`correr` escribe al repo solo agregados; el detalle por código (componentes por
código, alarmas, pertenencia a grupos) va a `opciones.salida`, fuera del repo.
`prueba` es el gancho que el preregistro (P7) llama con la tabla desbloqueada y la
configuración congelada de `configuracion()`.
"""
import collections
import json

import numpy as np

from . import cupo
from .datos import MARGEN, PRUEBA_DESDE, RAIZ, TRAMOS
from .puntaje import Puntaje, suavizada, wilson
from .referencias import evaluar  # Además registra las referencias para reconstruir la ganadora.

RESULTADOS = RAIZ / "solucion" / "resultados"
VALIDACION = TRAMOS["validacion"]
ENTRENAMIENTO_HASTA = TRAMOS["entrenamiento"][1]
TRAMO = "validación 155–194"
CALIFICADOR = "entre auditados con actividad QLS, {tramo}, base ficticia, n = {n}"

# Componente.
PESO_COMPONENTE = 20
TOP = 3

# Detector.
FACTOR = 2.0  # Alternativas: la tasa se duplica o baja a la mitad.
TOPE_P1 = 0.99
PESO_P0 = 20
FALSAS_CADA_30 = 1.0
PERMUTACIONES = 100
REJILLA_H = (0.5, 20.0, 0.1)
SEMILLA_PERMUTACION = 20261004
SEMILLA_POTENCIA = 20261005
DIA_CAMBIO = 165  # Cambio sintético: deja 30 DIA de validación después del cambio.
MIN_VIN_POTENCIA = 100
REPLICAS_POTENCIA = 200
CERCA_DE_260 = 10

# Subcategorización.
MIN_VIN_PERFIL = 30
K_RANGO = (3, 8)
SEMILLA_KMEANS = 20261006
N_INIT = 10
DIMENSIONES = ("mercado", "motor", "traccion")
SECCIONES = ("componente", "detector", "subcategorizacion", "anexo_historial")

# Anexo de historial.
TOP_INCIDENCIAS = 20
SEMILLA_ANEXO = 20261007
HIPER = {"logistica": {"C": 1.0, "max_iter": 2000, "escalado": "StandardScaler"},
         "xgboost": {"n_estimators": 300, "max_depth": 4, "learning_rate": 0.05, "tree_method": "hist",
                     "n_jobs": 4}}


def _calificador(tramo, n):
    return CALIFICADOR.format(tramo=tramo, n=n)


def _visible(tabla, v):
    """Etiqueta de un VIN usado como conocido: nunca de la prueba final sin desbloqueo."""
    assert v.dia < PRUEBA_DESDE or tabla.desbloqueada, "Etiquetas de Día >= 200 sin preregistro"
    return v.calibrada


# ---------------------------------------------------------------------------
# 1. Componente («dónde mirar»)
# ---------------------------------------------------------------------------

def distribucion_suavizada(conteo, general, peso=PESO_COMPONENTE):
    """Distribución del componente de un código, suavizada hacia la general con `peso` VIN."""
    total = sum(conteo.values())
    return {c: suavizada(total, conteo.get(c, 0), p, peso) for c, p in general.items()}


def primeros(distribucion, top=TOP):
    """Los `top` componentes más probables; los empates se ordenan por nombre."""
    return tuple(sorted(distribucion, key=lambda c: (-distribucion[c], c))[:top])


def _general(conteo):
    total = sum(conteo.values())
    return {c: k / total for c, k in conteo.items()} if total else {}


def componente_por_dia(tabla, lo, hi, elegidos=None, fija_hasta=ENTRENAMIENTO_HASTA, peso=PESO_COMPONENTE):
    """Aciertos en los 3 primeros por día: del código, general (Día <= t−5) y general fija (Día <= fija_hasta).

    `elegidos` ({día: set de VIN}) restringe la evaluación a lo que eligió el cupo.
    Devuelve (filas [(día, CALIBRADA evaluadas, aciertos código, general, fija)], componentes por código).
    """
    assert fija_hasta <= lo - MARGEN
    conocidos = sorted((v for v in tabla.vins if v.dia <= hi - MARGEN), key=lambda v: v.dia)
    por_codigo, general = collections.defaultdict(collections.Counter), collections.Counter()
    fija = collections.Counter(v.componente for v in conocidos if v.dia <= fija_hasta and _visible(tabla, v))
    top_fija = primeros(_general(fija))
    i, filas = 0, []
    for t, vins in tabla.por_dia(lo, hi).items():
        while i < len(conocidos) and conocidos[i].dia <= t - MARGEN:
            v = conocidos[i]
            i += 1
            if _visible(tabla, v):
                assert v.componente is not None, "CALIBRADA sin componente"
                por_codigo[v.codigo][v.componente] += 1
                general[v.componente] += 1
        dist = _general(general)
        top_general, tops = primeros(dist), {}
        evaluados = [v for v in vins if (elegidos is None or v.vin in elegidos.get(t, ())) and v.calibrada]
        aciertos = [0, 0, 0]
        for v in evaluados:
            if v.codigo not in tops:
                tops[v.codigo] = primeros(distribucion_suavizada(por_codigo.get(v.codigo, {}), dist, peso))
            aciertos[0] += v.componente in tops[v.codigo]
            aciertos[1] += v.componente in top_general
            aciertos[2] += v.componente in top_fija
        filas.append((t, len(evaluados), *aciertos))
    return np.array(filas, dtype=float).reshape(-1, 5), por_codigo


def _lectura(rango):
    return None if rango is None else "mejora" if rango[0] > 0 else "peor" if rango[1] < 0 else "inconcluso"


def _rango(x):
    x = x[np.isfinite(x)]
    return [float(np.percentile(x, 2.5)), float(np.percentile(x, 97.5))] if len(x) else None


def acierto(filas, idx):
    """Tasa de acierto del código frente a la general (Día <= t−5) y la general fija, con bootstrap por días."""
    n = filas[:, 1]
    series = {"codigo": filas[:, 2], "general": filas[:, 3], "general_fija": filas[:, 4]}
    total, bn = n.sum(), n[idx].sum(-1)
    salida = {"calibrada_evaluadas": int(total), "dias": int(len(n))}
    with np.errstate(divide="ignore", invalid="ignore"):
        for k, a in series.items():
            salida[f"aciertos_{k}"] = int(a.sum())
            salida[f"acierto_{k}"] = float(a.sum() / total) if total else None
            salida[f"acierto_{k}_rango95"] = _rango(a[idx].sum(-1) / bn)
        for k in ("general", "general_fija"):
            rango = _rango((series["codigo"][idx].sum(-1) - series[k][idx].sum(-1)) / bn)
            salida[f"diferencia_con_{k}_rango95"] = rango
            salida[f"lectura_contra_{k}"] = _lectura(rango)
    return salida


def _elegidos(tabla, puntaje, lo, hi):
    """Diario del cupo y VIN elegidos por día con el puntaje dado."""
    elegidos = {}

    def al_elegir(t, vins, sel):
        elegidos[t] = {v.vin for v in sel}

    d = cupo.simular(tabla, puntaje, lo, hi, al_elegir=al_elegir)
    return d, elegidos


def componente(tabla, idx, ganadora, elegidos, tramo=TRAMO, lo=VALIDACION[0], hi=VALIDACION[1],
               fija_hasta=ENTRENAMIENTO_HASTA):
    todas, por_codigo = componente_por_dia(tabla, lo, hi, fija_hasta=fija_hasta)
    sobre_todas = acierto(todas, idx)
    salida = {"todas_las_calibrada": {**sobre_todas,
                                      "calificador": _calificador(tramo, f"{sobre_todas['calibrada_evaluadas']} "
                                                                         "VIN CALIBRADA")}}
    if elegidos is not None:
        filas, _ = componente_por_dia(tabla, lo, hi, elegidos=elegidos, fija_hasta=fija_hasta)
        sobre = acierto(filas, idx)
        salida["calibrada_elegidas_por_la_ganadora"] = {
            "ganadora": ganadora, **sobre,
            "calificador": _calificador(tramo, f"{sobre['calibrada_evaluadas']} VIN CALIBRADA elegidos")}
    return salida, por_codigo


# ---------------------------------------------------------------------------
# 2. Detector de cambios (CUSUM de Bernoulli por código)
# ---------------------------------------------------------------------------

def incrementos(n, x, p0):
    """Log-verosimilitud diaria de subida (p1 = 2·p0) y de bajada (p1 = p0/2) frente a p0."""
    p0 = np.clip(np.asarray(p0, dtype=float), 1e-6, 0.5)[..., None]
    salida = []
    for p1 in (np.minimum(FACTOR * p0, TOPE_P1), p0 / FACTOR):
        salida.append(x * np.log(p1 / p0) + (n - x) * np.log((1 - p1) / (1 - p0)))
    return salida


def recorrer(arriba, abajo, h):
    """CUSUM de dos lados con umbral h; cada lado vuelve a 0 tras su alarma. Da (j, alarma arriba, abajo)."""
    forma = np.broadcast_shapes(np.shape(h), arriba.shape[:-1])
    su, sd = np.zeros(forma), np.zeros(forma)
    for j in range(arriba.shape[-1]):
        su = np.maximum(0.0, su + arriba[..., j])
        sd = np.maximum(0.0, sd + abajo[..., j])
        au, ad = su > h, sd > h
        su, sd = np.where(au, 0.0, su), np.where(ad, 0.0, sd)
        yield j, au, ad


def matriz_diaria(tabla, codigos, lo, hi):
    """n y CALIBRADA por código y día calendario lo..hi."""
    fila = {c: i for i, c in enumerate(codigos)}
    n, x = np.zeros((len(codigos), hi - lo + 1)), np.zeros((len(codigos), hi - lo + 1))
    for v in tabla.vins:
        if lo <= v.dia <= hi and v.codigo in fila:
            n[fila[v.codigo], v.dia - lo] += 1
            x[fila[v.codigo], v.dia - lo] += _visible(tabla, v)
    return n, x


def referencia(tabla, hasta, peso=PESO_P0):
    """p0 por código: su tasa con Día <= hasta suavizada hacia la general; y la general."""
    conteo = collections.defaultdict(lambda: [0, 0])
    for v in tabla.vins:
        if v.dia <= hasta:
            conteo[v.codigo][0] += 1
            conteo[v.codigo][1] += _visible(tabla, v)
    n = sum(a for a, _ in conteo.values())
    general = sum(b for _, b in conteo.values()) / n if n else 0.0
    return {c: suavizada(a, b, general, peso) for c, (a, b) in conteo.items()}, general


def _rejilla():
    lo, hi, paso = REJILLA_H
    return np.round(np.arange(lo, hi + paso / 2, paso), 6)


def calibrar_h(tabla, hasta=ENTRENAMIENTO_HASTA, permutaciones=PERMUTACIONES, semilla=SEMILLA_PERMUTACION):
    """Menor h de la rejilla con <= 1 falsa alarma cada 30 DIA en todo el catálogo (y en todo h mayor).

    Las falsas alarmas se miden con los días mezclados al azar dentro de cada código en Día <= hasta.
    """
    p0, general = referencia(tabla, hasta)
    codigos = sorted(p0)
    lo = min(v.dia for v in tabla.vins if v.dia <= hasta)
    n, x = matriz_diaria(tabla, codigos, lo, hasta)
    rng = np.random.default_rng(semilla)
    nn, xx = np.zeros((permutaciones, *n.shape)), np.zeros((permutaciones, *n.shape))
    for i in range(len(codigos)):
        activos = np.flatnonzero(n[i] > 0)
        for p in range(permutaciones):
            orden = rng.permutation(activos)
            nn[p, i, activos], xx[p, i, activos] = n[i, orden], x[i, orden]
    arriba, abajo = incrementos(nn, xx, np.array([p0[c] for c in codigos]))
    rejilla = _rejilla()
    alarmas = np.zeros(len(rejilla))
    for _, au, ad in recorrer(arriba, abajo, rejilla[:, None, None]):
        alarmas += au.sum((1, 2)) + ad.sum((1, 2))
    dias = hasta - lo + 1
    por_30 = alarmas / permutaciones / dias * 30
    cumple = np.flip(np.logical_and.accumulate(np.flip(por_30 <= FALSAS_CADA_30)))
    assert cumple.any(), "Ningún h de la rejilla cumple la tasa de falsas alarmas"
    j = int(np.argmax(cumple))
    sin_mezclar = alarmas_reales(tabla, p0, general, float(rejilla[j]), lo, hasta)
    return {"h": float(rejilla[j]), "falsas_alarmas_cada_30_dia": float(por_30[j]),
            "codigos": len(codigos), "dias_calendario": int(dias), "permutaciones": permutaciones,
            "curva": {str(float(rejilla[k])): float(por_30[k]) for k in range(0, len(rejilla), 10)},
            "alarmas_sin_mezclar_en_calibracion": len(sin_mezclar)}


def alarmas_reales(tabla, p0, general, h, lo, hi):
    """Alarmas con las etiquetas reales entre lo y hi, CUSUM desde 0 en lo. Lista (código, día, sentido)."""
    codigos = sorted({v.codigo for v in tabla.vins if lo <= v.dia <= hi})
    n, x = matriz_diaria(tabla, codigos, lo, hi)
    arriba, abajo = incrementos(n, x, np.array([p0.get(c, general) for c in codigos]))
    salida = []
    for j, au, ad in recorrer(arriba, abajo, h):
        salida += [(codigos[i], lo + j, "sube") for i in np.flatnonzero(au)]
        salida += [(codigos[i], lo + j, "baja") for i in np.flatnonzero(ad)]
    return salida


def potencia(tabla, p0, general, h, lo=VALIDACION[0], hi=VALIDACION[1], dia_cambio=DIA_CAMBIO,
             replicas=REPLICAS_POTENCIA, semilla=SEMILLA_POTENCIA):
    """Detección y demora con cambios sintéticos (×2 y ×½ desde dia_cambio) sobre el n diario real."""
    volumen = collections.Counter(v.codigo for v in tabla.vins if lo <= v.dia <= hi)
    codigos = sorted(c for c, k in volumen.items() if k >= MIN_VIN_POTENCIA)
    n, _ = matriz_diaria(tabla, codigos, lo, hi)
    base = np.array([p0.get(c, general) for c in codigos])
    rng = np.random.default_rng(semilla)
    nn = np.broadcast_to(n, (replicas, *n.shape))
    despues = np.arange(lo, hi + 1) >= dia_cambio
    salida = {"codigos": len(codigos), "vins": int(n.sum()), "replicas": replicas, "dia_cambio": dia_cambio,
              "min_vin_en_validacion": MIN_VIN_POTENCIA}
    for escenario, factor in (("sin_cambio", 1.0), ("sube_x2", FACTOR), ("baja_a_la_mitad", 1 / FACTOR)):
        p = np.where(despues, np.minimum(base * factor, TOPE_P1)[:, None], base[:, None])
        xx = rng.binomial(nn.astype(int), np.broadcast_to(p, nn.shape)).astype(float)
        arriba, abajo = incrementos(nn, xx, base)
        primera = np.full(nn.shape[:-1], -1)
        falsas = 0
        for j, au, ad in recorrer(arriba, abajo, h):
            dia = lo + j
            buscada = au if factor > 1 else ad if factor < 1 else None
            if dia < dia_cambio or buscada is None:
                falsas += int(au.sum() + ad.sum())
            else:
                falsas += int((ad if factor > 1 else au).sum())
                nuevas = buscada & (primera < 0)
                primera[nuevas] = dia
        fila = {"falsas_alarmas": falsas}
        if factor == 1.0:
            fila["falsas_alarmas_cada_30_dia"] = float(falsas / replicas / (hi - lo + 1) * 30)
        else:
            detectadas = primera >= 0
            demora = primera[detectadas] - dia_cambio
            fila.update({"deteccion": float(detectadas.mean()), "detectadas": int(detectadas.sum()),
                         "casos": int(detectadas.size),
                         "demora_mediana_dia": float(np.median(demora)) if len(demora) else None,
                         "demora_p25_p75_dia": [float(np.percentile(demora, q)) for q in (25, 75)]
                         if len(demora) else None})
        salida[escenario] = fila
    return salida


def _resumen_alarmas(alarmas, lo, hi):
    dias = hi - lo + 1
    return {"alarmas": len(alarmas), "sube": sum(s == "sube" for *_, s in alarmas),
            "baja": sum(s == "baja" for *_, s in alarmas), "codigos_con_alarma": len({c for c, *_ in alarmas}),
            "alarmas_cada_30_dia": float(len(alarmas) / dias * 30), "dias_calendario": dias}


def detector(tabla):
    calibracion = calibrar_h(tabla)
    h = calibracion["h"]
    p0, general = referencia(tabla, ENTRENAMIENTO_HASTA)
    lo, hi = VALIDACION
    alarmas = alarmas_reales(tabla, p0, general, h, lo, hi)
    codigos = len({v.codigo for v in tabla.vins if lo <= v.dia <= hi})
    vins = sum(lo <= v.dia <= hi for v in tabla.vins)
    return {"calibracion_149": calibracion, "potencia_validacion": potencia(tabla, p0, general, h),
            "etiquetas_reales_validacion": {**_resumen_alarmas(alarmas, lo, hi), "codigos_evaluados": codigos},
            "lectura": "Las detecciones son observaciones, no causas; el detector no modifica al predictor. "
                       f"Una alarma del Día d se conoce en d + {MARGEN} (margen de resultados).",
            "calificador": _calificador(TRAMO, f"{vins} VIN, {codigos} códigos")}, alarmas


# ---------------------------------------------------------------------------
# 3. Subcategorización (descriptiva: usa el historial, no predice)
# ---------------------------------------------------------------------------

def perfiles(tabla, hasta=ENTRENAMIENTO_HASTA, min_vin=MIN_VIN_PERFIL):
    """Distribución de UC Nombre Incidencia por código (eventos de VIN con Día <= hasta)."""
    conteo, vins = collections.defaultdict(collections.Counter), collections.Counter()
    for v in tabla.vins:
        if v.dia <= hasta:
            conteo[v.codigo].update(tabla.historial[v.vin].incidencias)
            vins[v.codigo] += 1
    incidencias = sorted({i for c in conteo.values() for i in c})
    codigos = sorted(c for c in conteo if vins[c] >= min_vin)
    x = np.array([[conteo[c][i] for i in incidencias] for c in codigos], dtype=float).reshape(len(codigos), -1)
    return codigos, x / np.maximum(x.sum(1, keepdims=True), 1)


def agrupar(tabla, k=None, semilla=SEMILLA_KMEANS):
    """Grupos de códigos por perfil de fallas con Día <= 149; k por silhouette en 3–8 si no se fija.

    Los grupos se numeran de menor a mayor tasa CALIBRADA en <= 149.
    """
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_score
    codigos, x = perfiles(tabla)
    siluetas = {}
    if k is None:
        for kk in range(K_RANGO[0], min(K_RANGO[1], len(codigos) - 1) + 1):
            etiquetas = KMeans(n_clusters=kk, n_init=N_INIT, random_state=semilla).fit_predict(x)
            siluetas[kk] = float(silhouette_score(x, etiquetas))
        k = max(siluetas, key=lambda kk: (siluetas[kk], -kk))
    etiquetas = KMeans(n_clusters=k, n_init=N_INIT, random_state=semilla).fit_predict(x)
    tasas = collections.defaultdict(lambda: [0, 0])
    grupo_de = dict(zip(codigos, etiquetas.tolist()))
    for v in tabla.vins:
        if v.dia <= ENTRENAMIENTO_HASTA and v.codigo in grupo_de:
            tasas[grupo_de[v.codigo]][0] += 1
            tasas[grupo_de[v.codigo]][1] += _visible(tabla, v)
    orden = sorted(range(k), key=lambda g: (tasas[g][1] / tasas[g][0], g))
    nuevo = {g: i + 1 for i, g in enumerate(orden)}
    return {c: nuevo[g] for c, g in grupo_de.items()}, k, siluetas


def tabla_de_grupos(tabla, grupo_de, tramos):
    """VIN, CALIBRADA, tasa y Wilson por grupo en cada tramo ((nombre, lo, hi)); «sin perfil» aparte."""
    filas = {}
    for v in tabla.vins:
        g = grupo_de.get(v.codigo, "sin perfil")
        fila = filas.setdefault(g, {"grupo": g, "codigos": set()})
        for nombre, lo, hi in tramos:
            if lo <= v.dia <= hi:
                fila["codigos"].add(v.codigo)
                par = fila.setdefault(nombre, [0, 0])
                par[0] += 1
                par[1] += _visible(tabla, v)
    salida = []
    for g in sorted(filas, key=lambda g: (isinstance(g, str), g)):
        fila = filas[g]
        registro = {"grupo": g, "codigos": len(fila["codigos"]) if isinstance(g, str)
                    else sum(1 for c in grupo_de.values() if c == g)}
        for nombre, *_ in tramos:
            n, cal = fila.get(nombre, [0, 0])
            registro[nombre] = {"vins": n, "calibrada": cal, "tasa": cal / n if n else None,
                                "wilson95": list(wilson(cal, n)) if n else None}
        salida.append(registro)
    return salida


def orden_entre_grupos(filas, referencia_, tramo):
    """¿El orden de tasas entre grupos de <= 149 se mantiene en el tramo? Tau de Kendall aparte."""
    from scipy.stats import kendalltau
    pares = [(f[referencia_]["tasa"], f[tramo]["tasa"]) for f in filas
             if not isinstance(f["grupo"], str) and f[referencia_]["tasa"] is not None
             and f[tramo]["tasa"] is not None]
    if len(pares) < 2:
        return {"grupos_comparados": len(pares), "se_mantiene": None, "tau_kendall": None}
    a, b = zip(*sorted(pares))
    tau = kendalltau(a, b).statistic
    return {"grupos_comparados": len(pares), "se_mantiene": all(x < y for x, y in zip(b, b[1:])),
            "tau_kendall": None if np.isnan(tau) else float(tau)}


def cruce_oficial(tabla, grupo_de):
    """Cantidad de códigos por grupo y por valor de la agrupación oficial, e índice de Rand ajustado."""
    from sklearn.metrics import adjusted_rand_score
    salida = {}
    codigos = sorted(grupo_de)
    for dim in DIMENSIONES:
        valores = [tabla.catalogo.get(c, {}).get(dim, "sin catálogo") for c in codigos]
        cruce = collections.defaultdict(collections.Counter)
        for c, valor in zip(codigos, valores):
            cruce[str(grupo_de[c])][valor] += 1
        salida[dim] = {"codigos_por_grupo": {g: dict(sorted(cnt.items())) for g, cnt in sorted(cruce.items())},
                       "rand_ajustado": float(adjusted_rand_score(valores, [grupo_de[c] for c in codigos]))}
    return salida


def subcategorizacion(tabla, k=None):
    grupo_de, k, siluetas = agrupar(tabla, k)
    lo, hi = VALIDACION
    filas = tabla_de_grupos(tabla, grupo_de, [("hasta_149", 0, ENTRENAMIENTO_HASTA), ("validacion", lo, hi)])
    vins = sum(lo <= v.dia <= hi for v in tabla.vins)
    return {"rotulo": "usa el historial, no predice", "k": k, "silhouette_por_k": siluetas,
            "codigos_con_perfil": len(grupo_de), "grupos": filas,
            "orden_en_validacion": orden_entre_grupos(filas, "hasta_149", "validacion"),
            "cruce_con_agrupacion_oficial": cruce_oficial(tabla, grupo_de),
            "calificador": _calificador(TRAMO, f"{vins} VIN")}, grupo_de


# ---------------------------------------------------------------------------
# 4. Anexo de historial («disponibilidad no probada», no elegible)
# ---------------------------------------------------------------------------

class Rasgos:
    """Rasgos por VIN desde su historial, aprendidos (incidencias, medianas, códigos) solo con Día <= hasta.

    Las Horas se toman como fracción de día, así que la reparación queda en días.
    """
    numericos = ("eventos", "incidencias_distintas", "reparacion_media", "reparacion_max", "dias_primero_ultimo")

    def __init__(self, tabla, con_codigo, hasta=ENTRENAMIENTO_HASTA):
        self.tabla = tabla
        entrenamiento = [v for v in tabla.vins if v.dia <= hasta]
        conteo = collections.Counter(i for v in entrenamiento for i in tabla.historial[v.vin].incidencias)
        self.incidencias = [i for i, _ in sorted(conteo.items(), key=lambda x: (-x[1], x[0]))[:TOP_INCIDENCIAS]]
        self.medianas = {}
        for campo in ("reparacion_media", "reparacion_max"):
            valores = [getattr(tabla.historial[v.vin], campo) for v in entrenamiento]
            valores = [x for x in valores if x is not None]
            self.medianas[campo] = float(np.median(valores)) if valores else 0.0
        self.codigos = sorted({v.codigo for v in entrenamiento}) if con_codigo else []

    def matriz(self, vins):
        filas = []
        indice = {c: i for i, c in enumerate(self.codigos)}
        for v in vins:
            h = self.tabla.historial[v.vin]
            numeros = [h.eventos, h.incidencias_distintas,
                       self.medianas["reparacion_media"] if h.reparacion_media is None else h.reparacion_media,
                       self.medianas["reparacion_max"] if h.reparacion_max is None else h.reparacion_max,
                       h.dias_primero_ultimo]
            presentes = set(h.incidencias)
            codigo = [0.0] * len(self.codigos)
            if v.codigo in indice:  # Códigos sin historial en <= 149: todo en cero.
                codigo[indice[v.codigo]] = 1.0
            filas.append(numeros + [float(i in presentes) for i in self.incidencias] + codigo)
        return np.array(filas, dtype=float)


def _modelo(nombre):
    if nombre == "logistica":
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import make_pipeline
        from sklearn.preprocessing import StandardScaler
        return make_pipeline(StandardScaler(), LogisticRegression(C=HIPER[nombre]["C"],
                                                                  max_iter=HIPER[nombre]["max_iter"]))
    from xgboost import XGBClassifier
    return XGBClassifier(**HIPER[nombre], random_state=SEMILLA_ANEXO,
                         eval_metric="logloss")


class AnexoHistorial(Puntaje):
    """Puntúa cada VIN con su historial (fijo, entrenado con <= 149). No es elegible."""
    familia, elegible, por_vin = "anexo_historial", False, True

    def __init__(self, tabla, modelo, con_codigo, orden=0):
        self.tabla, self.modelo, self.con_codigo = tabla, modelo, con_codigo
        rasgos = "historial + código" if con_codigo else "historial solo"
        self.parametros = {"modelo": modelo, "rasgos": rasgos, "entrenado_hasta": ENTRENAMIENTO_HASTA,
                           "top_incidencias": TOP_INCIDENCIAS, "hiperparametros": HIPER[modelo],
                           "semilla": SEMILLA_ANEXO if modelo == "xgboost" else None}
        self.nombre = f"anexo de historial: {modelo}, {rasgos} (disponibilidad no probada)"
        self.orden = (97, orden)
        self.rasgos, self.ajustado = None, None

    def ajustar(self):
        entrenamiento = self.tabla.tramo("entrenamiento")
        self.rasgos = Rasgos(self.tabla, self.con_codigo)
        y = np.array([_visible(self.tabla, v) for v in entrenamiento], dtype=int)
        self.ajustado = _modelo(self.modelo).fit(self.rasgos.matriz(entrenamiento), y)

    def probabilidades(self, vins):
        return self.ajustado.predict_proba(self.rasgos.matriz(vins))[:, 1]

    def puntuar(self, ctx, vins):
        if self.ajustado is None:
            ctx.conocidas(ENTRENAMIENTO_HASTA)  # Falla si <= 149 no está disponible el día t.
            self.ajustar()
        return {v.vin: float(p) for v, p in zip(vins, self.probabilidades(vins))}


def _diario(r):
    return cupo.Diario(*(np.array(r["diario"][k], dtype=float) for k in ("dias", "n", "k", "cal", "cal_elegidas")))


def anexo(tabla, idx, d_ganadora, ganadora):
    from sklearn.metrics import roc_auc_score
    puntajes = [AnexoHistorial(tabla, m, c, i) for i, (m, c) in
                enumerate([("logistica", False), ("xgboost", False), ("logistica", True), ("xgboost", True)])]
    resultados = evaluar(tabla, puntajes)
    validacion = tabla.tramo("validacion")
    y = [v.calibrada for v in validacion]
    for p, r in zip(puntajes, resultados):
        r["rotulo"] = "disponibilidad no probada"
        r["auc_validacion"] = float(roc_auc_score(y, p.probabilidades(validacion)))
        r["diferencia_con_ganadora_rango95"] = cupo.diferencia(d_ganadora, _diario(r), idx)
        r["ganadora_comparada"] = ganadora
    faltantes = sum(tabla.historial[v.vin].reparacion_media is None for v in tabla.vins if v.dia <= VALIDACION[1])
    return {"rotulo": "disponibilidad no probada", "elegible": False,
            "nota": "Las Horas de inspección y reparación se toman como fracción de día. Los VIN sin tiempo de "
                    "reparación usan la mediana de <= 149.",
            "vins_sin_tiempo_de_reparacion_hasta_194": faltantes, "resultados": resultados}


# ---------------------------------------------------------------------------
# Configuración, validación y prueba
# ---------------------------------------------------------------------------

def _configuracion(h, k):
    return {
        "componente": {"peso": PESO_COMPONENTE, "top": TOP, "margen": MARGEN, "desempate": "nombre del componente",
                       "referencia_fija_hasta": "fin del tramo anterior (149 en validación, 194 en prueba)",
                       "bootstrap": {"semilla": cupo.SEMILLA_BOOTSTRAP, "remuestreos": cupo.REMUESTREOS}},
        "detector": {"metodo": "CUSUM de Bernoulli por código, dos lados, reinicio a 0 tras cada alarma",
                     "factor": FACTOR, "tope_p1": TOPE_P1, "peso_p0": PESO_P0,
                     "p0": "tasa del código hasta el fin del tramo anterior (149 en validación, 194 en prueba), "
                           "suavizada hacia la general",
                     "h": h, "falsas_alarmas_cada_30_dia_max": FALSAS_CADA_30, "rejilla_h": list(REJILLA_H),
                     "permutaciones": PERMUTACIONES, "semilla_permutacion": SEMILLA_PERMUTACION,
                     "potencia": {"dia_cambio": DIA_CAMBIO, "min_vin": MIN_VIN_POTENCIA,
                                  "replicas": REPLICAS_POTENCIA, "semilla": SEMILLA_POTENCIA},
                     "cerca_de_260_dia": CERCA_DE_260},
        "subcategorizacion": {"perfil": "distribución de UC Nombre Incidencia por código, eventos de VIN con "
                                        "Día <= 149", "min_vin": MIN_VIN_PERFIL, "k": k, "k_rango": list(K_RANGO),
                              "criterio_k": "silhouette", "semilla": SEMILLA_KMEANS, "n_init": N_INIT},
        "anexo_historial": {"top_incidencias": TOP_INCIDENCIAS, "hiperparametros": HIPER, "semilla": SEMILLA_ANEXO,
                            "entrenado_hasta": ENTRENAMIENTO_HASTA, "elegible": False},
    }


def configuracion():
    """Configuración congelada para el preregistro, leída del último p6.json."""
    resultado = json.loads((RESULTADOS / "p6.json").read_text(encoding="utf-8"))
    return {s: resultado[s]["configuracion"] for s in SECCIONES}


def _escribir_detalle(salida, detalle):
    if salida is None:
        return None
    assert RAIZ not in salida.resolve().parents, "El detalle por código va fuera del repo"
    salida.mkdir(parents=True, exist_ok=True)
    destino = salida / "p6-detalle.json"
    destino.write_text(json.dumps(detalle, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    return destino


def correr(tabla, opciones=None):
    from .eleccion import ganadora as reconstruir
    lo, hi = VALIDACION
    idx = cupo.remuestreos(len(tabla.por_dia(lo, hi)))
    gan = reconstruir(tabla)
    d_gan, elegidos = _elegidos(tabla, gan, lo, hi)
    resumen_gan = {"alternativa": gan.nombre, "familia": gan.familia, "parametros": gan.parametros}

    comp, por_codigo = componente(tabla, idx, resumen_gan, elegidos)
    det, alarmas = detector(tabla)
    sub, grupo_de = subcategorizacion(tabla)
    anx = anexo(tabla, idx, d_gan, resumen_gan)
    config = _configuracion(det["calibracion_149"]["h"], sub["k"])

    dist = _general(collections.Counter(v.componente for v in tabla.vins if v.dia <= hi - MARGEN
                                        and _visible(tabla, v)))
    detalle = {"advertencia": "Detalle por código: no se versiona.",
               "componente_primeros_por_codigo_hasta_189": {
                   c: primeros(distribucion_suavizada(k, dist)) for c, k in sorted(por_codigo.items())},
               "alarmas_validacion": [{"codigo": c, "dia": d, "sentido": s} for c, d, s in alarmas],
               "grupo_por_codigo": dict(sorted(grupo_de.items()))}
    _escribir_detalle(getattr(opciones, "salida", None), detalle)
    vins = sum(lo <= v.dia <= hi for v in tabla.vins)
    return {"pieza": "P6 diferencial", "tramo": TRAMO,
            "configuracion": {s: config[s] for s in SECCIONES},  # Lo que lee preregistro.generar.
            "componente": {"configuracion": config["componente"], **comp,
                           "lectura": "El componente es lo que se predice («dónde mirar»), nunca un predictor."},
            "detector": {"configuracion": config["detector"], **det},
            "subcategorizacion": {"configuracion": config["subcategorizacion"], **sub},
            "anexo_historial": {"configuracion": config["anexo_historial"], **anx},
            "calificador": {"general": _calificador(TRAMO, f"{vins} VIN"),
                            "componente": comp["todas_las_calibrada"]["calificador"],
                            "detector": det["calificador"], "subcategorizacion": sub["calificador"]}}


def prueba(tabla, config, puntaje=None, salida=None):
    """Lectura de cada pieza en la prueba final con la configuración congelada (solo con tabla desbloqueada).

    `puntaje`: el predictor congelado, para el acierto del componente sobre lo que elige. `salida`: carpeta
    fuera del repo para el detalle por código.
    """
    assert tabla.desbloqueada, "La prueba final solo se lee con el preregistro"
    if puntaje is None and "preregistro" in config:  # Llamada desde preregistro.correr.
        from .puntaje import crear
        g = config["preregistro"]["ganadora_en_prueba"]
        puntaje = crear(g["familia"], g["parametros"], tabla)
    fin = max(v.dia for v in tabla.vins)
    hasta_ant = TRAMOS["entrenamiento_final"][1]
    tramos = {"prueba_final": (PRUEBA_DESDE, fin), "prueba_final_hasta_260": TRAMOS["prueba_final_hasta_260"]}
    salida_ = {"configuracion": config}

    comp = {}
    for nombre, (lo, hi) in tramos.items():
        idx = cupo.remuestreos(len(tabla.por_dia(lo, hi)))
        elegidos = _elegidos(tabla, puntaje, lo, hi)[1] if puntaje is not None else None
        resumen = None if puntaje is None else {"alternativa": puntaje.nombre, "parametros": puntaje.parametros}
        comp[nombre], _ = componente(tabla, idx, resumen, elegidos, tramo=f"prueba final {lo}–{hi}", lo=lo, hi=hi,
                                     fija_hasta=hasta_ant)
    salida_["componente"] = comp

    p0, general = referencia(tabla, hasta_ant, config["detector"]["peso_p0"])
    alarmas = alarmas_reales(tabla, p0, general, config["detector"]["h"], PRUEBA_DESDE, fin)
    cerca = config["detector"]["cerca_de_260_dia"]
    corte = TRAMOS["prueba_final_hasta_260"][1]
    salida_["detector"] = {**_resumen_alarmas(alarmas, PRUEBA_DESDE, fin),
                           "hasta_260": sum(d <= corte for _, d, _ in alarmas),
                           "despues_de_260": sum(d > corte for _, d, _ in alarmas),
                           f"a_{cerca}_dia_de_260": sum(abs(d - corte) <= cerca for _, d, _ in alarmas),
                           "lectura": "Observaciones, no causas."}

    grupo_de, k, _ = agrupar(tabla, config["subcategorizacion"]["k"], config["subcategorizacion"]["semilla"])
    filas = tabla_de_grupos(tabla, grupo_de, [("hasta_149", 0, ENTRENAMIENTO_HASTA),
                                              ("prueba_final", PRUEBA_DESDE, fin)])
    salida_["subcategorizacion"] = {"rotulo": "usa el historial, no predice", "k": k, "grupos": filas,
                                    "orden_en_prueba": orden_entre_grupos(filas, "hasta_149", "prueba_final")}
    if salida is not None:
        _escribir_detalle(salida, {"alarmas_prueba": [{"codigo": c, "dia": d, "sentido": s} for c, d, s in alarmas]})
    return salida_
