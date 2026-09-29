"""Preregistro (P7): controles antes de leer la prueba final y registro de corridas, con datos sintéticos."""
import datetime
import json
import tempfile
from pathlib import Path

from solucion import preregistro as pr
from solucion.datos import construir
from solucion.pruebas.sintetico import CATALOGO, evento, eventos

FUENTE = {"csv_sha256": "sintetico", "catalogo_sha256": "sintetico-cat"}
AHORA = datetime.datetime(2026, 10, 1, 12, tzinfo=datetime.timezone.utc)


def _git_ok(path):
    return "commit-sintetico"


def _git_sucio(path):
    raise pr.Rechazo(f"{Path(path).name} tiene cambios sin commitear")


def _tabla():
    """Días 1–270: la cohorte son los VIN de primera inspección >260; dos VIN con Día >260 en la principal."""
    extra = [evento(f"TARDE{i}", 255, "AAA1", "CALIBRADA" if i == 0 else "OK", reparacion=263) for i in range(3)]
    return construir(eventos(dias=range(1, 271), por_dia=40) + extra, CATALOGO, fuente=dict(FUENTE),
                     desbloquear=True)


def _resultados(directorio, p5=True, p6=True):
    d = Path(directorio)
    (d / "eleccion.json").write_text(json.dumps({"ganadora": {
        "alternativa": "tasa fija (<= 149)", "familia": "tasa_fija", "parametros": {"hasta": 149, "peso": 0},
        "precision_cupo": 0.15, "lectura": "mejora"}}))
    if p5:
        (d / "p5.json").write_text(json.dumps({"configuracion": {
            "politica": {"nombre": "mínimo por código, P = 40", "tipo": "minimo", "parametros": {"P": 40}},
            "minimo_por_codigo": {"P": 40}}}))
    if p6:
        (d / "p6.json").write_text(json.dumps({"configuracion": {"componente": {"peso": 20},
                                                                  "detector": {"h": 4.2},
                                                                  "subcategorizacion": {"k": 3}}}))


def _preregistro(directorio, estado="acordado", **cambios):
    _resultados(directorio)
    p = pr.generar(directorio, fecha="2026-09-30")
    p.update(estado=estado, fuente=dict(FUENTE), **cambios)
    archivo = Path(directorio) / "preregistro.json"
    archivo.write_text(json.dumps(p, ensure_ascii=False, indent=2) + "\n")
    return archivo, pr.sha256(archivo)


def _rechaza(texto, *args, **kw):
    try:
        pr.correr(*args, **kw)
    except pr.Rechazo as e:
        assert texto in str(e), e
    else:
        raise AssertionError(f"correr debía rechazar: {texto}")


def test_generar_propone_con_todas_las_claves():
    with tempfile.TemporaryDirectory() as d:
        _resultados(d)
        p = pr.generar(d, fecha="2026-09-30")
        assert p["estado"] == "propuesto" and pr.pendientes(p) == [], pr.pendientes(p)
        for clave in ("fecha", "fuente", "version_codigo", "ganadora", "ganadora_en_prueba", "semillas", "piezas",
                      "tramos", "reglas_de_lectura", "ya_visto", "no_se_lee_en_prueba"):
            assert clave in p, clave
        assert p["ganadora_en_prueba"]["parametros"] == {"hasta": 194, "peso": 0}
        assert p["piezas"]["p5"]["politica"]["tipo"] == "minimo" and p["piezas"]["p5"]["minimo_por_codigo"] == {"P": 40}
        assert p["piezas"]["p6"]["detector"] == {"h": 4.2}
        assert [t["nombre"] for t in p["tramos"]] == ["prueba completa", "prueba ≤260", "prueba >260",
                                                     "sensibilidad con la cohorte posterior a 260"]
        assert p["tramos"][3]["vin_esperados"] == 18222
        assert pr.escribir(p, Path(d) / "a.json") == pr.escribir(p, Path(d) / "b.json")  # Determinista.


def test_generar_sin_p5_ni_p6_deja_pendientes():
    with tempfile.TemporaryDirectory() as d:
        _resultados(d, p5=False, p6=False)
        faltan = pr.pendientes(pr.generar(d))
        assert "preregistro.piezas.p5.politica" in faltan and "preregistro.piezas.p6.detector" in faltan, faltan


