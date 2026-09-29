"""Etiquetas parciales y exploración (P5) sobre la ganadora de validación.

Hasta el Día 149 se conocen todas las etiquetas (el histórico de auditorías al
azar de Ford); los días 150–154 son el margen y no aportan etiquetas; desde el
155 la hoja elige y solo se conocen las etiquetas de lo elegido. Compiten el mínimo por código (P = 10, 20, 40) y Thompson; ε = 0,
ε = 20 % y el azar son referencias. También simula días de control alternados.
"""
import dataclasses

import numpy as np

from . import eleccion
from .cupo import (SEMILLA_BOOTSTRAP, SEMILLA_DESEMPATE, cupo, diario, elegir, metricas, remuestreos, resultado,
                   seleccionar)
from .datos import MARGEN, TRAMOS
from .puntaje import Contexto, Fuente, crear, registros_de, semilla_dia

SEMILLA_POLITICA = 20261004
PERIODOS = (10, 20, 40)
PESO_THOMPSON = 20
VENTANA_THOMPSON = 60  # Si la ganadora no tiene ventana propia.
COMPLETAS_HASTA = TRAMOS["entrenamiento"][1]  # Etiquetas completas: histórico al azar.
VALIDACION = TRAMOS["validacion"]


@dataclasses.dataclass
class Politica:
    nombre: str
    tipo: str  # "voraz", "minimo", "thompson", "epsilon", "azar"
    parametros: dict
    orden: tuple = (9,)
    elegible: bool = False
    familia: str = "politica"


def politicas():
    return ([Politica(f"mínimo por código, P = {p}", "minimo", {"P": p}, (1, -p), True) for p in PERIODOS]
            + [Politica("Thompson por código", "thompson", {"peso": PESO_THOMPSON}, (2,), True),
               Politica("ε = 0 (solo el ranking)", "voraz", {}),
               Politica("ε = 20 % al azar (referencia de costo)", "epsilon", {"epsilon": 0.2}),
               Politica("azar", "azar", {})])


def _por_ranking(vins, tasas, k, rng, excluir=()):
    resto = [v for v in vins if v.vin not in excluir]
    return seleccionar(resto, tasas, k, rng)


def _thompson(ctx, codigos, ventana, rng):
    hasta = ctx.t - MARGEN
    conocidas = ctx.conocidas(hasta, desde=hasta - ventana + 1)
    general = conocidas.general()
    conteos = conocidas.por_codigo()
    salida = {}
    for c in codigos:
        n, cal = conteos.get(c, (0.0, 0.0))
        salida[c] = float(rng.beta(PESO_THOMPSON * general + cal + 1e-9, PESO_THOMPSON * (1 - general) + n - cal + 1e-9))
    return salida


def elegir_dia(politica, puntaje, ctx, vins, k, ultima, rng_desempate, rng_politica):
    """Unidades elegidas un día según la política; `ultima` es el último día auditado por código."""
    codigos = sorted({v.codigo for v in vins})
    if politica.tipo == "azar":
        return seleccionar(vins, {c: 0.0 for c in codigos}, k, rng_desempate)
    tasas = puntaje.puntuar(ctx, codigos)
    if politica.tipo == "voraz":
        return seleccionar(vins, tasas, k, rng_desempate)
    if politica.tipo == "thompson":
        ventana = getattr(puntaje, "ventana", VENTANA_THOMPSON)
        return seleccionar(vins, _thompson(ctx, codigos, ventana, rng_politica), k, rng_desempate)
    if politica.tipo == "epsilon":
        m = int(round(politica.parametros["epsilon"] * k))
        al_azar = seleccionar(vins, {c: 0.0 for c in codigos}, m, rng_politica)
        return al_azar + _por_ranking(vins, tasas, k - m, rng_desempate, {v.vin for v in al_azar})
    # Mínimo por código: cada código programado sin auditoría en P días recibe 1, primero el más antiguo.
    p = politica.parametros["P"]
    vencidos = sorted((c for c in codigos if ctx.t - ultima.get(c, -10**6) >= p), key=lambda c: (ultima.get(c, -10**6), c))
    exploracion = []
    for c in vencidos[:k]:
        exploracion += seleccionar([v for v in vins if v.codigo == c], tasas, 1, rng_desempate)
    return exploracion + _por_ranking(vins, tasas, k - len(exploracion), rng_desempate, {v.vin for v in exploracion})


