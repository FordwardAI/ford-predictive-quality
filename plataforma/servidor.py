"""Plataforma FordwardAI (MVP): de Gate Release al resultado de la auditoría, con el retorno al modelo y a la línea.

    .venv/bin/python -m plataforma.servidor --csv "<Dataset QLS Inspección Adicional.csv>" \\
        --catalogo "<Códigos de catálogo.csv>" [--puerto 8765]

Ciclo de planta: entran las unidades que pasaron Gate Release (`POST /api/ingreso`), el responsable de la selección
elige cuáles van a Auditoría Adicional, vuelven los resultados (`POST /api/resultados`) y la plataforma muestra el
acierto por unidad, actualiza el modelo en días programados (automático) y arma el reporte para la línea.
Mientras no haya conexión con Ford, una fuente simulada reproduce la base día por día con el mismo contrato.

Corre en la notebook: los datos no salen de la máquina. Usa la tabla enmascarada (sin etiquetas de Día >= 200) y solo
días de validación. Ninguna respuesta lleva un VIN de la base: todo pasa por `privacidad.revisar`.
"""
import argparse
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
from solucion.datos import MARGEN, TRAMOS
from solucion.puntaje import Fuente

from . import modelo as modelo_mod
from . import modelos as modelos_mod
from . import simulacion
from .estado import Dia
from .planta import Planta, Rechazo, filas_csv, reporte_csv, reporte_linea
from .privacidad import SinVin, revisar
from .simulador import Simulador

WEB = Path(__file__).resolve().parent / "web"
CACHE = Path.home() / ".cache" / "ford-predictive-quality"
VALIDACION = TRAMOS["validacion"]


