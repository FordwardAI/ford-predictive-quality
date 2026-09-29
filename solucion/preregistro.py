"""Preregistro y corrida única de la prueba final (P7).

    .venv/bin/python -m solucion.preregistro generar [--salida solucion/preregistro.json]
    .venv/bin/python -m solucion.preregistro correr --preregistro solucion/preregistro.json \\
        --hash-preregistro <sha256> --csv "<Dataset QLS Inspección Adicional.csv>" --catalogo "<Códigos de catálogo.csv>"

`generar` arma el preregistro desde los resultados de validación (eleccion.json, p5.json y
p6.json) con `"estado": "propuesto"`. Lo que falta queda como "pendiente". El equipo lo revisa,
cambia el estado a "acordado" (y cada "pendiente" por su valor o por "fuera del preregistro"),
lo commitea y lo enlaza en #33.

`correr` es lo único que carga la base con las etiquetas de Día >= 200. Se niega salvo que el
preregistro esté acordado, commiteado sin cambios, sin "pendiente", con el hash pasado por
argumento y con los hashes de la fuente cargada. Se corre una sola vez, en sesión conjunta.
Cada corrida se agrega a solucion/resultados/prueba-final.json: si aparece un bug, se corrige,
se vuelve a correr y quedan las dos cifras.

Contrato de las piezas: un módulo con `prueba(tabla, config) -> dict` (solucion.exploracion,
solucion.diferencial, solucion.hoja). `config` es la sección de la pieza en el preregistro más
"preregistro" (el preregistro completo). Si el módulo o la función no existen, la pieza queda
registrada como no corrida.
"""
import argparse
import dataclasses
import datetime
import hashlib
import importlib
import json
import subprocess
import sys
from pathlib import Path

from . import cupo, datos
from .cupo import diferencia, remuestreos, resultado, simular
from .datos import CUTOFF, PRUEBA_DESDE, RAIZ, TRAMOS
from .puntaje import REGISTRO, crear, wilson