def simular_parcial(tabla, puntaje, politica, lo, hi, completas_hasta=COMPLETAS_HASTA, control=None,
                    semilla=SEMILLA_DESEMPATE):
    """Etiquetas completas hasta `completas_hasta`; la hoja elige desde `lo` y solo se conoce lo elegido.

    `control(t)` True marca un día de control: se elige al azar y sus etiquetas también alimentan la política.
    Devuelve (diario sobre [lo, hi], detalle por día con la fracción del cupo usada en exploración).
    """
    previas = [v for v in tabla.vins if v.dia <= completas_hasta]
    fuente = Fuente(registros_de(previas), desbloqueada=tabla.desbloqueada)
    ultima = {}
    for v in previas:
        ultima[v.codigo] = max(ultima.get(v.codigo, v.dia), v.dia)
    filas, detalle = [], []
    azar = Politica("azar", "azar", {})
    for t, vins in tabla.por_dia(lo, hi).items():
        k = cupo(len(vins))
        es_control = bool(control and control(t))
        ctx = Contexto(fuente, t)
        elegidos = elegir_dia(azar if es_control else politica, puntaje, ctx, vins, k, ultima,
                              semilla_dia(semilla, t), np.random.default_rng([SEMILLA_POLITICA, t]))
        assert len(elegidos) == k and len({v.vin for v in elegidos}) == k
        fuente.agregar(registros_de(elegidos))
        for v in elegidos:
            ultima[v.codigo] = t
        filas.append((t, len(vins), k, sum(v.calibrada for v in vins), sum(v.calibrada for v in elegidos)))
        detalle.append({"dia": t, "control": es_control})
    return diario(filas), detalle


def _resultado(politica, d, idx, tabla, tramo):
    return resultado(politica, d, idx, tabla, tramo, extra={"politica": politica.tipo,
                                                            "parametros_politica": politica.parametros})


def dias_de_control(tabla, puntaje, politica, lo, hi, idx_semilla=SEMILLA_BOOTSTRAP):
    """Alterna días con hoja y días al azar; compara las veces el azar estimadas con las reales."""
    dias = list(tabla.por_dia(lo, hi))
    control = {t for i, t in enumerate(dias) if i % 2 == 1}
    d, _ = simular_parcial(tabla, puntaje, politica, lo, hi, control=lambda t: t in control)
    hoja = np.array([t not in control for t in d.dias])
    h = diario(np.column_stack([d.dias, d.n, d.k, d.cal, d.cal_elegidas])[hoja].tolist())
    c = diario(np.column_stack([d.dias, d.n, d.k, d.cal, d.cal_elegidas])[~hoja].tolist())
    rng = np.random.default_rng(idx_semilla)
    ih = rng.integers(0, len(h.dias), size=(2000, len(h.dias)))
    ic = rng.integers(0, len(c.dias), size=(2000, len(c.dias)))
    prec_h = h.cal_elegidas[ih].sum(1) / h.k[ih].sum(1)
    prec_c = c.cal_elegidas[ic].sum(1) / c.k[ic].sum(1)
    real_h = metricas(h, ih)
    estimado = prec_h / prec_c
    return {"diseno": "días alternados en validación: pares con hoja, impares al azar; las etiquetas de ambos "
                      "alimentan la política",
            "dias_hoja": int(len(h.dias)), "dias_control": int(len(c.dias)),
            "precision_dias_hoja": float(h.cal_elegidas.sum() / h.k.sum()),
            "precision_dias_control": float(c.cal_elegidas.sum() / c.k.sum()),
            "veces_azar_estimado_con_control": float((h.cal_elegidas.sum() / h.k.sum())
                                                     / (c.cal_elegidas.sum() / c.k.sum())),
            "veces_azar_estimado_rango95": [float(np.percentile(estimado, 2.5)), float(np.percentile(estimado, 97.5))],
            "veces_azar_real_etiquetas_completas": real_h["veces_azar"],
            "veces_azar_real_rango95": real_h["veces_azar_rango95"],
            "lectura": "El control estima las veces el azar sin usar etiquetas de lo no elegido; su rango es más "
                       "ancho porque usa la mitad de los días."}


