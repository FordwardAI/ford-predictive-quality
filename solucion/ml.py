"""ML sobre el código (P4): siete familias base, promedio y stacking, en modo fijo y reentrenado.

Con el código de catálogo como único predictor, cada modelo estima la tasa CALIBRADA
por código (#10, puntos 3 a 5). Las etiquetas llegan solo por `Contexto.conocidas`.

- fijo: entrenado una vez con Día <= hasta (149; el preregistro lo recrea con 194).
- reentrenado: cada 5 días; el día t usa el modelo del día r (155, 160, … <= t)
  con Día <= r − 5 y peso por antigüedad de vida media `vida` respecto de r.
- Hiperparámetros y vida: por log-loss, ajustando con <= 119 y evaluando en 125–149.
- Los códigos sin historial en el entrenamiento reciben la tasa general (#7, punto 6).
"""
import dataclasses
import hashlib
import math
import warnings

import numpy as np

from .cupo import fuente_completa
from .datos import MARGEN, TRAMOS
from .puntaje import Contexto, Puntaje, completar, media_vida, registrar
from .referencias import ENTRENAMIENTO_HASTA, VALIDACION, VIDAS, evaluar

AJUSTE_HASTA = TRAMOS["ajuste_interno"][1]
EVALUACION_INTERNA = TRAMOS["evaluacion_interna"]
REENTRENO_DESDE, CADA = VALIDACION[0], 5
SEMILLAS = (1, 2, 3, 4, 5)  # Fijadas antes de evaluar (#10, punto 5).
MODOS = ("fijo", "reentrenado")
EPS = 1e-6