RESULTADOS = RAIZ / "solucion" / "resultados"
PREREGISTRO = RAIZ / "solucion" / "preregistro.json"
PRUEBA_FINAL = RESULTADOS / "prueba-final.json"
PENDIENTE = "pendiente"
FUERA = "fuera del preregistro"  # Valor que el equipo pone a una pieza que no se lee en la prueba.
ENTRENAMIENTO_FINAL_HASTA = TRAMOS["entrenamiento_final"][1]  # 194
REFERENCIAS_SIN_SEMILLA = {"tasa_fija", "movil", "movil_mercado", "decaimiento"}  # Deterministas.
MODULOS_ALTERNATIVAS = ("solucion.referencias", "solucion.ml")  # Registran familias en puntaje.REGISTRO.
PIEZAS = {  # Pieza del preregistro -> módulo con prueba(tabla, config).
    "p5": "solucion.exploracion",
    "p6": "solucion.diferencial",
    "e3": "solucion.hoja",
}
TRAMOS_PRUEBA = [  # Mismo predictor congelado frente al azar en cada uno (#7, punto 7).
    {"nombre": "prueba completa", "desde": PRUEBA_DESDE, "hasta": None, "cohorte": False, "lectura": "principal",
     "particion": "prueba_final"},
    {"nombre": f"prueba ≤{CUTOFF}", "desde": PRUEBA_DESDE, "hasta": CUTOFF, "cohorte": False, "lectura": "principal",
     "particion": "prueba_final_hasta_260"},
    {"nombre": f"prueba >{CUTOFF}", "desde": CUTOFF + 1, "hasta": None, "cohorte": False,
     "lectura": "descriptiva: cupo ~8, demasiado chico para leerlo", "particion": "prueba_final_despues_260"},
    {"nombre": f"sensibilidad con la cohorte posterior a {CUTOFF}", "desde": PRUEBA_DESDE, "hasta": None,
     "cohorte": True, "lectura": "sensibilidad: suma la cohorte de primer evento posterior a DIA_260 (toda OK)",
     "particion": "sensibilidad_prueba_con_cohorte"},
]
REGLAS = {
    "predictor": "En cada tramo, la ganadora congelada contra el azar al mismo cupo diario: precisión en el cupo, "
                 "veces el azar y recupero con rango del 95 % (bootstrap por días). Lectura sin umbral: mejora si "
                 "el rango de la diferencia con el azar queda entero sobre 0, peor si queda entero debajo, "
                 "inconcluso si incluye 0. Donde no hay CALIBRADA no se calcula veces el azar: solo cuántas se "
                 "encontraron.",
    "componente": "Acierto de los 3 primeros componentes por código contra los 3 primeros generales, con rango "
                  "del 95 % por bootstrap, en la prueba.",
    "detector": "Detecciones reales del detector configurado hasta el final de la prueba, incluidas las cercanas "
                "a DIA_260, como observaciones: no se afirman causas.",
    "subcategorizacion": "Orden de las subcategorías en la prueba (tabla descriptiva).",
    "casi_no_se_calibran": "Un código que casi no se calibra se sostiene si su rango de Wilson del 95 % en la "
                           "prueba completa queda entero por debajo de la tasa general de la prueba completa.",
    "e3": f"La hoja final (E3) usa el último día de la prueba ≤{CUTOFF} con VIN.",
    "anexo_historial": "No se lee en la prueba: no es elegible y queda con cifras de validación.",
}
YA_VISTO = [  # Límites declarados siempre (#7, puntos 2 y 8; plan de acción, incompatibilidad 4).
    "El tramo de prueba (Día 200–260) ya lo exploraron los experimentos de modelado "
    "(research/experimentos-modelado.md), que eligieron ahí la ventana de 60 días: la cifra puede ser optimista.",
    "Las tasas por mercado dentro de la prueba ya están publicadas en research/catalog-groups.json.",
    "Los totales CALIBRADA de la prueba por tramo ya están publicados en research/validation-partitions.json.",
    "Que los auditados sean una selección al azar es un supuesto de Ford.",
    "En planta solo se conocería el resultado de lo que se elige auditar.",
    "El Día del VIN es aproximado: max(Fecha Inspección, Fecha Reparación).",
]
NO_SE_LEE = [
    "Las demás alternativas de P3 y P4: solo con cifras de validación.",
    "Oráculo y versión con fuga: no elegibles.",
    "Anexo de historial: disponibilidad no probada; solo validación.",
    "Todo lo que no figura en este preregistro.",
]
CASI_NO_SE_CALIBRAN = {  # Default propuesto si p6.json no trae su propia configuración.
    "candidatos": f"Códigos cuyo rango de Wilson del 95 % con Día ≤{ENTRENAMIENTO_FINAL_HASTA} queda entero por "
                  f"debajo de la tasa general ≤{ENTRENAMIENTO_FINAL_HASTA}",
    "hasta": ENTRENAMIENTO_FINAL_HASTA,
}


class Rechazo(Exception):
    """El preregistro no habilita la corrida."""


# --- generar -----------------------------------------------------------------------------------------------


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def para_prueba(familia, parametros):
    """Parámetros de la ganadora en la prueba final.

    - Modo fijo (tasa fija, o ML con "modo": "fijo"): se reentrena con Día ≤194 (`hasta` = 194).
    - Móviles, mercado, decaimiento y ML reentrenado: sin cambios; ya usan todo resultado de Día ≤ t−5,
      que en la prueba incluye ≤194 y los resultados de la prueba a medida que se conocen.
    - Azar, oráculo, fuga y anexo de historial no son elegibles.
    """
    clase = REGISTRO.get(familia)
    if familia in ("azar", "oraculo", "fuga") or (clase is not None and not getattr(clase, "elegible", True)):
        raise Rechazo(f"La familia {familia!r} no es elegible para la prueba final")
    parametros = dict(parametros)
    if familia == "tasa_fija" or parametros.get("modo") == "fijo":
        return {**parametros, "hasta": ENTRENAMIENTO_FINAL_HASTA}, "fijo: reentrenada con Día ≤194"
    return parametros, "actualizable: resultados de Día ≤ t−5, también dentro de la prueba"


def _leer(archivo):
    archivo = Path(archivo)
    return (json.loads(archivo.read_text()), {"archivo": _relativo(archivo), "sha256": sha256(archivo)}) \
        if archivo.exists() else (None, "no existía al generar")  # Sus claves quedan "pendiente".


def _relativo(path):
    path = Path(path).resolve()
    return str(path.relative_to(RAIZ)) if RAIZ in path.parents else path.name


