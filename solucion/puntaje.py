"""Protocolo común de puntaje: cada alternativa devuelve una tasa por código.

Con el código de catálogo como único predictor, toda alternativa estima la tasa
CALIBRADA de cada código. `Contexto` es la única vía a las etiquetas: exige
Día <= t - MARGEN (salvo las referencias no elegibles marcadas) y nunca entrega
etiquetas de la prueba final sin desbloqueo.
"""
import math

import numpy as np

from .datos import MARGEN, PRUEBA_DESDE


DIAS = 400  # Cota superior de DIA_n en la base.


class Conocidas:
    """Conteos (n, CALIBRADA) por código y día, con Día en [desde, hasta]. Es una copia fija."""

    def __init__(self, codigos, n, cal, hasta, desde=None):
        lo = 0 if desde is None else max(0, desde)
        self.codigos, self.hasta, self.desde = list(codigos), hasta, lo
        self.dias = np.arange(lo, hasta + 1)
        self.n, self.cal = n[:, lo:hasta + 1].copy(), cal[:, lo:hasta + 1].copy()

    def _pesos(self, desde, peso):
        w = np.ones(len(self.dias)) if peso is None else np.array([peso(d) for d in self.dias], dtype=float)
        if desde is not None:
            w[self.dias < desde] = 0.0
        return w

    def por_codigo(self, desde=None, peso=None):
        """{código: (n, cal)} con ventana opcional y peso por antigüedad peso(dia)."""
        w = self._pesos(desde, peso)
        nn, cc = self.n @ w, self.cal @ w
        return {c: (float(a), float(b)) for c, a, b in zip(self.codigos, nn, cc) if a > 0}

    def general(self, desde=None, peso=None):
        w = self._pesos(desde, peso)
        n = float((self.n @ w).sum())
        return float((self.cal @ w).sum()) / n if n else 0.0

    def filas(self, desde=None, peso=None):
        """Filas agregadas (código, etiqueta, peso) para ajustar modelos sobre el código."""
        for codigo, (n, cal) in self.por_codigo(desde, peso).items():
            if cal > 0:
                yield codigo, 1, cal
            if n - cal > 0:
                yield codigo, 0, n - cal


class Fuente:
    """Etiquetas visibles (dia, codigo, calibrada) como matrices código × día, con caché por ventana.

    En la simulación con etiquetas parciales se agregan resultados día por día;
    solo se admite agregar días posteriores a toda ventana ya calculada.
    """

    def __init__(self, registros, desbloqueada=False):
        self.desbloqueada = desbloqueada
        self.indice = {}
        self.n, self.cal = np.zeros((0, DIAS)), np.zeros((0, DIAS))
        self._cache = {}
        self._max_hasta = -1
        self._sumar(registros)

    def _sumar(self, registros):
        for dia, codigo, calibrada in registros:
            if codigo not in self.indice:
                self.indice[codigo] = len(self.indice)
                self.n = np.vstack([self.n, np.zeros(DIAS)])
                self.cal = np.vstack([self.cal, np.zeros(DIAS)])
            i = self.indice[codigo]
            self.n[i, dia] += 1
            self.cal[i, dia] += calibrada

    def agregar(self, registros):
        registros = list(registros)
        assert all(dia > self._max_hasta for dia, *_ in registros), "Se agregan etiquetas a una ventana ya usada"
        self._sumar(registros)

    def conocidas(self, hasta, desde=None):
        if not self.desbloqueada:
            assert hasta < PRUEBA_DESDE, "Etiquetas de la prueba final sin preregistro"
        clave = (hasta, desde)
        if clave not in self._cache:
            self._cache[clave] = Conocidas(self.indice, self.n, self.cal, hasta, desde)
            self._max_hasta = max(self._max_hasta, hasta)
        return self._cache[clave]


class Contexto:
    """Etiquetas disponibles al puntuar el día t: Día <= t - MARGEN salvo referencias no elegibles."""

    def __init__(self, fuente, t, permite_futuro=False):
        self.fuente, self.t, self.permite_futuro = fuente, t, permite_futuro

    def conocidas(self, hasta, desde=None):
        if not self.permite_futuro:
            assert hasta <= self.t - MARGEN, f"Fuga: hasta={hasta} > t-{MARGEN} con t={self.t}"
        return self.fuente.conocidas(hasta, desde)


def registros_de(vins):
    """Tuplas (dia, codigo, calibrada); falla si alguna etiqueta está enmascarada."""
    return [(v.dia, v.codigo, v.calibrada) for v in vins]


class Puntaje:
    """Base de toda alternativa.

    - nombre y parametros: identifican la corrida.
    - orden: tupla de simplicidad (menor es más simple), punto 8 de #10.
    - elegible: False para oráculo, fuga y anexo de historial.
    - puntuar(ctx, codigos) -> {código: tasa} para todos los códigos pedidos.
    """
    nombre = "base"
    familia = "base"
    orden = (99,)
    elegible = True
    parametros = {}

    def puntuar(self, ctx, codigos):
        raise NotImplementedError


def suavizada(n, cal, previa, peso):
    """Tasa suavizada: (cal + peso·previa) / (n + peso). Sin datos y sin peso, la previa."""
    return (cal + peso * previa) / (n + peso) if n + peso > 0 else previa


def media_vida(vida, t):
    """Peso por antigüedad con vida media `vida` días respecto del día t."""
    return lambda dia: 0.5 ** ((t - dia) / vida)


def wilson(cal, n, z=1.959964):
    if n == 0:
        return (0.0, 1.0)
    p = cal / n
    centro = (p + z * z / (2 * n)) / (1 + z * z / n)
    medio = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return (max(0.0, centro - medio), min(1.0, centro + medio))


def completar(tasas, codigos, respaldo):
    """Garantiza una tasa para cada código pedido; los códigos sin historial usan el respaldo."""
    return {c: float(tasas.get(c, respaldo)) for c in codigos}


def semilla_dia(semilla, t):
    return np.random.default_rng([semilla, t])


REGISTRO = {}


def registrar(clase):
    """Registra una alternativa por su `familia` para reconstruirla desde un JSON de resultados."""
    REGISTRO[clase.familia] = clase
    return clase


def crear(familia, parametros, tabla=None):
    """Reconstruye una alternativa desde (familia, parametros), p. ej. la ganadora de eleccion.json."""
    clase = REGISTRO[familia]
    if getattr(clase, "necesita_catalogo", False):
        parametros = {**parametros, "mercados": {c: a.get("mercado") for c, a in tabla.catalogo.items()}}
    return clase(**parametros)