def dia_reentreno(t, ancla=REENTRENO_DESDE):
    """Último día de reentrenamiento <= t en la grilla ancla, ancla+5, ancla+10, … (155, 160, … por defecto)."""
    return ancla + CADA * ((t - ancla) // CADA)


# --- Familias base -------------------------------------------------------------------------------

def _logistica(h, semilla):
    from sklearn.linear_model import LogisticRegression
    return LogisticRegression(C=h["C"], max_iter=2000)


def _nb(h, semilla):
    from sklearn.naive_bayes import CategoricalNB
    return CategoricalNB(alpha=h["alpha"])


def _rf(h, semilla):
    from sklearn.ensemble import RandomForestClassifier
    return RandomForestClassifier(n_estimators=200, min_samples_leaf=h["min_samples_leaf"], max_features="sqrt",
                                  random_state=semilla, n_jobs=-1)


def _xgboost(h, semilla):
    from xgboost import XGBClassifier
    return XGBClassifier(n_estimators=300, learning_rate=0.05, max_depth=3, reg_lambda=h["reg_lambda"],
                         tree_method="hist", random_state=0, n_jobs=4, verbosity=0)


def _lightgbm(h, semilla):
    from lightgbm import LGBMClassifier
    # Filas agregadas: min_child_samples y min_data_in_bin cuentan filas, no VIN; se regulariza por hessiana.
    return LGBMClassifier(n_estimators=300, learning_rate=0.05, num_leaves=8, min_child_samples=1,
                          min_child_weight=h["min_child_weight"], min_data_in_bin=1, deterministic=True,
                          force_row_wise=True, random_state=0, n_jobs=4, verbose=-1)


def _catboost(h, semilla):
    from catboost import CatBoostClassifier
    # Sin bootstrap: sobre filas agregadas remuestrearía grupos código × etiqueta, no VIN.
    return CatBoostClassifier(iterations=300, learning_rate=0.1, depth=4, l2_leaf_reg=h["l2_leaf_reg"],
                              bootstrap_type="No", random_seed=semilla, verbose=0, thread_count=4,
                              allow_writing_files=False)


def _mlp(h, semilla):
    from sklearn.neural_network import MLPClassifier
    return MLPClassifier(hidden_layer_sizes=(8,), alpha=h["alpha"], solver="lbfgs", max_iter=1000,
                         random_state=semilla)


@dataclasses.dataclass(frozen=True)
class Familia:
    nombre: str
    orden: tuple
    construir: object
    grilla: tuple
    estocastica: bool = False
    por_vin: bool = False  # Filas por VIN (RF: su bootstrap difiere sobre filas agregadas).
    indice: bool = False  # El código como índice categórico en vez de one-hot (NB).


FAMILIAS = {
    "logistica": Familia("logística", (5, 0), _logistica, tuple({"C": c} for c in (0.01, 0.1, 1.0, 10.0))),
    "nb": Familia("Naive Bayes", (6, 0), _nb, tuple({"alpha": a} for a in (0.1, 1.0, 10.0, 100.0)), indice=True),
    "rf": Familia("Random Forest", (7, 0), _rf, tuple({"min_samples_leaf": m} for m in (5, 50, 200)),
                  estocastica=True, por_vin=True),
    "xgboost": Familia("XGBoost", (7, 1), _xgboost, tuple({"reg_lambda": r} for r in (1.0, 10.0, 100.0))),
    "lightgbm": Familia("LightGBM", (7, 2), _lightgbm, tuple({"min_child_weight": m} for m in (1.0, 10.0, 100.0))),
    "catboost": Familia("CatBoost", (7, 3), _catboost, tuple({"l2_leaf_reg": x} for x in (1.0, 10.0, 100.0)),
                        estocastica=True),
    "mlp": Familia("MLP", (8, 0), _mlp, tuple({"alpha": a} for a in (1e-4, 1e-2, 1.0)), estocastica=True),
}


# --- Ajuste de un modelo sobre las etiquetas conocidas ---------------------------------------------

def _huella(conocidas):
    """Contenido de las etiquetas: dos Conocidas con los mismos conteos comparten modelo en la caché."""
    h = hashlib.sha1(repr((conocidas.codigos, conocidas.desde, conocidas.hasta)).encode())
    h.update(conocidas.n.tobytes())
    h.update(conocidas.cal.tobytes())
    return h.hexdigest()


def _peso(vida, ref):
    return None if vida is None else media_vida(vida, ref)


def _filas_por_vin(conocidas, peso):
    """Una fila por VIN (código, etiqueta, peso por antigüedad de su día)."""
    codigos, ys, ws = [], [], []
    w_dia = np.ones(len(conocidas.dias)) if peso is None else np.array([peso(d) for d in conocidas.dias])
    for i, codigo in enumerate(conocidas.codigos):
        for j in np.nonzero(conocidas.n[i])[0]:
            n, cal = int(conocidas.n[i, j]), int(conocidas.cal[i, j])
            codigos += [codigo] * n
            ys += [1] * cal + [0] * (n - cal)
            ws += [w_dia[j]] * n
    return codigos, np.array(ys), np.array(ws, dtype=float)


class Indice(dict):
    """Índice código → columna. Con atributos, `categorias` mapea (posición, valor) → columna extra."""
    categorias = None


def _matriz(familia, codigos, indice, atributos=None):
    if atributos is not None:
        ancho = len(indice)
        x = np.zeros((len(codigos), ancho + len(indice.categorias)), dtype=np.float32)
        for r, c in enumerate(codigos):
            if c in indice:
                x[r, indice[c]] = 1.0
            for j, v in enumerate(atributos.get(c, ())):
                k = indice.categorias.get((j, v))
                if k is not None:
                    x[r, ancho + k] = 1.0
        return x
    pos = np.array([indice[c] for c in codigos], dtype=int)
    if familia.indice:
        return pos.reshape(-1, 1)
    x = np.zeros((len(codigos), len(indice)), dtype=np.float32)
    x[np.arange(len(codigos)), pos] = 1.0
    return x


_MODELOS = {}


def entrenar(base, hiper, semilla, conocidas, vida=None, ref=None, atributos=None):
    """(modelo, índice de códigos con historial). Caché por contenido de las etiquetas y configuración.

    Con `atributos` ({código: atributos leídos del propio código}), las columnas suman los atributos del código:
    un código con pocos datos toma fuerza de los que se le parecen. No entra ninguna etiqueta por esa vía.
    """
    familia = FAMILIAS[base]
    semilla = semilla if familia.estocastica else None
    assert atributos is None or not familia.indice, "Los atributos no aplican al modelo con el código como índice"
    clave = (base, tuple(sorted(hiper.items())), semilla, vida, ref if vida is not None else None, _huella(conocidas),
             atributos is not None)
    if clave not in _MODELOS:
        peso = _peso(vida, ref)
        indice = Indice((c, i) for i, c in enumerate(sorted(conocidas.por_codigo(peso=peso))))
        if atributos is not None:
            valores = sorted({(j, v) for c in indice for j, v in enumerate(atributos.get(c, ()))})
            indice.categorias = {jv: k for k, jv in enumerate(valores)}
        if familia.por_vin:
            codigos, y, w = _filas_por_vin(conocidas, peso)
        else:
            filas = list(conocidas.filas(peso=peso))
            codigos, y, w = [f[0] for f in filas], np.array([f[1] for f in filas]), np.array([f[2] for f in filas])
        modelo = familia.construir(hiper, semilla)
        if familia.indice:
            modelo.set_params(min_categories=len(indice))
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            modelo.fit(_matriz(familia, codigos, indice, atributos), y, sample_weight=w)
        if "n_jobs" in modelo.get_params() and familia.por_vin:
            modelo.set_params(n_jobs=1)  # RF: predecir en paralelo suma los árboles en orden variable.
        _MODELOS[clave] = (modelo, indice)
    return _MODELOS[clave]


def estimar(base, hiper, semilla, conocidas, codigos, vida=None, ref=None, atributos=None):
    """Tasa estimada para los códigos pedidos que tienen historial (o, con atributos, agrupación)."""
    modelo, indice = entrenar(base, hiper, semilla, conocidas, vida, ref, atributos)
    conocidos = [c for c in codigos if c in indice or (atributos is not None and c in atributos)]
    if not conocidos:
        return {}
    p = modelo.predict_proba(_matriz(FAMILIAS[base], conocidos, indice, atributos))[:, 1]
    return dict(zip(conocidos, p.astype(float)))


def _logit(p):
    p = min(max(p, EPS), 1 - EPS)
    return math.log(p / (1 - p))


def log_loss(tasas, prueba):
    """Log-loss por VIN del tramo `prueba` con las tasas por código."""
    total = n_total = 0.0
    for c, (n, cal) in prueba.por_codigo().items():
        p = min(max(tasas[c], EPS), 1 - EPS)
        total -= cal * math.log(p) + (n - cal) * math.log(1 - p)
        n_total += n
    return total / n_total


# --- Alternativas ----------------------------------------------------------------------------------

class ModeloML(Puntaje):
    """Base de las alternativas de ML: resuelve qué etiquetas usa cada modo y el respaldo general."""
    orden_familia = (99, 0)
    nombre_familia = "ML"

    def __init__(self, modo, semilla=None, hasta=ENTRENAMIENTO_HASTA, detalle_vida="", ancla=REENTRENO_DESDE):
        assert modo in MODOS
        self.modo, self.semilla, self.hasta, self.ancla = modo, semilla, hasta, ancla
        self.orden = (*self.orden_familia, MODOS.index(modo))
        detalle = f"fijo (<= {hasta})" if modo == "fijo" else f"reentrenado cada {CADA} d, {detalle_vida}"
        self.nombre = f"{self.nombre_familia} {detalle}" + ("" if semilla is None else f", semilla {semilla}")
        self.parametros = {"modo": modo, **({"hasta": hasta} if modo == "fijo" else {}), "semilla": semilla,
                           **({"ancla": ancla} if ancla != REENTRENO_DESDE else {})}

    def entrenamiento(self, ctx):
        """(conocidas, día de referencia del peso) según el modo."""
        if self.modo == "fijo":
            return ctx.conocidas(self.hasta), None
        r = dia_reentreno(ctx.t, self.ancla)
        return ctx.conocidas(r - MARGEN), r

    def puntuar(self, ctx, codigos):
        conocidas, ref = self.entrenamiento(ctx)
        return completar(self.estimar(conocidas, codigos, ref), codigos, self.general(conocidas, ref))

    def estimar(self, conocidas, codigos, ref):
        raise NotImplementedError

    def general(self, conocidas, ref):
        raise NotImplementedError


class ModeloBase(ModeloML):
    base = None

    def __init__(self, modo, hiperparametros, semilla=None, hasta=ENTRENAMIENTO_HASTA, vida=None,
                 ancla=REENTRENO_DESDE, atributos=None):
        assert (vida is None) == (modo == "fijo"), "La vida media solo aplica al modo reentrenado"
        if not FAMILIAS[self.base].estocastica:
            semilla = None
        super().__init__(modo, semilla, hasta, f"vida media {vida} d", ancla)
        self.hiper, self.vida, self.atributos = dict(hiperparametros), vida, atributos
        self.parametros = {**self.parametros, **({} if vida is None else {"vida": vida}),
                           "hiperparametros": self.hiper}

    def estimar(self, conocidas, codigos, ref):
        return estimar(self.base, self.hiper, self.semilla, conocidas, codigos, self.vida, ref, self.atributos)

    def general(self, conocidas, ref):
        return conocidas.general(peso=_peso(self.vida, ref))


ATRIBUTOS_FAMILIAS = ("logistica", "rf", "xgboost", "lightgbm", "catboost", "mlp")  # NB usa el código como índice.


def _base_atributos(clave):
    familia = FAMILIAS[clave]
    return type(f"MLA_{clave}", (ModeloBase,), {
        "familia": f"ml_{clave}_atributos", "base": clave, "orden_familia": familia.orden,
        "nombre_familia": f"{familia.nombre} con atributos del código", "necesita_atributos": True,
        "__doc__": f"{familia.nombre} sobre el código y sus atributos (mercado, motor, tracción, versión)"})


def _base(clave):
    familia = FAMILIAS[clave]
    return type(f"ML_{clave}", (ModeloBase,), {"familia": f"ml_{clave}", "base": clave, "orden_familia": familia.orden,
                                                "nombre_familia": familia.nombre, "__doc__": familia.nombre})


BASES = {clave: registrar(_base(clave)) for clave in FAMILIAS}
BASES_ATRIBUTOS = {clave: registrar(_base_atributos(clave)) for clave in ATRIBUTOS_FAMILIAS}


class Combinado(ModeloML):
    """Combina las 7 bases, cada una con su configuración (y su vida media) para el modo."""

    familias = tuple(FAMILIAS)

    def __init__(self, modo, bases, semilla=None, hasta=ENTRENAMIENTO_HASTA, ancla=REENTRENO_DESDE, atributos=None):
        assert set(bases) == set(self.familias)
        super().__init__(modo, semilla, hasta, "vida media de cada base", ancla)
        self.atributos = atributos
        self.bases = {b: {"hiperparametros": dict(bases[b]["hiperparametros"]), "vida": bases[b]["vida"]}
                      for b in self.familias}
        self.parametros = {**self.parametros, "bases": self.bases}

    def predicciones(self, conocidas, codigos, ref):
        """{base: {código: tasa}} para los códigos con historial (los mismos en todas las bases)."""
        return {b: estimar(b, c["hiperparametros"], self.semilla, conocidas, codigos, c["vida"], ref, self.atributos)
                for b, c in self.bases.items()}

    def general(self, conocidas, ref):
        """Promedio de la tasa general de cada base (difieren solo por su peso por antigüedad)."""
        return float(np.mean([conocidas.general(peso=_peso(c["vida"], ref)) for c in self.bases.values()]))


@registrar
class Promedio(Combinado):
    """Promedio simple de las tasas estimadas por las 7 bases."""
    familia, orden_familia, nombre_familia = "ml_promedio", (9, 0), "promedio de modelos"

    def estimar(self, conocidas, codigos, ref):
        return promediar(self.predicciones(conocidas, codigos, ref))


@registrar
class Stacking(Combinado):
    """Meta-modelo logístico sobre el logit de las 7 bases, ajustado en 125–149 y congelado."""
    familia, orden_familia, nombre_familia = "ml_stacking", (10, 0), "stacking"

    def __init__(self, modo, bases, meta, semilla=None, hasta=ENTRENAMIENTO_HASTA, ancla=REENTRENO_DESDE):
        super().__init__(modo, bases, semilla, hasta, ancla)
        self.meta = {"coeficientes": [float(x) for x in meta["coeficientes"]], "intercepto": float(meta["intercepto"])}
        self.parametros = {**self.parametros, "meta": self.meta}

    def estimar(self, conocidas, codigos, ref):
        return apilar(self.meta, self.predicciones(conocidas, codigos, ref))


@registrar
class PromedioAtributos(Combinado):
    """Promedio simple de las 6 bases con atributos del código."""
    familia, orden_familia, nombre_familia = "ml_promedio_atributos", (9, 1), "promedio de modelos con atributos"
    familias, necesita_atributos = ATRIBUTOS_FAMILIAS, True


def promediar(pred):
    codigos = next(iter(pred.values()))
    return {c: float(np.mean([p[c] for p in pred.values()])) for c in codigos}


def apilar(meta, pred):
    codigos = next(iter(pred.values()))
    return {c: combinar(meta, [p[c] for p in pred.values()]) for c in codigos}


def combinar(meta, tasas):
    z = meta["intercepto"] + sum(a * _logit(p) for a, p in zip(meta["coeficientes"], tasas))
    return 1.0 / (1.0 + math.exp(-z))


# --- Ajuste interno (<= 119 contra 125–149) --------------------------------------------------------

def fin_interno(ancla=REENTRENO_DESDE):
    """Último día de la evaluación interna para un bloque que empieza en `ancla` (149 para 155)."""
    return ancla - 1 - MARGEN


def tramos_internos(fuente, ancla=REENTRENO_DESDE):
    """(ajuste <= 119, evaluación 125–149) para el ancla 155; se corren con el ancla para otros bloques."""
    fin = fin_interno(ancla)
    assert ancla != REENTRENO_DESDE or (fin - 30, fin - 24, fin) == (AJUSTE_HASTA, *EVALUACION_INTERNA)
    ctx = Contexto(fuente, t=fin + MARGEN)
    return ctx.conocidas(fin - 30), ctx.conocidas(fin, desde=fin - 24)


def _tasas_internas(ajuste, prueba, estimador, vida, ref=AJUSTE_HASTA):
    codigos = sorted(prueba.por_codigo())
    general = ajuste.general(peso=_peso(vida, ref))
    return completar(estimador(ajuste, codigos, ref), codigos, general)


def ajustar(base, modo, fuente, ancla=REENTRENO_DESDE, atributos=None):
    """Configuración de menor log-loss interna; las estocásticas se ajustan con la primera semilla."""
    ajuste, prueba = tramos_internos(fuente, ancla)
    ref = fin_interno(ancla) - 30
    semilla = SEMILLAS[0] if FAMILIAS[base].estocastica else None
    grilla = []
    for hiper in FAMILIAS[base].grilla:
        for vida in ((None,) if modo == "fijo" else VIDAS):
            tasas = _tasas_internas(ajuste, prueba,
                                    lambda a, c, r: estimar(base, hiper, semilla, a, c, vida, r, atributos), vida, ref)
            grilla.append({"hiperparametros": hiper, "vida": vida, "log_loss": log_loss(tasas, prueba)})
    mejor = min(grilla, key=lambda g: g["log_loss"])  # Empates: el primero de la grilla.
    return {"hiperparametros": mejor["hiperparametros"], "vida": mejor["vida"], "log_loss_interna": mejor["log_loss"],
            "grilla": grilla, "semilla_ajuste": semilla}


def ajustar_meta(bases, modo, semilla, fuente, ancla=REENTRENO_DESDE):
    """Meta logístico: las bases entrenadas con <= 119 predicen 125–149 y el meta se congela.

    Se ajusta solo sobre códigos con historial en <= 119, los únicos que combina después.
    Devuelve (meta, log-loss interna del stacking, log-loss interna del promedio).
    """
    from sklearn.linear_model import LogisticRegression
    ajuste, prueba = tramos_internos(fuente, ancla)
    ref = fin_interno(ancla) - 30
    codigos = sorted(prueba.por_codigo())
    combinado = Promedio(modo, bases, semilla)
    pred = combinado.predicciones(ajuste, codigos, ref)
    general = combinado.general(ajuste, ref)
    filas = [f for f in prueba.filas() if f[0] in pred["logistica"]]
    x = np.array([[_logit(p[f[0]]) for p in pred.values()] for f in filas])
    modelo = LogisticRegression(C=1.0, max_iter=2000).fit(x, [f[1] for f in filas], sample_weight=[f[2] for f in filas])
    meta = {"coeficientes": modelo.coef_[0].tolist(), "intercepto": float(modelo.intercept_[0])}
    return (meta, log_loss(completar(apilar(meta, pred), codigos, general), prueba),
            log_loss(completar(promediar(pred), codigos, general), prueba))


# --- Corrida de la pieza ---------------------------------------------------------------------------

def alternativas(fuente, ancla=REENTRENO_DESDE, atributos=None):
    """{(familia, modo): [(instancia, extra)]}, una instancia por semilla, con la configuración ya ajustada.

    `ancla` es el primer día del bloque evaluado (155 en la validación): el modo fijo entrena con Día <= ancla−6, el
    reentrenado empieza a reentrenar en `ancla`, y los hiperparámetros se eligen con los 55 días anteriores.
    Con `atributos` se arman las variantes que suman los atributos del código (sin Naive Bayes ni stacking).
    """
    claves = ATRIBUTOS_FAMILIAS if atributos else tuple(FAMILIAS)
    clases = BASES_ATRIBUTOS if atributos else BASES
    sufijo = "_atributos" if atributos else ""
    hasta = fin_interno(ancla)
    opciones = {"atributos": atributos} if atributos else {}
    ajustes = {(b, m): ajustar(b, m, fuente, ancla, atributos) for b in claves for m in MODOS}
    grupos = {}
    for (b, m), a in ajustes.items():
        semillas = SEMILLAS if FAMILIAS[b].estocastica else (None,)
        extra = {"log_loss_interna": a["log_loss_interna"],
                 "ajuste_interno": {"grilla": a["grilla"], "semilla_ajuste": a["semilla_ajuste"]}}
        grupos[(f"ml_{b}{sufijo}", m)] = [
            (clases[b](m, a["hiperparametros"], s, hasta=hasta, vida=a["vida"], ancla=ancla, **opciones), extra)
            for s in semillas]
    for m in MODOS:
        bases = {b: {"hiperparametros": ajustes[(b, m)]["hiperparametros"], "vida": ajustes[(b, m)]["vida"]}
                 for b in claves}
        if atributos:
            grupos[("ml_promedio_atributos", m)] = [
                (PromedioAtributos(m, bases, s, hasta=hasta, ancla=ancla, atributos=atributos), {}) for s in SEMILLAS]
            continue
        promedio, stacking = [], []
        for s in SEMILLAS:
            meta, ll_stacking, ll_promedio = ajustar_meta(bases, m, s, fuente, ancla)
            promedio.append((Promedio(m, bases, s, hasta=hasta, ancla=ancla), {"log_loss_interna": ll_promedio}))
            stacking.append((Stacking(m, bases, meta, s, hasta=hasta, ancla=ancla),
                             {"log_loss_interna": ll_stacking, "log_loss_interna_nota": "en la misma muestra del meta"}))
        grupos[("ml_promedio", m)], grupos[("ml_stacking", m)] = promedio, stacking
    return grupos


def mediana_semillas(resultados):
    """La corrida de precisión mediana entre semillas (empates por semilla) y la dispersión."""
    orden = sorted(resultados, key=lambda r: (r["precision_cupo"], r["parametros"]["semilla"]))
    elegido = orden[len(orden) // 2]
    precisiones = [r["precision_cupo"] for r in resultados]
    return {**elegido, "semillas_modelo": {"semillas": [r["parametros"]["semilla"] for r in resultados],
                                           "precisiones": precisiones, "mediana": elegido["precision_cupo"],
                                           "min": min(precisiones), "max": max(precisiones)}}


def correr(tabla, opciones=None):
    grupos = alternativas(fuente_completa(tabla))
    planos = [(clave, p, extra) for clave, lista in grupos.items() for p, extra in lista]
    evaluados = evaluar(tabla, [p for _, p, _ in planos])
    por_grupo = {}
    for (clave, _, extra), r in zip(planos, evaluados):
        por_grupo.setdefault(clave, []).append({**r, **extra})
    resultados = sorted((rs[0] if len(rs) == 1 else mediana_semillas(rs) for rs in por_grupo.values()),
                        key=lambda r: r["orden_simplicidad"])
    return {"pieza": "P4 ML sobre el código", "tramo": "validación 155–194", "resultados": resultados}
