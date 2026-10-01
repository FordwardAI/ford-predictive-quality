"""Almacén de planta: unidades que pasaron Gate Release, envíos a Auditoría Adicional, resultados y versiones del modelo.

Un solo contrato para los datos reales (CSV o API desde los sistemas de Ford) y para la fuente simulada que
reproduce la base. Usa sqlite3 de la biblioteca estándar; el archivo vive fuera del repo. En planta, `unidad` es el
VIN; en la simulación, un id ficticio `U<día>-<n>`.
"""
import collections
import csv
import io
import sqlite3
from pathlib import Path

ESPERA_MAX = 5  # Días entre Gate Release y despacho (Ford: de 0 a 5).
RESULTADOS = ("OK", "CALIBRADA")

ESQUEMA = """
CREATE TABLE IF NOT EXISTS unidad (id TEXT PRIMARY KEY, codigo TEXT NOT NULL, dia_gr INTEGER NOT NULL,
  despachada INTEGER, fuente TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS envio (unidad TEXT PRIMARY KEY REFERENCES unidad(id), dia INTEGER NOT NULL,
  ronda INTEGER NOT NULL, posicion INTEGER, tasa REAL, version INTEGER, modelo TEXT);
CREATE TABLE IF NOT EXISTS resultado (unidad TEXT PRIMARY KEY REFERENCES envio(unidad), resultado TEXT NOT NULL,
  componente TEXT, dia INTEGER NOT NULL, fuente TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS version (numero INTEGER PRIMARY KEY, entrenado_hasta INTEGER NOT NULL, dia INTEGER NOT NULL,
  decidido_por TEXT NOT NULL, resultados_usados INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS clave (nombre TEXT PRIMARY KEY, valor TEXT NOT NULL);
"""


class Rechazo(AssertionError):
    """Datos de entrada que no se aceptan; el mensaje explica por qué."""


def filas_csv(texto, columnas):
    """Lee un CSV con encabezado; exige las columnas pedidas (las opcionales pueden faltar)."""
    lector = csv.DictReader(io.StringIO(texto.lstrip("﻿")))
    obligatorias = [c for c in columnas if not c.endswith("?")]
    if not lector.fieldnames or not set(obligatorias) <= {c.strip() for c in lector.fieldnames}:
        raise Rechazo(f"El archivo necesita las columnas {','.join(c.rstrip('?') for c in columnas)}")
    return [{k.strip(): (v or "").strip() for k, v in fila.items() if k} for fila in lector]


