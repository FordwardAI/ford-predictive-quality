"""Referencias sin ML (P3): azar, tasa fija, móviles, suavizado hacia el mercado, decaimiento, oráculo y fuga."""
from .cupo import remuestreos, resultado, simular
from .datos import MARGEN, TRAMOS
from .puntaje import Puntaje, atributos_de, completar, media_vida, registrar, suavizada

ENTRENAMIENTO_HASTA = TRAMOS["entrenamiento"][1]
VALIDACION = TRAMOS["validacion"]
VENTANAS = (30, 60, 120)
PESO = 20
VIDAS = (15, 30, 60)


@registrar
class Azar(Puntaje):
    """Todas las unidades valen lo mismo: el desempate al azar llena el cupo. Es la referencia, no compite."""
    nombre, familia, orden, elegible = "azar", "azar", (0, 0), False
    parametros = {}

    def puntuar(self, ctx, codigos):
        return {c: 0.0 for c in codigos}


@registrar
class TasaFija(Puntaje):
    """Tasa CALIBRADA por código con las etiquetas de Día <= hasta, calculada una sola vez."""
    familia, orden = "tasa_fija", (1, 0)

    def __init__(self, hasta=ENTRENAMIENTO_HASTA, peso=0):
        self.hasta, self.peso = hasta, peso
        self.parametros = {"hasta": hasta, "peso": peso}
        self.nombre = f"tasa fija (<= {hasta})"

    def puntuar(self, ctx, codigos):
        conocidas = ctx.conocidas(self.hasta)
        general = conocidas.general()
        tasas = {c: suavizada(n, cal, general, self.peso) for c, (n, cal) in conocidas.por_codigo().items()}
        return completar(tasas, codigos, general)


@registrar
class Movil(Puntaje):
    """Tasa del código en los últimos `ventana` días con resultado conocido (Día <= t−5)."""
    familia = "movil"

    def __init__(self, ventana, peso):
        self.ventana, self.peso = ventana, peso
        self.parametros = {"ventana": ventana, "peso": peso}
        self.nombre = f"móvil {ventana} d, peso {peso}"
        self.orden = (2, 0) if peso == 0 else (3, 0)

    def hasta(self, t):
        return t - MARGEN

    def puntuar(self, ctx, codigos):
        hasta = self.hasta(ctx.t)
        conocidas = ctx.conocidas(hasta, desde=hasta - self.ventana + 1)
        general = conocidas.general()
        tasas = {c: suavizada(n, cal, general, self.peso) for c, (n, cal) in conocidas.por_codigo().items()}
        return completar(tasas, codigos, general)


@registrar
class MovilMercado(Puntaje):
    """Móvil suavizada hacia la tasa de su mercado de destino en la misma ventana (#27)."""
    familia, orden, necesita_catalogo = "movil_mercado", (3, 1), True

    def __init__(self, ventana, peso=PESO, mercados=None):
        self.ventana, self.peso, self.mercados = ventana, peso, mercados or {}
        self.parametros = {"ventana": ventana, "peso": peso}
        self.nombre = f"móvil {ventana} d hacia el mercado, peso {peso}"

    def puntuar(self, ctx, codigos):
        hasta = ctx.t - MARGEN
        conocidas = ctx.conocidas(hasta, desde=hasta - self.ventana + 1)
        general = conocidas.general()
        conteos = conocidas.por_codigo()
        por_mercado = {}
        for c, (n, cal) in conteos.items():
            m = por_mercado.setdefault(self.mercados.get(c), [0.0, 0.0])
            m[0] += n
            m[1] += cal
        previa = {m: cal / n for m, (n, cal) in por_mercado.items() if m is not None and n > 0}
        tasas = {}
        for c in codigos:
            base = previa.get(self.mercados.get(c), general)
            n, cal = conteos.get(c, (0.0, 0.0))
            tasas[c] = suavizada(n, cal, base, self.peso)
        return tasas