class Plataforma:
    """Estado del servidor: tabla, modelos, almacén de planta, fuente simulada y el día en curso."""

    def __init__(self, csv_path, catalogo_path, cache=CACHE):
        self.carpeta = cache / "plataforma"
        self.tabla = datos.cargar(csv_path, catalogo_path, cache=cache)
        assert not self.tabla.desbloqueada, "La plataforma usa la tabla enmascarada"
        self.vins = {v.vin for v in self.tabla.vins} | {v.vin for v in self.tabla.cohorte}
        self.modelos = modelos_mod.construir(self.tabla)
        # Histórico de auditorías al azar: etiquetas completas hasta el Día 149 (el punto de partida en planta).
        self.historico = [(v.dia, v.codigo, v.calibrada) for v in self.tabla.vins if v.dia <= modelo_mod.HISTORICO_HASTA]
        self.planta = Planta(self.carpeta / "planta.db", self.tabla.catalogo)
        self.simulador = Simulador(self.tabla, self.planta)
        self.lock = threading.RLock()
        self.h, self.dia = None, None
        self.sim, self.sim_error = None, None  # Antes de restaurar: la hoja consulta la evaluación.
        if self.planta.dia is None:
            self.reiniciar()
        else:
            self._restaurar()
        threading.Thread(target=self._evaluar, daemon=True).start()

    # --- Evaluación (simulación fuera de línea con etiquetas completas, la de la pantalla Evaluación) ----------

    def _evaluar(self):
        try:
            otras = {c: [] for c in modelos_mod.ESTOCASTICOS}
            for s in modelos_mod.ml.SEMILLAS[1:]:
                variante = modelos_mod.construir(self.tabla, semilla=s)
                for c in otras:
                    otras[c].append(variante[c])
            self.sim = simulacion.cacheada(self.tabla, self.modelos, self.carpeta, otras)
        except Exception as error:  # noqa: BLE001  Se informa en la pantalla de evaluación.
            traceback.print_exc()
            self.sim_error = str(error)

    def evaluacion(self, clave):
        if not self.sim:
            return None
        m = self.sim["modelos"][clave]["metricas"]
        return {"precision": m["precision_cupo"], "rango": m["precision_rango95"], "azar": m["azar_mismo_cupo"],
                "lectura": m["lectura"], "calificador": self.sim["calificador"]}

    # --- Reloj y fuente simulada ------------------------------------------------------------------------------

    def reiniciar(self):
        for f in self.carpeta.glob("dia-*.json"):
            f.unlink()
        self.simulador.iniciar()
        self.h, self.dia = None, None

    def avanzar(self):
        r = self.simulador.avanzar()
        self.h, self.dia = None, None
        # Al empezar el día, si toca, la plataforma actualiza el modelo sola (calendario fijo, ver modelo.py).
        r["version_nueva"] = modelo_mod.aplicar_programa(self.planta, r["dia"])
        return r

    # --- Modelo: versiones congeladas -------------------------------------------------------------------------

    def _version(self, numero=None):
        if numero is None:
            return self.planta.version()
        return next(v for v in self.planta.versiones() if v["numero"] == numero)

    def predictor(self, familia, version, t, entrenado_hasta=None):
        hasta = version["entrenado_hasta"] if entrenado_hasta is None else entrenado_hasta
        f = modelo_mod.fuente(self.historico, self.planta, hasta, t)
        return modelo_mod.predictor(familia, self.modelos[familia], hasta, f, version["numero"])

    def fuente_dia(self, t):
        """Todo lo conocido el día t (histórico y resultados recibidos de Día ≤ t − 5): tasas observadas y mínimo."""
        return Fuente(self.historico + self.planta.registros(t - MARGEN, t))

    # --- Día ---------------------------------------------------------------------------------------------------

    def armar(self, clave=None, cupo=None):
        t = self.planta.dia
        clave = clave or modelos_mod.POR_DEFECTO
        assert clave in self.modelos, f"Modelo desconocido: {clave}"
        assert not (self.dia and self.dia.dia == t and self.dia.enviadas), \
            "Ya hay unidades enviadas hoy: la hoja se rearma mañana"
        playa = self.planta.playa(t)
        assert playa, "No hay unidades en la playa de despacho"
        programa = [(u, c) for u, c, _ in playa]
        # El cupo lo fija Calidad de Planta; por defecto, el 5 % de lo que pasó Gate Release hoy (0 si no hubo).
        cupo = int(cupo) if cupo not in (None, "") else cupo_5(self.planta.gate_release(t))
        v = self._version()
        self.h = self._hoja(programa, t, clave, cupo, v)
        self.dia = Dia.desde_hoja(self.h, programa, clave, v["numero"])
        self.dia.guardar(self.carpeta)
        return self.hoja_json()

    def _hoja(self, programa, t, clave, cupo, version):
        return hoja.armar(self.tabla, programa, t, cupo, predictor=self.predictor(clave, version, t),
                          evaluacion=self.evaluacion(clave), fuente=self.fuente_dia(t))

    def _restaurar(self):
        """Después de reiniciar el servidor, rearma la hoja del día con la misma playa, modelo y versión."""
        archivo = self.carpeta / f"dia-{self.planta.dia}.json"
        if archivo.exists():
            d = Dia.leer(archivo)
            self.h = self._hoja([tuple(p) for p in d.programa], d.dia, d.modelo, d.cupo, self._version(d.version))
            self.dia = d

    def hoja_json(self):
        h = self.h
        if h is None:
            return None
        h.evaluacion = self.evaluacion(self.dia.modelo) or h.evaluacion  # La evaluación termina después de armar.
        tx = hoja.textos(h)
        pf = modelos_mod.prueba_final().get(self.dia.modelo)
        tx["evaluacion"] = tx["evaluacion"].replace("La prueba final todavía no se corrió.", (
            f"Prueba final ya registrada (Días {pf['dias'][0]}–{pf['dias'][1]}): {hoja._pct(pf['precision'])} contra "
            f"{hoja._pct(pf['azar'])} al azar." if pf else "Este modelo no tiene lectura en la prueba final: no se relee."))
        gr = self.planta.gate_release(h.dia)
        tx["corte"] = (f"Cupo del día: {h.cupo} (el 5 % de las {gr} unidades que pasaron Gate Release hoy es "
                       f"{cupo_5(gr)}). En la playa esperan {h.programadas}, de los últimos 5 días.")
        v = self._version(self.dia.version)
        return {
            "dia": h.dia, "cupo": h.cupo, "programadas": h.programadas, "gate_release": gr,
            "modelo": self.dia.modelo, "predictor": h.predictor, "version": v,
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

    def estado(self):
        """Avance del día con el resultado de cada enviada, si ya volvió."""
        if not self.dia:
            return None
        r = self.dia.resumen()
        por_unidad = {e["unidad"]: e for e in self.planta.envios()}
        r["enviadas"] = [{**e, "dia_gr": por_unidad.get(e["unidad"], {}).get("dia_gr"),
                          "resultado": por_unidad.get(e["unidad"], {}).get("resultado")} for e in r["enviadas"]]
        return r

    def enviar(self, codigo):
        d, h = self.dia, self.h
        unidad = d.tomar(codigo)
        fila = next(i for i, f in enumerate(h.filas) if f.codigo == d.enviadas[-1]["codigo"])
        self.planta.enviar(unidad, d.dia, len(d.rondas) + 1, fila + 1, h.filas[fila].tasa, d.version, d.modelo)
        d.guardar(self.carpeta)
        return unidad

    def deshacer(self, unidad):
        self.planta.deshacer(unidad)
        codigo = self.dia.deshacer(unidad)
        self.dia.guardar(self.carpeta)
        return codigo

    # --- Lecturas de planta -----------------------------------------------------------------------------------

    def resumen_planta(self):
        t = self.planta.dia
        envios = self.planta.envios()

        def ultima(entrada):
            v = self.planta.leer(f"ultima_{entrada}")
            if not v:
                return None
            dia, n = v.split("|")
            return {"dia": int(dia) if dia else None, "n": int(n)}
        playa = self.planta.playa(t)
        return {
            "dia": t, "modo": self.planta.leer("modo", "archivo"), "inicio": VALIDACION[0], "fin": VALIDACION[1],
            "gate_release_hoy": self.planta.gate_release(t), "playa": len(playa),
            "playa_dias_anteriores": sum(1 for *_, d in playa if d < t),
            "cupo_sugerido": cupo_5(self.planta.gate_release(t)),
            "enviadas_total": len(envios), "con_resultado": sum(1 for e in envios if e["resultado"]),
            "entradas": {"ingreso": ultima("ingreso"), "resultados": ultima("resultados")},
            "hoja_armada": bool(self.h and self.h.dia == t), "version": self.planta.version(),
            "programa": self.programa(),
        }

    def envios(self):
        e = self.planta.envios()
        con = [x for x in e if x["resultado"]]
        cal = sum(x["resultado"] == "CALIBRADA" for x in con)
        return {"envios": e, "cifras": {"enviadas": len(e), "con_resultado": len(con), "calibradas": cal,
                                        "pendientes": len(e) - len(con), "precision": cal / len(con) if con else None}}

    def atributos(self, codigo):
        mercado, version, motor, traccion = hoja._atributos(self.tabla, codigo)
        return {"mercado": mercado, "version": version, "motor": motor, "traccion": traccion}

    def linea(self):
        return reporte_linea(self.planta.envios(), self.atributos)

    def programa(self):
        t = self.planta.dia
        v = self.planta.version()
        return {**modelo_mod.PROGRAMA, "hoy": bool(v and v["dia"] == t and v["numero"] > 1),
                "proxima": modelo_mod.proxima(t), "nuevos": modelo_mod.nuevos(self.planta, v, t) if v else 0}

    def cambios(self):
        """Qué cambió con la última actualización, para los códigos que hoy esperan en la playa."""
        versiones = self.planta.versiones()
        if len(versiones) < 2:
            return None
        nueva, anterior = versiones[0], versiones[1]
        t = self.planta.dia
        clave = self.dia.modelo if self.dia else modelos_mod.POR_DEFECTO
        codigos = sorted({c for _, c, _ in self.planta.playa(t)})
        filas = modelo_mod.comparar(self.predictor(clave, anterior, t), self.predictor(clave, nueva, t), t, codigos)
        return {"modelo": clave, "anterior": anterior, "nueva": nueva, "filas": filas,
                "suben": sum(f["puesto_nuevo"] < f["puesto_actual"] for f in filas),
                "bajan": sum(f["puesto_nuevo"] > f["puesto_actual"] for f in filas)}

    def meta(self):
        return {"validacion": VALIDACION, "modelos": modelos_mod.fichas(),
                "fuente": {"csv": self.tabla.fuente.get("csv_sha256", "")[:12],
                           "catalogo": self.tabla.fuente.get("catalogo_sha256", "")[:12]},
                "simulacion_lista": self.sim is not None, "programa": modelo_mod.PROGRAMA}


def _jsonable(x):
    if isinstance(x, np.integer):
        return int(x)
    if isinstance(x, np.floating):
        return float(x)
    if isinstance(x, (tuple, set)):
        return list(x)
    raise TypeError(type(x))


def _filas(cuerpo, columnas):
    """Filas de una entrada: JSON `{"filas": [...]}` o `{"csv": "..."}` con encabezado."""
    if "csv" in cuerpo:
        return filas_csv(cuerpo["csv"], columnas)
    filas = cuerpo.get("filas")
    if not isinstance(filas, list) or not filas:
        raise Rechazo("Faltan las filas (JSON «filas» o texto «csv»)")
    return filas


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
            if metodo == "GET" and ruta == "simulacion":  # Fuera del lock: la evaluación corre en otro hilo.
                if p.sim_error:
                    return self._enviar(500, {"error": p.sim_error})
                return self._enviar(200, {"lista": p.sim is not None, **(p.sim or {})})
            with p.lock:
                return self._ruta(metodo, ruta, q, p)
        except AssertionError as error:  # Incluye Rechazo: datos de entrada que no se aceptan.
            return self._enviar(400, {"error": str(error)})
        except Exception as error:  # noqa: BLE001
            traceback.print_exc()
            return self._enviar(500, {"error": f"Error interno: {error}"})

    def _ruta(self, metodo, ruta, q, p):
        b = self._cuerpo() if metodo == "POST" else {}
        # Planta: reloj, entradas y lecturas.
        if metodo == "GET" and ruta == "meta":
            return self._enviar(200, p.meta())
        if metodo == "GET" and ruta == "planta":
            return self._enviar(200, p.resumen_planta())
        if metodo == "POST" and ruta == "planta/avanzar":
            r = p.avanzar()
            return self._enviar(200, {"avance": r, "planta": p.resumen_planta()})
        if metodo == "POST" and ruta == "planta/reiniciar":
            p.reiniciar()
            return self._enviar(200, {"planta": p.resumen_planta()})
        if metodo == "POST" and ruta == "ingreso":
            n = p.planta.ingresar(_filas(b, ["unidad", "codigo", "dia"]), "archivo")
            return self._enviar(200, {"ingresadas": n, "planta": p.resumen_planta()})
        if metodo == "POST" and ruta == "resultados":
            n = p.planta.registrar_resultados(_filas(b, ["unidad", "resultado", "dia", "componente?"]), "archivo")
            return self._enviar(200, {"recibidos": n, "planta": p.resumen_planta()})
        if metodo == "POST" and ruta == "despacho":
            filas = _filas(b, ["unidad", "dia"])
            for f in filas:
                p.planta.despachar([f["unidad"]], int(f["dia"]))
            return self._enviar(200, {"despachadas": len(filas)})
        if metodo == "GET" and ruta == "envios":
            return self._enviar(200, p.envios())
        if metodo == "GET" and ruta == "linea":
            return self._enviar(200, p.linea())
        if metodo == "GET" and ruta == "linea.csv":
            return self._enviar(200, reporte_csv(p.linea()).encode("utf-8"), "text/csv; charset=utf-8",
                                f"reporte-linea-dia-{p.planta.dia}.csv")
        # Modelo: versiones programadas (la plataforma las aplica sola al empezar el día).
        if metodo == "GET" and ruta == "modelo":
            return self._enviar(200, {"versiones": p.planta.versiones(), "programa": p.programa(), "cambios": p.cambios()})
        # Hoja y selección del día.
        if metodo == "GET" and ruta == "hoja":
            return self._enviar(200, {"hoja": p.hoja_json(), "estado": p.estado()})
        if metodo == "POST" and ruta == "dia":
            hoja_ = p.armar(b.get("modelo"), b.get("cupo"))
            return self._enviar(200, {"hoja": hoja_, "estado": p.estado()})
        if p.dia is None and ruta in ("decidir", "tomar", "deshacer", "ronda", "estado", "descarga"):
            return self._enviar(409, {"error": "Primero hay que armar la hoja del día"})
        if metodo == "GET" and ruta == "estado":
            return self._enviar(200, p.estado())
        if metodo == "POST" and ruta == "decidir":
            return self._enviar(200, p.dia.decidir(b.get("codigo")))
        if metodo == "POST" and ruta == "tomar":
            unidad = p.enviar(b.get("codigo"))
            return self._enviar(200, {"unidad": unidad, "decision": p.dia.decidir(b.get("codigo")), "estado": p.estado()})
        if metodo == "POST" and ruta == "deshacer":
            codigo = p.deshacer(b.get("unidad"))
            return self._enviar(200, {"decision": p.dia.decidir(codigo), "estado": p.estado()})
        if metodo == "POST" and ruta == "ronda":
            ronda = p.dia.registrar_ronda(b.get("en_playa", {}))
            p.dia.guardar(p.carpeta)
            return self._enviar(200, {"ronda": ronda, "estado": p.estado()})
        if metodo == "GET" and ruta == "descarga":
            return self._descarga(q.get("formato", "csv"))
        return self._enviar(404, {"error": f"Ruta desconocida: {ruta}"})

    def _descarga(self, formato):
        h = self.plataforma.h
        self.plataforma.hoja_json()
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