def evaluar(tabla, puntaje, lo=VALIDACION[0], hi=VALIDACION[1], tramo="validación 155–194"):
    idx = remuestreos(len(tabla.por_dia(lo, hi)))
    salida = []
    for politica in politicas():
        d, _ = simular_parcial(tabla, puntaje, politica, lo, hi)
        r = _resultado(politica, d, idx, tabla, tramo)
        r["diario"] = {k: getattr(d, k).astype(int).tolist() for k in ("dias", "n", "k", "cal", "cal_elegidas")}
        salida.append((r, d))
    return salida, idx


def correr(tabla, opciones=None):
    puntaje = eleccion.ganadora(tabla)
    evaluadas, idx = evaluar(tabla, puntaje)
    ganadora, detalle = elegir(evaluadas, idx)
    elegida = next(p for p in politicas() if p.nombre == ganadora["alternativa"])
    return {"pieza": "P5 etiquetas parciales y exploración", "tramo": "validación 155–194",
            "predictor": {"alternativa": puntaje.nombre, "familia": puntaje.familia, "parametros": puntaje.parametros},
            "supuesto": f"etiquetas completas hasta el Día {COMPLETAS_HASTA}; 150–154 sin etiquetas (margen); desde "
                        "el 155 la hoja elige y solo se conocen las etiquetas de lo elegido",
            "regla": "compiten el mínimo por código (P = 10, 20, 40) y Thompson; mayor precisión en el cupo y, si "
                     "empatan, la rotación con el P más largo; ε = 0, ε = 20 % y azar son referencias",
            "resultados": [r for r, _ in evaluadas], "eleccion": detalle,
            "politica": {"nombre": elegida.nombre, "tipo": elegida.tipo, "parametros": elegida.parametros},
            "minimo_por_codigo": {"P": elegida.parametros.get("P")},
            "dias_de_control": dias_de_control(tabla, puntaje, elegida, *VALIDACION)}


def configuracion():
    return {"completas_hasta_prueba": TRAMOS["entrenamiento_final"][1], "periodos": list(PERIODOS),
            "peso_thompson": PESO_THOMPSON, "semilla_politica": SEMILLA_POLITICA}


def prueba(tabla, config):
    """Hook de P7: lee la política preregistrada en la prueba final con la tabla desbloqueada.

    Etiquetas completas hasta el 194; 195–199 sin etiquetas; desde el 200 solo las de lo elegido.
    """
    assert tabla.desbloqueada, "Solo con el preregistro acordado"
    politica = next(p for p in politicas() if p.tipo == config["politica"]["tipo"]
                    and p.parametros == config["politica"]["parametros"])
    puntaje = config.get("puntaje") or crear(config["ganadora"]["familia"], config["ganadora"]["parametros"], tabla)
    lo, hi = TRAMOS["prueba_final"][0], max(v.dia for v in tabla.vins)
    idx = remuestreos(len(tabla.por_dia(lo, hi)))
    salida = []
    for p in (politica, Politica("ε = 0 (solo el ranking)", "voraz", {}), Politica("azar", "azar", {})):
        d, _ = simular_parcial(tabla, puntaje, p, lo, hi, completas_hasta=TRAMOS["entrenamiento_final"][1])
        salida.append(_resultado(p, d, idx, tabla, "prueba final >= 200, etiquetas parciales"))
    return {"resultados": salida}