class Planta:
    def __init__(self, ruta, catalogo):
        Path(ruta).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(ruta, check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(ESQUEMA)
        self.catalogo = set(catalogo)

    # --- Claves simples (reloj, modelo, modo) ------------------------------------------------------------------

    def leer(self, nombre, defecto=None):
        fila = self.db.execute("SELECT valor FROM clave WHERE nombre = ?", (nombre,)).fetchone()
        return fila["valor"] if fila else defecto

    def escribir(self, nombre, valor):
        with self.db:
            self.db.execute("INSERT OR REPLACE INTO clave VALUES (?, ?)", (nombre, str(valor)))

    @property
    def dia(self):
        v = self.leer("dia")
        return int(v) if v is not None else None

    def vaciar(self):
        with self.db:
            for tabla in ("resultado", "envio", "unidad", "version", "clave"):
                self.db.execute(f"DELETE FROM {tabla}")

    # --- Entradas ---------------------------------------------------------------------------------------------

    def ingresar(self, filas, fuente):
        """Unidades que pasaron Gate Release: [{unidad, codigo, dia}]. Todo o nada: si una fila falla, no entra ninguna."""
        vistas, nuevas = set(), []
        for i, f in enumerate(filas, 1):
            u, c, d = (str(f.get(k, "")).strip() for k in ("unidad", "codigo", "dia"))
            if not (u and c and d):
                raise Rechazo(f"Fila {i}: faltan datos (unidad, codigo, dia)")
            if not d.lstrip("-").isdigit():
                raise Rechazo(f"Fila {i}: el día tiene que ser un número")
            c = c.upper()
            if c not in self.catalogo:
                raise Rechazo(f"Fila {i}: el código {c} no está en el catálogo")
            if u in vistas or self.db.execute("SELECT 1 FROM unidad WHERE id = ?", (u,)).fetchone():
                raise Rechazo(f"Fila {i}: la unidad {u} ya fue ingresada")
            vistas.add(u)
            nuevas.append((u, c, int(d), None, fuente))
        with self.db:
            self.db.executemany("INSERT INTO unidad VALUES (?, ?, ?, ?, ?)", nuevas)
        self._marca("ingreso", len(nuevas))
        return len(nuevas)

    def registrar_resultados(self, filas, fuente):
        """Resultados de Auditoría Adicional: [{unidad, resultado, dia, componente?}]. Solo de unidades enviadas."""
        nuevos = []
        for i, f in enumerate(filas, 1):
            u, r, d = (str(f.get(k, "")).strip() for k in ("unidad", "resultado", "dia"))
            r = r.upper()
            if r not in RESULTADOS:
                raise Rechazo(f"Fila {i}: el resultado tiene que ser OK o CALIBRADA")
            if not d.lstrip("-").isdigit():
                raise Rechazo(f"Fila {i}: el día tiene que ser un número")
            if not self.db.execute("SELECT 1 FROM envio WHERE unidad = ?", (u,)).fetchone():
                raise Rechazo(f"Fila {i}: la unidad {u} no fue enviada a Auditoría Adicional")
            if self.db.execute("SELECT 1 FROM resultado WHERE unidad = ?", (u,)).fetchone():
                raise Rechazo(f"Fila {i}: la unidad {u} ya tiene resultado")
            componente = (f.get("componente") or "").strip() or None
            nuevos.append((u, r, componente if r == "CALIBRADA" else None, int(d), fuente))
        with self.db:
            self.db.executemany("INSERT INTO resultado VALUES (?, ?, ?, ?, ?)", nuevos)
        self._marca("resultados", len(nuevos))
        return len(nuevos)

    def despachar(self, unidades, dia):
        with self.db:
            self.db.executemany("UPDATE unidad SET despachada = ? WHERE id = ? AND despachada IS NULL",
                                [(dia, u) for u in unidades])

    def _marca(self, entrada, n):
        if n:
            self.escribir(f"ultima_{entrada}", f"{self.dia if self.dia is not None else ''}|{n}")

    # --- Playa y envíos ---------------------------------------------------------------------------------------

    def playa(self, t):
        """[(unidad, codigo, dia_gr)] que esperan despacho el día t: Gate Release en [t − 5, t], no enviadas."""
        filas = self.db.execute(
            "SELECT u.id, u.codigo, u.dia_gr FROM unidad u LEFT JOIN envio e ON e.unidad = u.id "
            "WHERE e.unidad IS NULL AND u.dia_gr BETWEEN ? AND ? AND (u.despachada IS NULL OR u.despachada > ?) "
            "ORDER BY u.dia_gr, u.id", (t - ESPERA_MAX, t, t)).fetchall()
        return [(f["id"], f["codigo"], f["dia_gr"]) for f in filas]

    def gate_release(self, t):
        return self.db.execute("SELECT COUNT(*) FROM unidad WHERE dia_gr = ?", (t,)).fetchone()[0]

    def enviar(self, unidad, dia, ronda, posicion, tasa, version, modelo):
        with self.db:
            self.db.execute("INSERT INTO envio VALUES (?, ?, ?, ?, ?, ?, ?)",
                            (unidad, dia, ronda, posicion, tasa, version, modelo))

    def deshacer(self, unidad):
        if self.db.execute("SELECT 1 FROM resultado WHERE unidad = ?", (unidad,)).fetchone():
            raise Rechazo(f"La unidad {unidad} ya tiene resultado: no se puede deshacer")
        with self.db:
            self.db.execute("DELETE FROM envio WHERE unidad = ?", (unidad,))

    def sin_resultado(self):
        return [dict(f) for f in self.db.execute(
            "SELECT e.* FROM envio e LEFT JOIN resultado r ON r.unidad = e.unidad WHERE r.unidad IS NULL")]

    # --- Resultados -------------------------------------------------------------------------------------------

    def envios(self):
        """Todo lo enviado con su resultado, si llegó."""
        return [dict(f) for f in self.db.execute(
            "SELECT e.unidad, e.dia, e.ronda, e.posicion, e.tasa, e.version, e.modelo, u.codigo, u.dia_gr, "
            "r.resultado, r.componente, r.dia AS dia_resultado FROM envio e JOIN unidad u ON u.id = e.unidad "
            "LEFT JOIN resultado r ON r.unidad = e.unidad ORDER BY e.dia DESC, e.ronda DESC, e.unidad")]

    def registros(self, hasta, conocidos_al):
        """(día de auditoría, código, calibrada) de lo enviado con Día ≤ hasta y resultado recibido al día dado."""
        return [(f["dia"], f["codigo"], f["resultado"] == "CALIBRADA") for f in self.db.execute(
            "SELECT e.dia, u.codigo, r.resultado FROM envio e JOIN unidad u ON u.id = e.unidad "
            "JOIN resultado r ON r.unidad = e.unidad WHERE e.dia <= ? AND r.dia <= ?", (hasta, conocidos_al))]

    # --- Versiones del modelo (las crea el calendario de modelo.py) --------------------------------------------------------

    def version(self):
        f = self.db.execute("SELECT * FROM version ORDER BY numero DESC LIMIT 1").fetchone()
        return dict(f) if f else None

    def versiones(self):
        return [dict(f) for f in self.db.execute("SELECT * FROM version ORDER BY numero DESC")]

    def nueva_version(self, entrenado_hasta, dia, decidido_por, resultados_usados):
        numero = (self.version() or {"numero": 0})["numero"] + 1
        with self.db:
            self.db.execute("INSERT INTO version VALUES (?, ?, ?, ?, ?)",
                            (numero, entrenado_hasta, dia, decidido_por, resultados_usados))
        return numero


# --- Reporte para la línea ------------------------------------------------------------------------------------

def reporte_linea(envios, atributos):
    """Agregados entre lo auditado con resultado: por código, versión, motor y mercado; componentes; tendencia semanal.

    `atributos(codigo)` → {"mercado", "version", "motor", "traccion"}. Nunca devuelve unidades.
    """
    auditadas = [e for e in envios if e["resultado"]]

    def grupo(clave):
        g = collections.defaultdict(lambda: [0, 0])
        for e in auditadas:
            k = clave(e)
            g[k][0] += 1
            g[k][1] += e["resultado"] == "CALIBRADA"
        return sorted(({"grupo": k, "n": n, "calibradas": c, "tasa": c / n} for k, (n, c) in g.items()),
                      key=lambda x: (-x["tasa"], -x["n"], x["grupo"]))

    componentes = collections.Counter(e["componente"] for e in auditadas if e["resultado"] == "CALIBRADA" and e["componente"])
    por_codigo = collections.defaultdict(collections.Counter)
    for e in auditadas:
        if e["resultado"] == "CALIBRADA" and e["componente"]:
            por_codigo[e["codigo"]][e["componente"]] += 1
    codigos = grupo(lambda e: e["codigo"])
    for fila in codigos:
        fila["componentes"] = [{"componente": k, "n": n} for k, n in por_codigo[fila["grupo"]].most_common(3)]
    semanas = grupo(lambda e: e["dia"] // 7)
    semanas.sort(key=lambda x: x["grupo"])
    for s in semanas:
        s["desde"], s["hasta"] = s["grupo"] * 7, s["grupo"] * 7 + 6
    calibradas = sum(e["resultado"] == "CALIBRADA" for e in auditadas)
    return {
        "auditadas": len(auditadas), "calibradas": calibradas,
        "por_codigo": codigos,
        "por_version": grupo(lambda e: atributos(e["codigo"])["version"]),
        "por_motor": grupo(lambda e: atributos(e["codigo"])["motor"]),
        "por_mercado": grupo(lambda e: atributos(e["codigo"])["mercado"]),
        "componentes": [{"componente": k, "n": n, "parte": n / calibradas} for k, n in componentes.most_common(10)],
        "semanas": semanas,
    }


def reporte_csv(rep):
    salida = io.StringIO()
    w = csv.writer(salida)
    w.writerow(["agrupacion", "grupo", "auditadas", "calibradas", "tasa"])
    for nombre in ("por_codigo", "por_version", "por_motor", "por_mercado", "semanas"):
        for f in rep[nombre]:
            grupo = f"días {f['desde']}–{f['hasta']}" if nombre == "semanas" else f["grupo"]
            w.writerow([nombre.removeprefix("por_"), grupo, f["n"], f["calibradas"], f"{f['tasa']:.4f}"])
    w.writerow([])
    w.writerow(["componente", "calibradas", "parte"])
    for c in rep["componentes"]:
        w.writerow([c["componente"], c["n"], f"{c['parte']:.4f}"])
    return salida.getvalue()
