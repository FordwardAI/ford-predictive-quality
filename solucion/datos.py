"""Tabla por VIN (P1) con las etiquetas de la prueba final enmascaradas.

Reutiliza el lector de `research/`. La etiqueta y el componente de todo VIN con
Día del VIN >= PRUEBA_DESDE quedan en None salvo desbloqueo explícito, que solo
hace `solucion.preregistro.correr` con el preregistro acordado.
"""
import collections
import csv
import dataclasses
import hashlib
import pickle
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "research"))

from audit_dataset import MISSING, day, fingerprint, table  # noqa: E402
from catalog_groups import grouping  # noqa: E402
from validation_partitions import CUTOFF  # noqa: E402

SHA_CSV = "a24860d86afdd841d1c9c4ac12155a861299b80dbc161bcd17d2aaff43c5a82b"
SHA_CATALOGO = "89e5a9d9c4312a408f996bea3e170e44428827a458fa62d76936648e1733e047"
PRUEBA_DESDE = 200
MARGEN = 5  # Resultados de Día <= t - MARGEN (#7).
TRAMOS = {  # Día del VIN, inclusivo.
    "ajuste_interno": (None, 119),
    "evaluacion_interna": (125, 149),
    "entrenamiento": (None, 149),
    "validacion": (155, 194),
    "entrenamiento_final": (None, 194),
    "prueba_final": (200, None),
    "prueba_final_hasta_260": (200, CUTOFF),
    "prueba_final_despues_260": (CUTOFF + 1, None),
}


@dataclasses.dataclass(frozen=True, slots=True)
class Vin:
    vin: str  # Solo interno: nunca sale en resultados ni en la hoja.
    codigo: str
    dia: int  # Día del VIN: max(Fecha Inspección, Fecha Reparación).
    primera: int | None  # Primera Fecha Inspección.
    etiqueta: str | None  # "CALIBRADA", "OK" o None si está enmascarada.
    componente: str | None  # Componente Auditoría Adicional: lo que se predice, nunca predictor.

    @property
    def calibrada(self):
        assert self.etiqueta is not None, "Etiqueta enmascarada: Día >= 200 sin preregistro"
        return self.etiqueta == "CALIBRADA"


@dataclasses.dataclass(frozen=True, slots=True)
class Historial:
    """Resumen del historial QLS de un VIN, solo para el anexo «disponibilidad no probada»."""
    eventos: int
    incidencias_distintas: int
    reparacion_media: float | None  # Días (fracción) entre inspección y reparación.
    reparacion_max: float | None
    dias_primero_ultimo: int
    incidencias: tuple  # Nombres de UC Nombre Incidencia, con repeticiones.


@dataclasses.dataclass
class Tabla:
    vins: list  # Población principal: primera inspección <= CUTOFF.
    cohorte: list  # Primera inspección posterior a CUTOFF (sensibilidad).
    catalogo: dict  # Código -> atributos de la agrupación.
    historial: dict  # VIN -> Historial.
    fuente: dict  # Hashes y nombres.
    preparacion: dict  # Conteos del parseo sin etiquetas.
    desbloqueada: bool = False

    def tramo(self, nombre):
        lo, hi = TRAMOS[nombre]
        return [v for v in self.vins if (lo is None or v.dia >= lo) and (hi is None or v.dia <= hi)]

    def por_dia(self, lo, hi):
        dias = collections.defaultdict(list)
        for v in self.vins:
            if lo <= v.dia <= hi:
                dias[v.dia].append(v)
        return {d: sorted(vs, key=lambda v: v.vin) for d, vs in sorted(dias.items())}

    def mercado(self, codigo):
        return self.catalogo.get(codigo, {}).get("mercado")


def _hora(valor):
    valor = valor.strip()
    return None if valor in MISSING else float(valor.replace(",", "."))


