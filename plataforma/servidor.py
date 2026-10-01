"""Plataforma FordwardAI (MVP): servidor local con la hoja del día, las decisiones en la playa y la simulación.

    .venv/bin/python -m plataforma.servidor --csv "<Dataset QLS Inspección Adicional.csv>" \\
        --catalogo "<Códigos de catálogo.csv>" [--puerto 8765]

Corre en la notebook: los datos no salen de la máquina. Usa la tabla enmascarada (sin etiquetas de Día >= 200) y
solo días de validación. Ninguna respuesta lleva un VIN: todo pasa por `privacidad.revisar`.
"""
import argparse
import collections
import csv
import io
import json
import tempfile
import threading
import traceback
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import numpy as np

from solucion import datos, hoja
from solucion.cupo import cupo as cupo_5
from solucion.datos import TRAMOS

from . import modelos as modelos_mod
from . import simulacion
from .estado import Dia, normalizar
from .privacidad import SinVin, revisar

WEB = Path(__file__).resolve().parent / "web"
CACHE = Path.home() / ".cache" / "ford-predictive-quality"
VALIDACION = TRAMOS["validacion"]
DIA_INICIAL = 190


class Plataforma:
    """Estado del servidor: tabla, modelos, simulación y el día en curso."""

    def __init__(self, csv_path, catalogo_path, cache=CACHE):
        self.carpeta = cache / "plataforma"
        self.tabla = datos.cargar(csv_path, catalogo_path, cache=cache)
        assert not self.tabla.desbloqueada, "La plataforma usa la tabla enmascarada"
        self.vins = {v.vin for v in self.tabla.vins} | {v.vin for v in self.tabla.cohorte}
        self.modelos = modelos_mod.construir(self.tabla)
        self.dias = {t: len(vs) for t, vs in self.tabla.por_dia(*VALIDACION).items()}
        self.lock = threading.Lock()
        self.sim, self.sim_error = None, None
        self.h, self.dia, self.privado = None, None, {}
        threading.Thread(target=self._simular, daemon=True).start()

    # --- Simulación ------------------------------------------------------------------------------------------

    def _simular(self):
        try:
            otras = {c: [] for c in modelos_mod.ESTOCASTICOS}
            for s in modelos_mod.ml.SEMILLAS[1:]:
                variante = modelos_mod.construir(self.tabla, semilla=s)
                for c in otras:
                    otras[c].append(variante[c])
            self.sim = simulacion.cacheada(self.tabla, self.modelos, self.carpeta, otras)
        except Exception as error:  # noqa: BLE001  Se informa en la pantalla de simulación.
            traceback.print_exc()
            self.sim_error = str(error)

    def evaluacion(self, clave):
        """Cifra de validación del modelo, en el formato que usan los textos de la hoja."""
        if not self.sim:
            return None
        m = self.sim["modelos"][clave]["metricas"]
        return {"precision": m["precision_cupo"], "rango": m["precision_rango95"], "azar": m["azar_mismo_cupo"],
                "lectura": m["lectura"], "calificador": self.sim["calificador"]}

    # --- Día ---------------------------------------------------------------------------------------------------

    def programa_simulado(self, t):
        """El programa de `hoja.simular_programa` y, aparte y solo en memoria, qué VIN hay detrás de cada id."""
        programa = hoja.simular_programa(self.tabla, t)
        por_codigo = collections.defaultdict(list)
        for v in self.tabla.por_dia(t, t).get(t, []):
            por_codigo[v.codigo].append(v)
        privado = {}
        for u, c in programa:
            privado[u] = por_codigo[c].pop(0)
        return programa, privado

    def armar(self, t, clave, cupo=None, programa_csv=None):
        t = int(t)
        assert VALIDACION[0] <= t <= VALIDACION[1], "Solo días de validación (155–194)"
        assert clave in self.modelos, f"Modelo desconocido: {clave}"
        if programa_csv:
            programa, privado = leer_programa(programa_csv, self.tabla.catalogo), {}
        else:
            programa, privado = self.programa_simulado(t)
        cupo = int(cupo) if cupo else None
        h = hoja.armar(self.tabla, programa, t, cupo, predictor=self.modelos[clave], evaluacion=self.evaluacion(clave),
                       programa_simulado=not programa_csv)
        with self.lock:
            self.h, self.privado = h, privado
            self.dia = Dia.desde_hoja(h, programa, clave)
            self.dia.guardar(self.carpeta)
        return self.hoja_json()

    def hoja_json(self):
        h = self.h
        if h is None:
            return None
        h.evaluacion = self.evaluacion(self.dia.modelo) or h.evaluacion  # La simulación termina después de armar.
        tx = hoja.textos(h)
        pf = modelos_mod.prueba_final().get(self.dia.modelo)
        tx["evaluacion"] = tx["evaluacion"].replace("La prueba final todavía no se corrió.", (
            f"Prueba final ya registrada (Días {pf['dias'][0]}–{pf['dias'][1]}): {hoja._pct(pf['precision'])} contra "
            f"{hoja._pct(pf['azar'])} al azar." if pf else
            "Este modelo no tiene lectura en la prueba final: no se relee."))
        return {
            "dia": h.dia, "cupo": h.cupo, "cupo_5": h.cupo_5, "programadas": h.programadas,
            "modelo": self.dia.modelo, "predictor": h.predictor, "programa_simulado": h.programa_simulado,
            "general": h.general, "n_ventana": h.n_ventana, "ventana": h.ventana, "sin_cubrir": h.sin_cubrir,
            "minimo": {"P": h.minimo[0], "origen": h.minimo[1]},
            "filas": [{"codigo": f.codigo, "sugerida": f.sugerida, "tasa": f.tasa, "rango": f.rango, "n": f.n,
                       "cal": f.cal, "veces": f.veces, "programadas": f.programadas, "acumulado": f.acumulado,
                       "mercado": f.mercado, "version": f.version, "motor": f.motor, "traccion": f.traccion,
                       "minimo": any(c == f.codigo for c, _ in h.exploracion)} for f in h.filas],
            "exploracion": [{"codigo": c, "ultimo": u} for c, u in h.exploracion],
            "unidades": [{"codigo": c, "motivo": m, "ids": ids} for c, m, ids in h.unidades],
            "por_que": [{**p, "texto": hoja._por_que_txt(h, p)} for p in h.por_que],
            "agrupaciones": hoja._agrupaciones_txt(h), "textos": tx, "limites": hoja.LIMITES,
        }

    def cierre(self):
        """Solo con programa simulado: cuántas tomadas resultaron CALIBRADA, en agregado, frente al azar."""
        d = self.dia
        assert d is not None, "Primero hay que armar la hoja del día"
        if not self.privado:
            return {"disponible": False, "motivo": "El resultado solo se puede revelar con el programa simulado."}
        tomadas = [u for us in d.tomadas.values() for u in us]
        todos = list(self.privado.values())
        tasa_dia = sum(v.calibrada for v in todos) / len(todos)
        por_codigo = {c: {"tomadas": len(us), "calibradas": sum(self.privado[u].calibrada for u in us)}
                      for c, us in d.tomadas.items() if us}
        return {"disponible": True, "dia": d.dia, "tomadas": len(tomadas), "cupo": d.cupo,
                "calibradas": sum(self.privado[u].calibrada for u in tomadas),
                "esperado_azar": tasa_dia * len(tomadas), "tasa_dia": tasa_dia, "unidades_dia": len(todos),
                "por_codigo": por_codigo,
                "aclaracion": "Día de validación de la base ficticia: el resultado ya se conoce. En planta se "
                              "conocería después de la Auditoría Adicional."}

    def meta(self):
        return {"dias": [{"dia": t, "unidades": n, "cupo": cupo_5(n)} for t, n in self.dias.items()],
                "dia_inicial": DIA_INICIAL, "validacion": VALIDACION, "modelos": modelos_mod.fichas(),
                "fuente": {"csv": self.tabla.fuente.get("csv_sha256", "")[:12],
                           "catalogo": self.tabla.fuente.get("catalogo_sha256", "")[:12]},
                "simulacion_lista": self.sim is not None, "dia_activo": self.h.dia if self.h else None}


