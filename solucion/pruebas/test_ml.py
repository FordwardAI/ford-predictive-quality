"""ML sobre el código (P4) con datos sintéticos: respaldo, margen del reentrenado, orden y reconstrucción."""
import json

from solucion import ml
from solucion.cupo import fuente_completa
from solucion.puntaje import Contexto, crear
from solucion.pruebas.sintetico import TASAS, tabla

CODIGOS = sorted(TASAS)


class Espia(Contexto):
    """Registra cada `hasta` pedido; Contexto sigue verificando el margen."""

    def __init__(self, fuente, t):
        super().__init__(fuente, t)
        self.pedidos = []

    def conocidas(self, hasta, desde=None):
        self.pedidos.append(hasta)
        return super().conocidas(hasta, desde)


def _logistica(modo="fijo", vida=None):
    return ml.BASES["logistica"](modo, {"C": 1.0}, vida=vida)


def test_codigo_nuevo_recibe_tasa_general():
    fuente = fuente_completa(tabla())
    ctx = Contexto(fuente, 170)
    tasas = _logistica().puntuar(ctx, CODIGOS + ["ZZZ9"])
    assert abs(tasas["ZZZ9"] - ctx.conocidas(149).general()) < 1e-12
    general = ctx.conocidas(165).general(peso=ml.media_vida(30, 170))  # r = 170.
    assert abs(_logistica("reentrenado", 30).puntuar(ctx, ["ZZZ9"])["ZZZ9"] - general) < 1e-12


def test_reentrenado_usa_hasta_r_menos_5():
    fuente = fuente_completa(tabla())
    p = _logistica("reentrenado", 15)
    for t in range(155, 172):
        ctx = Espia(fuente, t)
        p.puntuar(ctx, CODIGOS)
        r = 155 + 5 * ((t - 155) // 5)
        assert ml.dia_reentreno(t) == r and ctx.pedidos == [r - 5], (t, ctx.pedidos)


def test_logistica_fija_ordena_los_codigos():
    tasas = _logistica().puntuar(Contexto(fuente_completa(tabla()), 170), CODIGOS)
    assert sorted(tasas, key=tasas.get, reverse=True) == sorted(TASAS, key=TASAS.get, reverse=True), tasas


def test_crear_reconstruye_desde_parametros():
    fuente = fuente_completa(tabla())
    bases = {b: {"hiperparametros": f.grilla[0], "vida": 30} for b, f in ml.FAMILIAS.items()}
    meta, _, _ = ml.ajustar_meta(bases, "reentrenado", 2, fuente)
    for p in (_logistica(), ml.Stacking("reentrenado", bases, meta, semilla=2)):
        ctx = Contexto(fuente, 172)
        antes = p.puntuar(ctx, CODIGOS + ["ZZZ9"])
        ml._MODELOS.clear()  # Se reentrena desde cero con los parámetros guardados.
        otra = crear(p.familia, json.loads(json.dumps(p.parametros)))
        assert otra.nombre == p.nombre and otra.orden == p.orden
        assert otra.puntuar(ctx, CODIGOS + ["ZZZ9"]) == antes


def test_fila_de_semilla_mediana():
    precisiones = (0.2, 0.1, 0.3, 0.1, 0.25)
    filas = [{"precision_cupo": x, "parametros": {"semilla": s}} for s, x in zip(ml.SEMILLAS, precisiones)]
    fila = ml.mediana_semillas(filas)
    assert fila["parametros"]["semilla"] == 1 and fila["semillas_modelo"]["mediana"] == 0.2
    assert (fila["semillas_modelo"]["min"], fila["semillas_modelo"]["max"]) == (0.1, 0.3)