def _seccion(resultado_pieza, claves, nombres=("configuracion", "eleccion", "elegida")):
    """Busca las claves en la sección de configuración de la pieza; lo que falta queda "pendiente"."""
    if resultado_pieza is None:
        return {c: PENDIENTE for c in claves}
    seccion = next((resultado_pieza[n] for n in nombres if isinstance(resultado_pieza.get(n), dict)), resultado_pieza)
    return {c: seccion.get(c, resultado_pieza.get(c, PENDIENTE)) for c in claves}


def _esperados():
    archivo = RAIZ / "research" / "validation-partitions.json"
    if not archivo.exists():
        return {}
    return json.loads(archivo.read_text()).get("partitions", {})


def generar(resultados=RESULTADOS, fecha=None):
    """Preregistro propuesto desde los resultados de validación que existan."""
    eleccion, fuente_eleccion = _leer(Path(resultados) / "eleccion.json")
    p5, fuente_p5 = _leer(Path(resultados) / "p5.json")
    p6, fuente_p6 = _leer(Path(resultados) / "p6.json")
    for modulo in MODULOS_ALTERNATIVAS:
        _importar(modulo)

    if eleccion is None:
        ganadora = en_prueba = PENDIENTE
        semilla_modelo = PENDIENTE
    else:
        g = eleccion["ganadora"]
        ganadora = {k: g[k] for k in ("alternativa", "familia", "parametros") if k in g}
        ganadora["en_validacion"] = {k: g.get(k) for k in ("precision_cupo", "precision_rango95", "veces_azar",
                                                            "veces_azar_rango95", "recupero", "lectura",
                                                            "calificador")}
        parametros, modo = para_prueba(g["familia"], g["parametros"])
        en_prueba = {"familia": g["familia"], "parametros": parametros, "modo": modo}
        semilla_modelo = ("no aplica: la ganadora es determinista" if g["familia"] in REFERENCIAS_SIN_SEMILLA
                          else g["parametros"].get("semillas", PENDIENTE))

    p6_config = _seccion(p6, ("componente", "detector", "subcategorizacion", "casi_no_se_calibran"))
    if p6_config["casi_no_se_calibran"] == PENDIENTE:
        p6_config["casi_no_se_calibran"] = dict(CASI_NO_SE_CALIBRAN)
    esperados = _esperados()
    tramos = [{**{k: v for k, v in t.items() if k != "particion"},
               "vin_esperados": esperados.get(t["particion"], {}).get("vins")} for t in TRAMOS_PRUEBA]

    return {
        "estado": "propuesto",
        "fecha": fecha or datetime.date.today().isoformat(),
        "como_acordar": "Revisar en equipo. Reemplazar cada \"pendiente\" por su valor o por \"fuera del "
                        "preregistro\", cambiar estado a \"acordado\", commitear, enlazar en #33 y correr una vez "
                        "con --hash-preregistro <sha256 del archivo commiteado>.",
        "fuente": {"csv_sha256": datos.SHA_CSV, "catalogo_sha256": datos.SHA_CATALOGO},
        "version_codigo": cupo.version_codigo(),
        "entradas": {"eleccion": fuente_eleccion, "p5": fuente_p5, "p6": fuente_p6},
        "ganadora": ganadora,
        "ganadora_en_prueba": en_prueba,
        "semillas": {"desempate": cupo.SEMILLA_DESEMPATE, "bootstrap": cupo.SEMILLA_BOOTSTRAP,
                     "remuestreos": cupo.REMUESTREOS, "modelo": semilla_modelo},
        "piezas": {
            "p5": _seccion(p5, ("politica", "minimo_por_codigo")),
            "p6": p6_config,
            "e3": {"dia": f"último día de la prueba ≤{CUTOFF} con VIN (se cuenta sin etiquetas al correr)"},
        },
        "tramos": tramos,
        "reglas_de_lectura": REGLAS,
        "ya_visto": YA_VISTO,
        "no_se_lee_en_prueba": NO_SE_LEE,
    }


def escribir(preregistro, salida):
    salida = Path(salida)
    if salida.exists() and json.loads(salida.read_text()).get("estado") == "acordado":
        raise Rechazo(f"{salida} ya está acordado: no se sobrescribe")
    salida.parent.mkdir(parents=True, exist_ok=True)
    salida.write_text(json.dumps(preregistro, ensure_ascii=False, indent=2) + "\n")
    return sha256(salida)


