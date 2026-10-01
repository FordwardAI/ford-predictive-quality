"""Fuente simulada: reproduce la base ficticia día por día con el mismo contrato que tendrían los datos de Ford.

Cada día que avanza el reloj:
- ingresan como Gate Release las unidades de la base con ese Día del VIN (supuesto: el Día del VIN aproxima el Gate
  Release), con ids ficticios `U<día>-<n>`; cada una espera en la playa de 0 a 5 días antes del despacho;
- vuelven los resultados de lo enviado a Auditoría Adicional, entre 1 y 5 días después del envío, con la etiqueta y
  el componente de la base. Solo de lo enviado: lo que no se audita nunca revela su resultado.

Corre en la validación (155–194). El mapa id → VIN vive solo en memoria y se reconstruye con semillas.
"""
import numpy as np

from solucion.datos import TRAMOS

from .modelo import HISTORICO_HASTA

INICIO, FIN = TRAMOS["validacion"]
SEMILLA_IDS, SEMILLA_ESPERA, SEMILLA_RESULTADO = 20261101, 20261102, 20261103


def _azar(semilla, unidad, lo, hi):
    """Entero en [lo, hi] fijo por unidad: el mismo en cada corrida."""
    return int(np.random.default_rng([semilla, *unidad.encode()]).integers(lo, hi + 1))


class Simulador:
    def __init__(self, tabla, planta):
        self.tabla, self.planta = tabla, planta
        self._dias, self.privado = {}, {}

    def unidades(self, t):
        """[(id, Vin)] del día t, en un orden barajado con semilla."""
        if t not in self._dias:
            vins = self.tabla.por_dia(t, t).get(t, [])
            orden = np.random.default_rng([SEMILLA_IDS, t]).permutation(len(vins))
            self._dias[t] = [(f"U{t}-{i + 1:04d}", vins[j]) for i, j in enumerate(orden)]
            self.privado.update(self._dias[t])
        return self._dias[t]

    def vin(self, unidad):
        if unidad not in self.privado:
            self.unidades(int(unidad[1:unidad.index("-")]))
        return self.privado[unidad]

    def _ingresar(self, t):
        pares = self.unidades(t)
        if not pares:
            return 0
        n = self.planta.ingresar([{"unidad": u, "codigo": v.codigo, "dia": t} for u, v in pares], "simulada")
        # Espera en la playa de 0 a 5 días: sale de la playa el día siguiente al último de espera.
        por_dia = {}
        for u, _ in pares:
            por_dia.setdefault(t + _azar(SEMILLA_ESPERA, u, 0, 5) + 1, []).append(u)
        for dia, us in por_dia.items():
            self.planta.despachar(us, dia)
        return n

    def iniciar(self, desde=INICIO):
        """Arranca la planta simulada: la playa del primer día ya tiene las unidades de los 5 días anteriores."""
        self.planta.vaciar()
        self.planta.escribir("modo", "simulada")
        for t in range(desde - 5, desde + 1):
            self.planta.escribir("dia", t)
            self._ingresar(t)
        self.planta.nueva_version(HISTORICO_HASTA, desde, "Inicio: histórico de auditorías al azar", 0)

    def avanzar(self):
        t = self.planta.dia + 1
        assert t <= FIN, f"La simulación llega hasta el Día {FIN}: los días siguientes son la prueba final, que no se relee"
        self.planta.escribir("dia", t)
        nuevas = self._ingresar(t)
        filas = []
        for e in self.planta.sin_resultado():
            dia_resultado = e["dia"] + _azar(SEMILLA_RESULTADO, e["unidad"], 1, 5)
            if dia_resultado <= t:
                v = self.vin(e["unidad"])
                filas.append({"unidad": e["unidad"], "resultado": v.etiqueta, "dia": dia_resultado,
                              "componente": v.componente or ""})
        resultados = self.planta.registrar_resultados(filas, "simulada") if filas else 0
        return {"dia": t, "nuevas": nuevas, "resultados": resultados,
                "calibradas": sum(f["resultado"] == "CALIBRADA" for f in filas)}