def leer_programa(texto, catalogo):
    """Programa `unidad,codigo` recibido como texto; errores legibles para la pantalla."""
    filas = list(csv.DictReader(io.StringIO(texto.lstrip("﻿"))))
    assert filas, "El archivo está vacío"
    assert {"unidad", "codigo"} <= set(filas[0]), "El archivo necesita las columnas unidad,codigo"
    programa = [((r["unidad"] or "").strip(), normalizar(r["codigo"])) for r in filas]
    vacias = [i + 2 for i, (u, c) in enumerate(programa) if not u or not c]
    assert not vacias, f"Filas con datos vacíos: {', '.join(map(str, vacias[:5]))}"
    repetidas = [u for u, n in collections.Counter(u for u, _ in programa).items() if n > 1]
    assert not repetidas, f"Unidades repetidas: {', '.join(repetidas[:5])}"
    desconocidos = sorted({c for _, c in programa} - set(catalogo))
    assert not desconocidos, f"Códigos fuera del catálogo: {', '.join(desconocidos[:5])}"
    return programa


def _jsonable(x):
    if isinstance(x, (np.integer,)):
        return int(x)
    if isinstance(x, (np.floating,)):
        return float(x)
    if isinstance(x, tuple):
        return list(x)
    raise TypeError(type(x))