@registrar
class Jerarquico(Puntaje):
    """Suavizado jerárquico: código → celda (mercado × versión) → mercado → tasa general, con ventana móvil.

    Cada nivel se encoge hacia el de arriba con `peso` unidades: un código con pocos resultados toma fuerza de sus
    parecidos y uno con muchos se queda en su tasa. Generaliza `MovilMercado`, que solo encogía hacia el mercado.
    Los atributos se leen del propio código; un código sin agrupación cae a la tasa general.
    """
    familia, orden, necesita_atributos = "jerarquico", (3, 2), True

    def __init__(self, ventana, peso, atributos=None):
        self.ventana, self.peso, self.atributos = ventana, peso, atributos or {}
        self.parametros = {"ventana": ventana, "peso": peso}
        self.nombre = f"jerárquico {'todo el historial' if ventana is None else f'{ventana} d'}, peso {peso}"

    def puntuar(self, ctx, codigos):
        hasta = ctx.t - MARGEN
        conocidas = ctx.conocidas(hasta, desde=None if self.ventana is None else hasta - self.ventana + 1)
        general = conocidas.general()
        conteos = conocidas.por_codigo()
        mercados, celdas = {}, {}
        for c, (n, cal) in conteos.items():
            a = self.atributos.get(c)
            if a is None:
                continue
            for acumulado, clave in ((mercados, a[0]), (celdas, a[4])):
                x = acumulado.setdefault(clave, [0.0, 0.0])
                x[0] += n
                x[1] += cal
        tasa_mercado = {m: suavizada(n, cal, general, self.peso) for m, (n, cal) in mercados.items()}
        tasa_celda = {k: suavizada(n, cal, tasa_mercado[k.split("|")[0]], self.peso) for k, (n, cal) in celdas.items()}
        tasas = {}
        for c in codigos:
            a = self.atributos.get(c)
            previa = general if a is None else tasa_celda.get(a[4], tasa_mercado.get(a[0], general))
            n, cal = conteos.get(c, (0.0, 0.0))
            tasas[c] = suavizada(n, cal, previa, self.peso)
        return tasas


@registrar
class Decaimiento(Puntaje):
    """Tasa con peso exponencial por antigüedad (vida media en días), suavizada hacia la general."""
    familia, orden = "decaimiento", (4, 0)

    def __init__(self, vida, peso=PESO):
        self.vida, self.peso = vida, peso
        self.parametros = {"vida": vida, "peso": peso}
        self.nombre = f"decaimiento, vida media {vida} d, peso {peso}"

    def puntuar(self, ctx, codigos):
        conocidas = ctx.conocidas(ctx.t - MARGEN)
        peso = media_vida(self.vida, ctx.t)
        general = conocidas.general(peso=peso)
        tasas = {c: suavizada(n, cal, general, self.peso) for c, (n, cal) in conocidas.por_codigo(peso=peso).items()}
        return completar(tasas, codigos, general)


@registrar
class Oraculo(Puntaje):
    """Techo con el código: tasa real de cada código en todo el tramo evaluado. No es elegible."""
    familia, orden, elegible, usa_futuro = "oraculo", (98, 0), False, True

    def __init__(self, desde=VALIDACION[0], hasta=VALIDACION[1]):
        self.desde, self.hasta = desde, hasta
        self.parametros = {"desde": desde, "hasta": hasta}
        self.nombre = "oráculo (tasa real del tramo)"

    def puntuar(self, ctx, codigos):
        conocidas = ctx.conocidas(self.hasta, desde=self.desde)
        general = conocidas.general()
        return completar({c: cal / n for c, (n, cal) in conocidas.por_codigo().items()}, codigos, general)


@registrar
class Fuga(Movil):
    """Didáctica: la móvil de 60 días usando resultados hasta el mismo día t, sin margen. No es elegible."""
    familia, elegible, usa_futuro = "fuga", False, True

    def __init__(self, ventana=60, peso=PESO):
        super().__init__(ventana, peso)
        self.nombre = f"con fuga: móvil {ventana} d sin margen de {MARGEN} días"
        self.orden = (99, 0)

    def hasta(self, t):
        return t


def alternativas(tabla):
    mercados = {c: a.get("mercado") for c, a in tabla.catalogo.items()}
    salida = [Azar(), TasaFija()]
    salida += [Movil(v, p) for v in VENTANAS for p in (0, PESO)]
    salida += [MovilMercado(v, PESO, mercados) for v in VENTANAS]
    salida += [Decaimiento(v) for v in VIDAS]
    salida += [Oraculo(), Fuga()]
    return salida


def evaluar(tabla, puntajes, lo=VALIDACION[0], hi=VALIDACION[1], tramo="validación 155–194"):
    """Evalúa cada alternativa con el mismo juego de remuestreos por días."""
    dias = len(tabla.por_dia(lo, hi))
    idx = remuestreos(dias)
    salida = []
    for p in puntajes:
        d = simular(tabla, p, lo, hi)
        r = resultado(p, d, idx, tabla, tramo)
        r["diario"] = {k: getattr(d, k).astype(int).tolist() for k in ("dias", "n", "k", "cal", "cal_elegidas")}
        salida.append(r)
    return salida


def correr(tabla, opciones=None):
    return {"pieza": "P3 referencias", "tramo": "validación 155–194",
            "resultados": evaluar(tabla, alternativas(tabla))}
