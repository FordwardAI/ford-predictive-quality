"""Versiones del modelo en planta: la plataforma las actualiza sola, en días programados de antemano.

Una versión es «el modelo con los resultados conocidos hasta el Día X». Entre versiones el orden no cambia aunque
lleguen resultados: el predictor se envuelve en `Congelado`, que solo ve la fuente de su versión.

La actualización es automática y con calendario fijo: cada 5 días desde el 155, con los resultados de Día ≤ t − 5.
Es el mismo esquema que se evaluó en validación para los modelos reentrenados (`solucion/ml.py`: REENTRENO_DESDE y
CADA). Nadie elige cuándo actualizar mirando los resultados: elegir el momento con los datos a la vista es una forma de
sobreajuste, y los resultados que vuelven son solo de lo que el propio modelo eligió.
"""
from solucion.datos import MARGEN
from solucion.ml import CADA, REENTRENO_DESDE
from solucion.puntaje import Contexto, Fuente, crear

PROGRAMA = {"desde": REENTRENO_DESDE, "cada": CADA}  # Fijo en el código: no se cambia desde la pantalla.
HISTORICO_HASTA = 149  # Histórico de auditorías al azar: etiquetas completas hasta el Día 149 (como en P5).
AUTOMATICA = "Actualización programada (automática)"


def programada(t, programa=PROGRAMA):
    """¿El día t es de actualización? Desde el día siguiente al inicio, cada 5 días: 160, 165, 170…"""
    return t > programa["desde"] and (t - programa["desde"]) % programa["cada"] == 0


def proxima(t, programa=PROGRAMA):
    """Primer día de actualización posterior a t."""
    d = t + 1
    while not programada(d, programa):
        d += 1
    return d


def aplicar_programa(planta, t):
    """Si hoy toca, crea la versión con los resultados hasta t − 5. Devuelve el número de versión nueva o None."""
    v = planta.version()
    if not programada(t) or v is None or v["dia"] >= t:
        return None
    return planta.nueva_version(t - MARGEN, t, AUTOMATICA, nuevos(planta, v, t))


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


def comparar(actual, candidata, ctx_t, codigos):
    """Tasa y puesto de cada código con la versión vigente y con la candidata."""
    a = actual.puntuar(Contexto(actual.fuente, ctx_t), codigos)
    b = candidata.puntuar(Contexto(candidata.fuente, ctx_t), codigos)
    pos_a = {c: i + 1 for i, c in enumerate(sorted(codigos, key=lambda c: -a[c]))}
    pos_b = {c: i + 1 for i, c in enumerate(sorted(codigos, key=lambda c: -b[c]))}
    filas = [{"codigo": c, "tasa_actual": a[c], "tasa_nueva": b[c], "puesto_actual": pos_a[c], "puesto_nuevo": pos_b[c]}
             for c in codigos]
    return sorted(filas, key=lambda f: f["puesto_nuevo"])