# --- correr ------------------------------------------------------------------------------------------------


def pendientes(valor, ruta="preregistro"):
    """Rutas de todo valor "pendiente" dentro del preregistro."""
    if valor == PENDIENTE:
        return [ruta]
    if isinstance(valor, dict):
        return [p for k, v in valor.items() for p in pendientes(v, f"{ruta}.{k}")]
    if isinstance(valor, list):
        return [p for i, v in enumerate(valor) for p in pendientes(v, f"{ruta}[{i}]")]
    return []


def verificar_git(path):
    """El preregistro está versionado y sin cambios respecto de HEAD; devuelve el commit que lo fijó."""
    path = Path(path).resolve()
    git = ["git", "-C", str(RAIZ)]
    if subprocess.run([*git, "ls-files", "--error-unmatch", "--", str(path)], capture_output=True).returncode:
        raise Rechazo(f"{path.name} no está commiteado")
    if subprocess.run([*git, "diff", "--quiet", "HEAD", "--", str(path)], capture_output=True).returncode:
        raise Rechazo(f"{path.name} tiene cambios sin commitear")
    return subprocess.run([*git, "log", "-1", "--format=%H", "--", str(path)], capture_output=True,
                          text=True).stdout.strip()


def habilitar(path, hash_pasado, git=verificar_git):
    """Aplica los controles previos a leer la prueba; devuelve (preregistro, sha, commit)."""
    path = Path(path)
    preregistro = json.loads(path.read_text())
    if preregistro.get("estado") != "acordado":
        raise Rechazo(f"El preregistro está {preregistro.get('estado')!r}, no \"acordado\"")
    sha = sha256(path)
    if hash_pasado != sha:
        raise Rechazo(f"El hash pasado no es el del preregistro ({sha})")
    commit = git(path)
    faltan = pendientes(preregistro)
    if faltan:
        raise Rechazo("El preregistro tiene entradas pendientes: " + ", ".join(faltan))
    return preregistro, sha, commit


def _importar(modulo):
    try:
        return importlib.import_module(modulo)
    except ModuleNotFoundError as e:
        if e.name != modulo:
            raise
        return None


def _con_cohorte(tabla):
    return dataclasses.replace(tabla, vins=sorted(tabla.vins + tabla.cohorte, key=lambda v: v.vin), cohorte=[])


def evaluar_tramo(tabla, ganadora, azar, tramo, semillas):
    """Ganadora y azar en un tramo, con el mismo juego de remuestreos por días."""
    base = _con_cohorte(tabla) if tramo["cohorte"] else tabla
    hasta = tramo["hasta"] if tramo["hasta"] is not None else max((v.dia for v in base.vins), default=0)
    etiqueta = tramo["nombre"]
    dias = len(base.por_dia(tramo["desde"], hasta))
    salida = {"tramo": etiqueta, "dias_del_vin": [tramo["desde"], hasta], "lectura_del_tramo": tramo["lectura"],
              "vin_esperados": tramo.get("vin_esperados")}
    if not dias:
        return {**salida, "dias": 0, "vins": 0, "nota": "Sin VIN en el tramo: no se evalúa."}
    idx = remuestreos(dias, semilla=semillas["bootstrap"], r=semillas["remuestreos"])
    evaluados = {}
    for clave, puntaje in (("ganadora", ganadora), ("azar", azar)):
        d = simular(base, puntaje, tramo["desde"], hasta, semilla=semillas["desempate"])
        r = resultado(puntaje, d, idx, base, etiqueta)
        r["semillas"] = {k: semillas[k] for k in ("desempate", "bootstrap", "remuestreos")}
        if r["calibrada_tramo"] == 0:  # #7, punto 7: solo cuántas se encontraron.
            r = {**r, "veces_azar": None, "veces_azar_rango95": None, "lectura": None,
                 "nota": "Sin CALIBRADA en el tramo: solo cuántas se encontraron."}
        evaluados[clave] = (r, d)
    (rg, dg), (_, da) = evaluados["ganadora"], evaluados["azar"]
    return {**salida, "vins": rg["vins"], "ganadora": rg, "azar_simulado": evaluados["azar"][0],
            "diferencia_con_azar_simulado_rango95": diferencia(da, dg, idx)}