def test_para_prueba_reentrena_fijas_y_rechaza_no_elegibles():
    assert pr.para_prueba("tasa_fija", {"hasta": 149, "peso": 0})[0] == {"hasta": 194, "peso": 0}
    assert pr.para_prueba("movil", {"ventana": 60, "peso": 20})[0] == {"ventana": 60, "peso": 20}
    assert pr.para_prueba("xgboost", {"modo": "fijo", "hasta": 149})[0]["hasta"] == 194
    for familia in ("azar", "oraculo", "fuga"):
        try:
            pr.para_prueba(familia, {})
        except pr.Rechazo:
            continue
        raise AssertionError(familia)


def test_correr_rechaza_sin_acuerdo_hash_commit_o_pendientes():
    cargar = _tabla
    with tempfile.TemporaryDirectory() as d:
        salida = Path(d) / "prueba-final.json"
        archivo, sha = _preregistro(d, estado="propuesto")
        _rechaza("no \"acordado\"", archivo, sha, salida=salida, git=_git_ok, cargar=cargar)
        archivo, sha = _preregistro(d)
        _rechaza("hash", archivo, "0" * 64, salida=salida, git=_git_ok, cargar=cargar)
        _rechaza("sin commitear", archivo, sha, salida=salida, git=_git_sucio, cargar=cargar)
        archivo, sha = _preregistro(d, semillas={"desempate": 1, "bootstrap": 2, "remuestreos": 50,
                                                 "modelo": pr.PENDIENTE})
        _rechaza("preregistro.semillas.modelo", archivo, sha, salida=salida, git=_git_ok, cargar=cargar)
        archivo, sha = _preregistro(d)
        _rechaza("fuente", archivo, sha, salida=salida, git=_git_ok,
                 cargar=lambda: construir(eventos(dias=range(1, 21)), CATALOGO, fuente={"csv_sha256": "otra"},
                                          desbloquear=True))
        assert not salida.exists()


def test_correr_lee_la_prueba_y_agrega_corridas():
    with tempfile.TemporaryDirectory() as d:
        salida = Path(d) / "prueba-final.json"
        semillas = {"desempate": 20261002, "bootstrap": 20261003, "remuestreos": 200, "modelo": "no aplica"}
        archivo, sha = _preregistro(d, semillas=semillas)
        registro = pr.correr(archivo, sha, salida=salida, git=_git_ok, cargar=_tabla, ahora=AHORA)
        corrida = registro["corridas"][0]
        assert corrida["preregistro_sha256"] == sha and corrida["preregistro_commit"] == "commit-sintetico"
        assert corrida["ganadora"]["parametros"] == {"hasta": 194, "peso": 0}
        completa, hasta_260, despues, sensibilidad = corrida["tramos"]
        g = completa["ganadora"]
        assert completa["dias_del_vin"] == [200, 263] and g["dias"] == 62 and g["lectura"] == "mejora", g
        assert g["semillas"]["remuestreos"] == 200 and g["calibrada_tramo"] > 0  # Leyó etiquetas de la prueba.
        assert hasta_260["dias_del_vin"] == [200, 260] and despues["vins"] == 3
        assert sensibilidad["vins"] == completa["vins"] + 400, (sensibilidad["vins"], completa["vins"])
        assert corrida["piezas"]["e3"]["corrida"] is False and corrida["piezas"]["e3"]["motivo"]
        assert corrida["piezas"]["casi_no_se_calibran"]["corrida"] is True
        assert "SYN" not in salida.read_text() and "TARDE" not in salida.read_text()  # Sin identificadores.
        pr.correr(archivo, sha, salida=salida, git=_git_ok, cargar=_tabla, ahora=AHORA)
        registro = json.loads(salida.read_text())
        assert len(registro["corridas"]) == 2
        assert registro["corridas"][0]["tramos"] == registro["corridas"][1]["tramos"]
        assert "Hay 2 corridas" in pr.resumen(registro) and "de cada 100 elegidos" in pr.resumen(registro)


def test_escribir_no_pisa_un_preregistro_acordado():
    with tempfile.TemporaryDirectory() as d:
        archivo, _ = _preregistro(d)
        try:
            pr.escribir({"estado": "propuesto"}, archivo)
        except pr.Rechazo:
            return
        raise AssertionError("No debe sobrescribir un preregistro acordado")
