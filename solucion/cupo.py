"""Evaluador del cupo diario (P1): selección, métricas, bootstrap por días y regla de elección."""
import dataclasses
import subprocess

import numpy as np

from .datos import PRUEBA_DESDE, RAIZ
from .puntaje import Contexto, Fuente, registros_de, semilla_dia

SEMILLA_DESEMPATE = 20261002
SEMILLA_BOOTSTRAP = 20261003
REMUESTREOS = 2000
CALIFICADOR = "entre auditados con actividad QLS, {tramo}, base ficticia, n = {n} VIN"


def cupo(n):
    """k_d = max(1, floor(0,05·N_d)); N_d // 20 es la misma cuenta en enteros."""
    return max(1, n // 20) if n else 0


def seleccionar(vins, tasas, k, rng, por_vin=False):
    """Los k de mayor tasa de su código (o de su VIN, solo en el anexo); empates al azar con semilla."""
    claves = rng.random(len(vins))
    clave = (lambda v: v.vin) if por_vin else (lambda v: v.codigo)
    orden = sorted(range(len(vins)), key=lambda i: (-tasas[clave(vins[i])], claves[i]))
    return [vins[i] for i in orden[:k]]


@dataclasses.dataclass
class Diario:
    """Resultado día por día de una selección sobre un tramo."""
    dias: np.ndarray
    n: np.ndarray
    k: np.ndarray
    cal: np.ndarray
    cal_elegidas: np.ndarray


def fuente_completa(tabla):
    """Etiquetas completas visibles: todo VIN antes de la prueba final (o todos si está desbloqueada)."""
    return Fuente(registros_de([v for v in tabla.vins if tabla.desbloqueada or v.dia < PRUEBA_DESDE]),
                  desbloqueada=tabla.desbloqueada)


def simular(tabla, puntaje, lo, hi, fuente=None, semilla=SEMILLA_DESEMPATE, al_elegir=None):
    """Aplica el puntaje cada día del tramo y llena el cupo diario."""
    fuente = fuente or fuente_completa(tabla)
    filas = []
    for t, vins in tabla.por_dia(lo, hi).items():
        ctx = Contexto(fuente, t, permite_futuro=getattr(puntaje, "usa_futuro", False))
        por_vin = getattr(puntaje, "por_vin", False)  # Solo el anexo de historial puntúa unidades.
        tasas = puntaje.puntuar(ctx, vins if por_vin else sorted({v.codigo for v in vins}))
        k = cupo(len(vins))
        elegidos = seleccionar(vins, tasas, k, semilla_dia(semilla, t), por_vin)
        if al_elegir is not None:
            al_elegir(t, vins, elegidos)
        filas.append((t, len(vins), k, sum(v.calibrada for v in vins), sum(v.calibrada for v in elegidos)))
    return diario(filas)


def diario(filas):
    columnas = np.array(filas, dtype=float).reshape(-1, 5).T
    return Diario(*columnas)


def remuestreos(n_dias, semilla=SEMILLA_BOOTSTRAP, r=REMUESTREOS):
    """Un único juego de índices de días, compartido por todas las alternativas del tramo."""
    return np.random.default_rng(semilla).integers(0, n_dias, size=(r, n_dias))


def _sumas(d, idx):
    k, cal_el = d.k[idx].sum(-1), d.cal_elegidas[idx].sum(-1)
    esperado = (d.k * np.divide(d.cal, d.n, out=np.zeros_like(d.cal), where=d.n > 0))[idx].sum(-1)
    return k, cal_el, esperado, d.cal[idx].sum(-1)


def _rango(x):
    x = x[np.isfinite(x)]
    return [float(np.percentile(x, 2.5)), float(np.percentile(x, 97.5))] if len(x) else None


def metricas(d, idx):
    todos = np.arange(len(d.dias))
    k, cal_el, esperado, cal = _sumas(d, todos)
    bk, bcal_el, besperado, bcal = _sumas(d, idx)
    with np.errstate(divide="ignore", invalid="ignore"):
        bprec, bazar = bcal_el / bk, besperado / bk
        blift, brec, bdif = bprec / bazar, bcal_el / bcal, bprec - bazar
    precision, azar = cal_el / k, esperado / k
    dif = _rango(bdif)
    lectura = None if dif is None else "mejora" if dif[0] > 0 else "peor" if dif[1] < 0 else "inconcluso"
    return {"dias": int(len(d.dias)), "vins": int(d.n.sum()), "elegidos": int(k), "calibrada_elegidas": int(cal_el),
            "calibrada_tramo": int(cal), "precision_cupo": float(precision), "precision_rango95": _rango(bprec),
            "azar_mismo_cupo": float(azar), "veces_azar": float(precision / azar) if azar else None,
            "veces_azar_rango95": _rango(blift) if azar else None,
            "recupero": float(cal_el / cal) if cal else None, "recupero_rango95": _rango(brec) if cal else None,
            "diferencia_con_azar_rango95": dif, "lectura": lectura}


def diferencia(d_ref, d_alt, idx):
    """Rango del 95 % de precisión(alt) − precisión(ref), pareado por días."""
    assert np.array_equal(d_ref.dias, d_alt.dias), "Diferencia pareada con días distintos"
    _, a, _, _ = _sumas(d_alt, idx)
    kr, r, _, _ = _sumas(d_ref, idx)
    return _rango((a - r) / kr)


def version_codigo():
    try:
        commit = subprocess.run(["git", "rev-parse", "HEAD"], cwd=RAIZ, capture_output=True, text=True,
                                check=True).stdout.strip()
        sucio = subprocess.run(["git", "status", "--porcelain", "--", "solucion", ":!solucion/resultados"], cwd=RAIZ,
                               capture_output=True, text=True).stdout.strip()  # Los resultados no son código.
        return commit + ("+cambios" if sucio else "")
    except (OSError, subprocess.CalledProcessError):
        return "desconocida"


def resultado(puntaje, d, idx, tabla, tramo, extra=None):
    """Registro del contrato común para una evaluación."""
    m = metricas(d, idx)
    return {"alternativa": puntaje.nombre, "familia": puntaje.familia, "parametros": puntaje.parametros,
            "orden_simplicidad": list(puntaje.orden), "elegible": puntaje.elegible, "tramo": tramo,
            "calificador": CALIFICADOR.format(tramo=tramo, n=m["vins"]), **m,
            "semillas": {"desempate": SEMILLA_DESEMPATE, "bootstrap": SEMILLA_BOOTSTRAP, "remuestreos": len(idx)},
            "fuente_sha256": tabla.fuente.get("csv_sha256"), "catalogo_sha256": tabla.fuente.get("catalogo_sha256"),
            "version_codigo": version_codigo(), **(extra or {})}


def elegir_por_precision(candidatas):
    """Regla del 30/09: gana la elegible de mayor precisión acumulada en los tramos de selección.

    No hay desempate por simplicidad (enmienda al punto 8 de #10). `candidatas`: resultados con `elegible`,
    `alternativa`, `precision_cupo` (acumulada) y `precision_por_bloque`. Ante un empate exacto gana la de menor
    varianza entre bloques y, si persiste, la de menor nombre: el resultado es determinista.
    Devuelve (ganadora, ranking de todas las elegibles).
    """
    def clave(r):
        por_bloque = r["precision_por_bloque"]
        return (-r["precision_cupo"], float(np.var(por_bloque)) if len(por_bloque) > 1 else 0.0, r["alternativa"])

    ranking = sorted((r for r in candidatas if r["elegible"]), key=clave)
    return ranking[0], ranking


def elegir(candidatas, idx):
    """Regla de #10: mayor precisión en el cupo; empate si el rango pareado incluye 0; gana la más simple.

    `candidatas`: lista de (resultado, diario). Devuelve (ganadora, tabla de empates).
    Entre empatadas con el mismo orden de simplicidad decide la precisión.
    """
    elegibles = [(r, d) for r, d in candidatas if r["elegible"]]
    mejor_r, mejor_d = max(elegibles, key=lambda x: x[0]["precision_cupo"])
    comparacion = []
    for r, d in elegibles:
        rango = [0.0, 0.0] if r is mejor_r else diferencia(mejor_d, d, idx)
        comparacion.append({"alternativa": r["alternativa"], "precision_cupo": r["precision_cupo"],
                            "diferencia_con_mejor_rango95": rango, "empata": rango[0] <= 0 <= rango[1]})
    empatadas = [r for (r, _), c in zip(elegibles, comparacion) if c["empata"]]
    ganadora = min(empatadas, key=lambda r: (r["orden_simplicidad"], -r["precision_cupo"]))
    return ganadora, {"mejor_precision": mejor_r["alternativa"], "ganadora": ganadora["alternativa"],
                      "comparacion": comparacion}