def casi_no_se_calibran(tabla, config, desde=PRUEBA_DESDE):
    """Candidatos con Día ≤ hasta; se sostienen si su Wilson 95 % en la prueba queda debajo de la general."""
    def conteos(vins):
        salida = {}
        for v in vins:
            n, cal = salida.get(v.codigo, (0, 0))
            salida[v.codigo] = (n + 1, cal + v.calibrada)
        return salida

    def general(c):
        n = sum(x for x, _ in c.values())
        return sum(y for _, y in c.values()) / n if n else 0.0

    antes = conteos([v for v in tabla.vins if v.dia <= config["hasta"]])
    prueba = conteos([v for v in tabla.vins if v.dia >= desde])
    tasa_antes, tasa_prueba = general(antes), general(prueba)
    candidatos = sorted(c for c, (n, cal) in antes.items() if wilson(cal, n)[1] < tasa_antes)
    con_vin = [c for c in candidatos if c in prueba]
    sostenidos = [c for c in con_vin if wilson(prueba[c][1], prueba[c][0])[1] < tasa_prueba]
    return {"candidatos": len(candidatos), "con_vin_en_prueba": len(con_vin), "se_sostienen": len(sostenidos),
            "codigos_que_se_sostienen": sostenidos}


def correr_pieza(nombre, tabla, config, preregistro):
    if config == FUERA:
        return {"corrida": False, "motivo": "Fuera del preregistro: se muestra solo con cifras de validación."}
    modulo = _importar(PIEZAS[nombre])
    funcion = getattr(modulo, "prueba", None) if modulo else None
    if funcion is None:
        return {"corrida": False, "motivo": f"{PIEZAS[nombre]}.prueba(tabla, config) no existe: no se corrió."}
    return {"corrida": True, "resultado": funcion(tabla, {**config, "preregistro": preregistro})}


def correr(preregistro_path, hash_pasado, csv_path=None, catalogo_path=None, salida=PRUEBA_FINAL,
           git=verificar_git, cargar=None, ahora=None):
    """La corrida única. `git` y `cargar` se inyectan en las pruebas sintéticas."""
    preregistro, sha, commit = habilitar(preregistro_path, hash_pasado, git)
    for modulo in MODULOS_ALTERNATIVAS:
        _importar(modulo)
    cargar = cargar or (lambda: datos.cargar(csv_path, catalogo_path, cache=None, desbloquear=True))
    tabla = cargar()
    if not tabla.desbloqueada:
        raise Rechazo("La tabla cargada no está desbloqueada")
    for clave in ("csv_sha256", "catalogo_sha256"):
        if tabla.fuente.get(clave) != preregistro["fuente"][clave]:
            raise Rechazo(f"La fuente cargada no coincide con el preregistro ({clave})")

    g = preregistro["ganadora_en_prueba"]
    ganadora = crear(g["familia"], g["parametros"], tabla)
    azar = crear("azar", {}, tabla)
    semillas = preregistro["semillas"]
    tramos = [evaluar_tramo(tabla, ganadora, azar, t, semillas) for t in preregistro["tramos"]]

    piezas = preregistro["piezas"]
    dias_260 = tabla.por_dia(PRUEBA_DESDE, CUTOFF)
    e3 = {**piezas["e3"], "dia": max(dias_260) if dias_260 else None} if piezas["e3"] != FUERA else FUERA
    config_casi = piezas["p6"].get("casi_no_se_calibran", FUERA) if isinstance(piezas["p6"], dict) else FUERA
    corrida = {
        "fecha": (ahora or datetime.datetime.now(datetime.timezone.utc)).isoformat(timespec="seconds"),
        "preregistro": _relativo(preregistro_path),
        "preregistro_sha256": sha,
        "preregistro_commit": commit,
        "version_codigo": cupo.version_codigo(),
        "version_codigo_preregistro": preregistro.get("version_codigo"),
        "fuente": {k: tabla.fuente.get(k) for k in ("csv_sha256", "catalogo_sha256")},
        "ganadora": {"alternativa": ganadora.nombre, "familia": ganadora.familia, "parametros": ganadora.parametros},
        "tramos": tramos,
        "piezas": {
            "p5": correr_pieza("p5", tabla, piezas["p5"], preregistro),
            "p6": correr_pieza("p6", tabla, piezas["p6"], preregistro),
            "casi_no_se_calibran": ({"corrida": False, "motivo": "Fuera del preregistro."} if config_casi == FUERA
                                    else {"corrida": True, "resultado": casi_no_se_calibran(tabla, config_casi)}),
            "e3": correr_pieza("e3", tabla, e3, preregistro),
        },
        "ya_visto": preregistro["ya_visto"],
    }
    salida = Path(salida)
    registro = json.loads(salida.read_text()) if salida.exists() else {"pieza": "P7 prueba final", "corridas": []}
    registro["corridas"].append(corrida)
    salida.parent.mkdir(parents=True, exist_ok=True)
    salida.write_text(json.dumps(registro, ensure_ascii=False, indent=2) + "\n")
    return registro