def construir(eventos, catalogo, fuente=None, desbloquear=False, preparacion=None):
    """Arma la tabla desde eventos (dicts con los nombres técnicos del CSV)."""
    por_vin = {}
    for r in eventos:
        vin = r["VIN"]
        x = por_vin.setdefault(vin, {"codigos": set(), "primera": None, "dia": None, "etiqueta": r["Auditoría Adicional"],
                                     "componentes": set(), "incidencias": [], "reparaciones": [], "dias": []})
        x["codigos"].add(r["Código de Catálogo"].strip())
        inspeccion, reparacion = day(r["Fecha Inspección"]), day(r["Fecha Reparación"])
        fechas = [d for d in (inspeccion, reparacion) if d is not None]
        if inspeccion is not None:
            x["primera"] = inspeccion if x["primera"] is None else min(x["primera"], inspeccion)
        if fechas:
            x["dia"] = max(fechas) if x["dia"] is None else max(x["dia"], *fechas)
            x["dias"].extend(fechas)
        componente = r.get("Componente Auditoría Adicional", "").strip()
        if componente not in MISSING:
            x["componentes"].add(componente)
        x["incidencias"].append(r.get("UC Nombre Incidencia", "").strip())
        hi, hr = _hora(r.get("Hora Inspección", "")), _hora(r.get("Hora Reparación", ""))
        if None not in (inspeccion, reparacion, hi, hr):
            x["reparaciones"].append(reparacion + hr - inspeccion - hi)
    vins, cohorte, historial = [], [], {}
    for vin, x in por_vin.items():
        assert len(x["codigos"]) == 1, "Un VIN con más de un código de catálogo"
        assert len(x["componentes"]) <= 1, "Un VIN con más de un componente"
        visible = desbloquear or x["dia"] < PRUEBA_DESDE
        registro = Vin(vin=vin, codigo=next(iter(x["codigos"])), dia=x["dia"], primera=x["primera"],
                       etiqueta=x["etiqueta"] if visible else None,
                       componente=(next(iter(x["componentes"]), None) if visible else None))
        (vins if x["primera"] is not None and x["primera"] <= CUTOFF else cohorte).append(registro)
        rep = x["reparaciones"]
        historial[vin] = Historial(eventos=len(x["incidencias"]), incidencias_distintas=len(set(x["incidencias"])),
                                   reparacion_media=sum(rep) / len(rep) if rep else None,
                                   reparacion_max=max(rep) if rep else None,
                                   dias_primero_ultimo=max(x["dias"]) - min(x["dias"]) if x["dias"] else 0,
                                   incidencias=tuple(x["incidencias"]))
    vins.sort(key=lambda v: v.vin)
    cohorte.sort(key=lambda v: v.vin)
    return Tabla(vins=vins, cohorte=cohorte, catalogo=catalogo, historial=historial, fuente=fuente or {},
                 preparacion=preparacion or {}, desbloqueada=desbloquear)


def leer_catalogo(path):
    with Path(path).open(encoding="utf-8-sig", newline="") as source:
        return grouping(list(csv.reader(source, strict=True)))


def _eventos(path, conteos):
    source = table(Path(path))
    descripciones, headers = next(source), next(source)
    conteos["descripciones_38_40"] = [list(x) for x in zip(range(38, 41), descripciones[37:40], headers[37:40])]
    vistos = set()
    for row in source:
        assert len(row) == len(headers)
        huella = hashlib.sha256("\x1f".join(row).encode()).digest()
        conteos["filas"] += 1
        conteos["duplicados_exactos"] += huella in vistos
        vistos.add(huella)
        registro = dict(zip(headers, row))
        conteos["na_fecha_reparacion"] += registro["Fecha Reparación"].strip() == "#N/A"
        yield registro


def _clave_cache(sha):
    codigo = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()[:16]
    return f"tabla-{hashlib.sha256(sha.encode()).hexdigest()[:16]}-{codigo}.pickle"


def cargar(csv_path, catalogo_path, cache=None, verificar=True, desbloquear=False):
    """Lee CSV y catálogo, verifica hashes y devuelve la tabla enmascarada (con caché fuera del repo)."""
    sha, sha_cat = fingerprint(Path(csv_path)), fingerprint(Path(catalogo_path))
    if verificar:
        assert sha == SHA_CSV, f"El CSV no es la fuente vigente (sha {sha}); ver docs/datos-locales.md"
        assert sha_cat == SHA_CATALOGO, f"El catálogo no es el vigente (sha {sha_cat})"
    destino = None
    if cache is not None and not desbloquear:  # La prueba final nunca pasa por la caché.
        destino = Path(cache) / _clave_cache(sha + sha_cat)
        if destino.exists():
            with destino.open("rb") as f:
                tabla = pickle.load(f)
            assert not tabla.desbloqueada
            return tabla
    conteos = collections.Counter()
    fuente = {"csv": Path(csv_path).name, "csv_sha256": sha, "catalogo": Path(catalogo_path).name,
              "catalogo_sha256": sha_cat}
    tabla = construir(_eventos(csv_path, conteos), leer_catalogo(catalogo_path), fuente=fuente,
                      desbloquear=desbloquear)
    tabla.preparacion = {"filas": conteos["filas"], "duplicados_exactos": conteos["duplicados_exactos"],
                         "na_fecha_reparacion": conteos["na_fecha_reparacion"],
                         "descripciones_38_40": conteos["descripciones_38_40"]}
    if destino is not None:
        destino.parent.mkdir(parents=True, exist_ok=True)
        with destino.open("wb") as f:
            pickle.dump(tabla, f)
    return tabla