class Manejador(SimpleHTTPRequestHandler):
    plataforma: Plataforma = None

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(WEB), **kw)

    def log_message(self, formato, *args):  # Sin ruido por cada estático.
        if "/api/" in (args[0] if args else ""):
            super().log_message(formato, *args)

    def _enviar(self, estado, cuerpo, tipo="application/json; charset=utf-8", nombre=None):
        datos_ = cuerpo if isinstance(cuerpo, bytes) else json.dumps(cuerpo, ensure_ascii=False,
                                                                     default=_jsonable).encode("utf-8")
        try:
            revisar(datos_, self.plataforma.vins)
        except SinVin as error:
            estado, tipo = HTTPStatus.INTERNAL_SERVER_ERROR, "application/json; charset=utf-8"
            datos_ = json.dumps({"error": str(error)}, ensure_ascii=False).encode("utf-8")
        self.send_response(estado)
        self.send_header("Content-Type", tipo)
        self.send_header("Cache-Control", "no-store")
        if nombre:
            self.send_header("Content-Disposition", f'attachment; filename="{nombre}"')
        self.send_header("Content-Length", str(len(datos_)))
        self.end_headers()
        self.wfile.write(datos_)

    def _cuerpo(self):
        n = int(self.headers.get("Content-Length") or 0)
        return json.loads(self.rfile.read(n) or b"{}")

    def _api(self, metodo):
        url = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(url.query).items()}
        p, ruta = self.plataforma, url.path.removeprefix("/api/")
        try:
            if metodo == "GET" and ruta == "meta":
                return self._enviar(200, p.meta())
            if metodo == "GET" and ruta == "hoja":
                return self._enviar(200, {"hoja": p.hoja_json(), "estado": p.dia.resumen() if p.dia else None})
            if metodo == "POST" and ruta == "dia":
                b = self._cuerpo()
                hoja_ = p.armar(b["dia"], b.get("modelo", modelos_mod.POR_DEFECTO), b.get("cupo"), b.get("programa"))
                return self._enviar(200, {"hoja": hoja_, "estado": p.dia.resumen()})
            if p.dia is None and ruta in ("decidir", "tomar", "deshacer", "ronda", "estado", "cierre", "descarga"):
                return self._enviar(409, {"error": "Primero hay que armar la hoja del día"})
            if metodo == "GET" and ruta == "estado":
                return self._enviar(200, p.dia.resumen())
            if metodo == "POST" and ruta == "decidir":
                return self._enviar(200, p.dia.decidir(self._cuerpo().get("codigo")))
            if metodo == "POST" and ruta == "tomar":
                b = self._cuerpo()
                with p.lock:
                    unidad = p.dia.tomar(b.get("codigo"), b.get("unidad"))
                    p.dia.guardar(p.carpeta)
                return self._enviar(200, {"unidad": unidad, "decision": p.dia.decidir(b.get("codigo")),
                                          "estado": p.dia.resumen()})
            if metodo == "POST" and ruta == "deshacer":
                with p.lock:
                    codigo = p.dia.deshacer(self._cuerpo().get("unidad"))
                    p.dia.guardar(p.carpeta)
                return self._enviar(200, {"decision": p.dia.decidir(codigo), "estado": p.dia.resumen()})
            if metodo == "POST" and ruta == "ronda":
                with p.lock:
                    ronda = p.dia.registrar_ronda(self._cuerpo().get("en_playa", {}))
                    p.dia.guardar(p.carpeta)
                return self._enviar(200, {"ronda": ronda, "estado": p.dia.resumen()})
            if metodo == "GET" and ruta == "cierre":
                return self._enviar(200, p.cierre())
            if metodo == "GET" and ruta == "simulacion":
                if p.sim_error:
                    return self._enviar(500, {"error": p.sim_error})
                return self._enviar(200, {"lista": p.sim is not None, **(p.sim or {})})
            if metodo == "GET" and ruta == "descarga":
                return self._descarga(q.get("formato", "csv"))
            return self._enviar(404, {"error": f"Ruta desconocida: {ruta}"})
        except AssertionError as error:
            return self._enviar(400, {"error": str(error)})
        except Exception as error:  # noqa: BLE001
            traceback.print_exc()
            return self._enviar(500, {"error": f"Error interno: {error}"})

    def _descarga(self, formato):
        h = self.plataforma.h
        self.plataforma.hoja_json()  # Actualiza la evaluación del modelo si la simulación ya terminó.
        escritores = {"csv": (hoja.escribir_csv, "text/csv; charset=utf-8"),
                      "xlsx": (hoja.escribir_xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
                      "html": (hoja.escribir_html, "text/html; charset=utf-8")}
        assert formato in escritores, "Formato: csv, xlsx o html"
        escribir, tipo = escritores[formato]
        with tempfile.TemporaryDirectory() as carpeta:
            destino = Path(carpeta) / f"hoja-dia-{h.dia}.{formato}"
            escribir(h, destino)
            assert not hoja.vins_en([destino], self.plataforma.vins), "La descarga contenía un VIN"
            cuerpo = destino.read_bytes()
        return self._enviar(200, cuerpo, tipo, destino.name)

    def do_GET(self):  # noqa: N802
        if self.path.startswith("/api/"):
            return self._api("GET")
        return super().do_GET()

    def do_POST(self):  # noqa: N802
        if self.path.startswith("/api/"):
            return self._api("POST")
        self.send_error(HTTPStatus.NOT_FOUND)


def main(argv=None):
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    a.add_argument("--csv", required=True, type=Path)
    a.add_argument("--catalogo", required=True, type=Path)
    a.add_argument("--puerto", type=int, default=8765)
    a.add_argument("--cache", type=Path, default=CACHE)
    o = a.parse_args(argv)
    Manejador.plataforma = Plataforma(o.csv, o.catalogo, o.cache)
    servidor = ThreadingHTTPServer(("127.0.0.1", o.puerto), Manejador)
    print(f"Plataforma lista en http://127.0.0.1:{o.puerto} (Ctrl+C para cortar)", flush=True)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