def _pct(x):
    return "—" if x is None else f"{100 * x:.1f}".replace(".", ",")


def resumen(registro):
    """Texto en español con la frase permitida por tramo, para cada corrida del registro."""
    lineas = []
    corridas = registro["corridas"]
    if len(corridas) > 1:
        lineas.append(f"Hay {len(corridas)} corridas: se informan todas (plan de acción, corrida única).")
    for i, c in enumerate(corridas, 1):
        lineas.append(f"\nCorrida {i} ({c['fecha']}, preregistro {c['preregistro_sha256'][:12]}, código "
                      f"{c['version_codigo'][:12]}): {c['ganadora']['alternativa']}")
        for t in c["tramos"]:
            if "ganadora" not in t:
                lineas.append(f"- {t['tramo']}: {t['nota']}")
                continue
            r = t["ganadora"]
            calificador = r["calificador"][0].upper() + r["calificador"][1:]
            if r.get("lectura") is None or t["lectura_del_tramo"].startswith("descriptiva"):
                nota = r.get("nota") or f"Lectura {t['lectura_del_tramo']}."
                lineas.append(f"- {calificador}: se encontraron {r['calibrada_elegidas']} "
                              f"CALIBRADA entre {r['elegidos']} elegidos. {nota}")
                continue
            rango = r["precision_rango95"]
            texto = (f"- {calificador}: de cada 100 elegidos se calibrarían "
                     f"{_pct(r['precision_cupo'])}, contra {_pct(r['azar_mismo_cupo'])} al azar (rango del 95 %: "
                     f"{_pct(rango[0])}–{_pct(rango[1])}): {r['lectura']}.")
            if not t["lectura_del_tramo"].startswith("principal"):
                texto += f" Lectura {t['lectura_del_tramo']}."
            lineas.append(texto)
        for nombre, p in c["piezas"].items():
            lineas.append(f"- Pieza {nombre}: " + ("corrida" if p["corrida"] else p["motivo"]))
    lineas.append("\nLímites que se declaran siempre:")
    lineas += [f"- {x}" for x in corridas[-1]["ya_visto"]]
    return "\n".join(lineas)


def main(argv=None):
    assert sys.version_info[:2] == (3, 13), "Usar Python 3.13 (ver .python-version y solucion/README.md)"
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="accion", required=True)
    g = sub.add_parser("generar", help="Arma el preregistro propuesto desde los resultados de validación")
    g.add_argument("--salida", type=Path, default=PREREGISTRO)
    g.add_argument("--resultados", type=Path, default=RESULTADOS)
    c = sub.add_parser("correr", help="Corrida única de la prueba final (sesión conjunta)")
    c.add_argument("--preregistro", type=Path, default=PREREGISTRO)
    c.add_argument("--hash-preregistro", required=True)
    c.add_argument("--csv", required=True, type=Path)
    c.add_argument("--catalogo", required=True, type=Path)
    c.add_argument("--salida", type=Path, default=PRUEBA_FINAL)
    opciones = parser.parse_args(argv)
    try:
        if opciones.accion == "generar":
            preregistro = generar(opciones.resultados)
            sha = escribir(preregistro, opciones.salida)
            faltan = pendientes(preregistro)
            print(f"Preregistro propuesto: {opciones.salida} (sha256 {sha})")
            print("Pendientes: " + (", ".join(faltan) if faltan else "ninguno"))
        else:
            registro = correr(opciones.preregistro, opciones.hash_preregistro, opciones.csv, opciones.catalogo,
                              opciones.salida)
            print(resumen(registro))
            print(f"\nRegistro: {opciones.salida}")
    except Rechazo as e:
        sys.exit(f"Rechazado: {e}")


if __name__ == "__main__":
    main()
