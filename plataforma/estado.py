"""Estado de un día de operación: cuánto falta auditar de cada código, decisiones en la playa y rondas.

Lógica pura, sin CSV: recibe el ranking y la cantidad sugerida que arma `solucion.hoja.armar` y lleva lo que el
equipo de analistas toma. La reasignación usa la misma regla de la hoja (`solucion.hoja.reasignar`).
Las unidades son ids del programa del día (nunca VIN).
"""
import dataclasses
import json
from pathlib import Path

from solucion.hoja import reasignar

AUDITAR, NO_AUDITAR, FUERA = "auditar", "no_auditar", "fuera_del_programa"


def normalizar(codigo):
    return (codigo or "").strip().upper()


@dataclasses.dataclass
class Dia:
    dia: int
    cupo: int
    modelo: str
    ranking: list  # Códigos programados, de mayor a menor tasa.
    programa: list  # [(unidad, código)] en el orden del archivo.
    sugeridas: dict  # {código: cantidad a auditar hoy}; cambia con la reasignación.
    motivos: dict  # {código: "Prioridad" | "Mínimo por código"}.
    tomadas: dict = dataclasses.field(default_factory=dict)  # {código: [unidades]}.
    rondas: list = dataclasses.field(default_factory=list)
    azar: int = 0  # Cantidad que solo se completa al azar (ranking agotado).
    enviadas: list = dataclasses.field(default_factory=list)  # [{unidad, codigo, ronda}] en orden de envío.

    @classmethod
    def desde_hoja(cls, h, programa, modelo):
        sugeridas, motivos = {}, {}
        for c, motivo, _ in h.unidades:
            q = 1 if motivo == "Mínimo por código" else next(f.sugerida for f in h.filas if f.codigo == c)
            sugeridas[c] = sugeridas.get(c, 0) + q
            motivos.setdefault(c, motivo)
        return cls(dia=h.dia, cupo=h.cupo, modelo=modelo, ranking=[f.codigo for f in h.filas],
                   programa=[list(p) for p in programa], sugeridas=sugeridas, motivos=motivos)

    # --- Consultas --------------------------------------------------------------------------------------------

    def programadas(self, codigo):
        return sum(1 for _, c in self.programa if c == codigo)

    def pendiente(self, codigo):
        return max(0, self.sugeridas.get(codigo, 0) - len(self.tomadas.get(codigo, [])))

    def pendientes(self):
        """[(código, pendiente)] en el orden del ranking."""
        return [(c, self.pendiente(c)) for c in self.ranking if self.pendiente(c)]

    def tomadas_total(self):
        return sum(len(u) for u in self.tomadas.values())

    def decidir(self, codigo):
        """¿Se audita una unidad de este código? Responde con el motivo y lo que queda."""
        c = normalizar(codigo)
        base = {"codigo": c, "tomadas": self.tomadas_total(), "cupo": self.cupo}
        if c not in self.ranking:
            return {**base, "decision": FUERA, "motivo": "Este código no tiene cantidad hoy"}
        posicion = self.ranking.index(c) + 1
        base |= {"posicion": posicion, "programadas": self.programadas(c)}
        if self.pendiente(c):
            return {**base, "decision": AUDITAR, "quedan": self.pendiente(c), "motivo": self.motivos.get(c, "Prioridad")}
        if self.sugeridas.get(c):
            return {**base, "decision": NO_AUDITAR, "motivo": "La cantidad de este código ya está cubierta"}
        return {**base, "decision": NO_AUDITAR, "motivo": "Hoy no se prioriza este código"}

    # --- Acciones ---------------------------------------------------------------------------------------------

    def tomar(self, codigo, unidad=None):
        """Registra una unidad tomada; sin id, toma la siguiente del programa de ese código."""
        c = normalizar(codigo)
        assert self.pendiente(c), f"No queda nada por auditar del código {c}"
        ya = {u for us in self.tomadas.values() for u in us}
        libres = [u for u, cc in self.programa if cc == c and u not in ya]
        if unidad is None:
            assert libres, f"No quedan unidades del código {c} en el programa"
            unidad = libres[0]
        assert unidad in libres, f"La unidad {unidad} no es del código {c} o ya se tomó"
        self.tomadas.setdefault(c, []).append(unidad)
        self.enviadas.append({"unidad": unidad, "codigo": c, "ronda": len(self.rondas) + 1})
        return unidad

    def deshacer(self, unidad):
        """Corrige un envío por error: la unidad vuelve a estar disponible y su código recupera lo pendiente."""
        envio = next((e for e in self.enviadas if e["unidad"] == unidad), None)
        assert envio, f"La unidad {unidad} no figura entre las enviadas"
        self.enviadas.remove(envio)
        self.tomadas[envio["codigo"]].remove(unidad)
        return envio["codigo"]

    def registrar_ronda(self, en_playa):
        """Cierra una ronda. `en_playa` {código: unidades que llegaron} para los códigos revisados; el resto se
        supone llegado según el programa. Lo que falta de un código baja por el ranking (regla de la hoja)."""
        en_playa = {normalizar(c): int(n) for c, n in en_playa.items()}
        pendientes = dict(self.pendientes())
        llegados = {c: max(0, self.programadas(c) - len(self.tomadas.get(c, []))) for c in self.ranking}
        llegados |= {c: n for c, n in en_playa.items() if c in llegados}
        nuevas, azar = reasignar(pendientes, self.ranking, llegados) if pendientes else ({}, 0)
        cambios = []
        for c in self.ranking:
            antes, despues = pendientes.get(c, 0), nuevas.get(c, 0)
            if antes != despues:
                cambios.append({"codigo": c, "antes": antes, "despues": despues})
                self.sugeridas[c] = len(self.tomadas.get(c, [])) + despues
                if despues and c not in self.motivos:
                    self.motivos[c] = "Siguiente del ranking"
        self.azar = azar
        ronda = {"numero": len(self.rondas) + 1, "en_playa": en_playa, "cambios": cambios, "azar": azar,
                 "tomadas": self.tomadas_total()}
        self.rondas.append(ronda)
        return ronda

    # --- Persistencia (fuera del repo) ------------------------------------------------------------------------

    def resumen(self):
        return {"dia": self.dia, "cupo": self.cupo, "modelo": self.modelo, "tomadas": self.tomadas_total(),
                "pendientes": [{"codigo": c, "pendiente": q, "motivo": self.motivos.get(c, "Prioridad"),
                                "posicion": self.ranking.index(c) + 1, "programadas": self.programadas(c),
                                "tomadas": self.tomadas.get(c, [])} for c, q in self.pendientes()],
                "tomadas_por_codigo": self.tomadas, "rondas": self.rondas, "azar": self.azar,
                "enviadas": self.enviadas}

    def guardar(self, carpeta):
        carpeta = Path(carpeta)
        carpeta.mkdir(parents=True, exist_ok=True)
        destino = carpeta / f"dia-{self.dia}.json"
        destino.write_text(json.dumps(dataclasses.asdict(self), ensure_ascii=False), encoding="utf-8")
        return destino

    @classmethod
    def leer(cls, archivo):
        return cls(**json.loads(Path(archivo).read_text(encoding="utf-8")))
