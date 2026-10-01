"""Versiones del modelo en planta: la plataforma recomienda y recuerda cuándo actualizar; decide el gerente.

Una versión es «el modelo con los resultados conocidos hasta el Día X». Entre versiones el orden no cambia aunque
lleguen resultados: el predictor se envuelve en `Congelado`, que solo ve la fuente de su versión. Los resultados que
vuelven son de lo que el propio modelo eligió (una muestra sesgada): por eso actualizar es una decisión explícita y no
un reentrenamiento automático.
"""
from solucion.datos import MARGEN
from solucion.puntaje import Contexto, Fuente, crear

# Regla de recomendación (propuesta del equipo, ajustable): cadencia del RF reentrenado y un mínimo de resultados.
REGLA = {"dias": 5, "resultados": 30, "posponer_dias": 2, "posponer_resultados": 15}
HISTORICO_HASTA = 149  # Histórico de auditorías al azar: etiquetas completas hasta el Día 149 (como en P5).


class Congelado:
    """El predictor de una versión: puntúa siempre con la fuente de su versión, no con la del día."""

    def __init__(self, interno, fuente, version):
        self.interno, self.fuente, self.version = interno, fuente, version

    def puntuar(self, ctx, codigos):
        return self.interno.puntuar(Contexto(self.fuente, ctx.t), codigos)

    def __getattr__(self, nombre):  # nombre, familia, parametros, hasta, ventana… del predictor original.
        return getattr(self.interno, nombre)


def fuente(historico, planta, hasta, al_dia):
    """Etiquetas conocidas: el histórico completo (≤ 149) y los resultados recibidos de lo enviado con Día ≤ hasta."""
    return Fuente(list(historico) + planta.registros(hasta, al_dia))


def predictor(familia, base, entrenado_hasta, f, numero):
    """`base` es el predictor de validación de la familia; la tasa fija se reajusta a su `entrenado_hasta`."""
    interno = crear("tasa_fija", {"hasta": entrenado_hasta, "peso": 0}) if familia == "tasa_fija" else base
    return Congelado(interno, f, numero)


def nuevos(planta, version, t):
    """Resultados utilizables (Día ≤ t − 5, ya recibidos) que la versión vigente todavía no usa."""
    hasta = t - MARGEN
    return len([r for r in planta.registros(hasta, t) if r[0] > version["entrenado_hasta"]])


def recomendacion(planta, t, regla=REGLA):
    """¿Conviene actualizar? Recomienda con ≥ 5 días desde la versión y ≥ 30 resultados nuevos. Si el gerente pospuso,
    vuelve a recordar a los 2 días o con 15 resultados más."""
    v = planta.version()
    if v is None or t is None:
        return None
    n, dias = nuevos(planta, v, t), t - v["dia"]
    base = {"version": v["numero"], "entrenado_hasta": v["entrenado_hasta"], "dias": dias, "nuevos": n,
            "regla": regla, "candidata_hasta": t - MARGEN}
    cumple = dias >= regla["dias"] and n >= regla["resultados"]
    d = planta.ultima_decision()
    pospuesta = bool(d and d["tipo"] == "posponer" and d["dia"] >= v["dia"]
                     and t - d["dia"] < regla["posponer_dias"] and n - d["resultados_nuevos"] < regla["posponer_resultados"])
    if cumple and not pospuesta:
        motivo = f"{n} resultados nuevos y {dias} días desde la versión {v['numero']}"
        return {**base, "recomendar": True, "motivo": motivo}
    if pospuesta:
        motivo = "Pospuesta por el gerente; se vuelve a recordar en 2 días o con 15 resultados más"
    else:
        faltan = []
        if dias < regla["dias"]:
            faltan.append(f"{regla['dias'] - dias} día(s)")
        if n < regla["resultados"]:
            faltan.append(f"{regla['resultados'] - n} resultado(s)")
        motivo = "Todavía no: faltan " + " y ".join(faltan)
    return {**base, "recomendar": False, "pospuesta": pospuesta, "motivo": motivo}


def comparar(actual, candidata, ctx_t, codigos):
    """Tasa y puesto de cada código con la versión vigente y con la candidata."""
    a = actual.puntuar(Contexto(actual.fuente, ctx_t), codigos)
    b = candidata.puntuar(Contexto(candidata.fuente, ctx_t), codigos)
    pos_a = {c: i + 1 for i, c in enumerate(sorted(codigos, key=lambda c: -a[c]))}
    pos_b = {c: i + 1 for i, c in enumerate(sorted(codigos, key=lambda c: -b[c]))}
    filas = [{"codigo": c, "tasa_actual": a[c], "tasa_nueva": b[c], "puesto_actual": pos_a[c], "puesto_nuevo": pos_b[c]}
             for c in codigos]
    return sorted(filas, key=lambda f: f["puesto_nuevo"])
