"""El anexo conserva todos los candidatos y ordena por selección, no por el resultado posterior."""
from research.documentar_busqueda import COMPARADOS, anexo


def test_anexo_no_elige_por_comprobacion_y_conserva_pipelines():
    def resultado(nombre, a, b):
        def m(n):
            return {"calibrada_elegidas": n, "elegidos": 10, "precision_cupo": n / 10,
                    "veces_azar": n / 2, "recupero": n / 20, "vins": 200, "calibrada_tramo": 20, "dias": 5}
        return {"componentes": [nombre], "seleccion": m(a), "confirmacion": m(b)}

    nombres = [n for _, n in COMPARADOS if n]
    filas = [resultado(n, 2 if i else 1, 1 if i else 9) for i, n in enumerate(nombres)]
    b = {"fuente": {"csv_sha256": "sintetico", "catalogo_sha256": "sintetico"}, "version_codigo": "prueba",
         "todos_los_individuales": filas, "top_seleccion": [filas[1]], "candidatos_evaluados": len(filas),
         "protocolo": {"columnas_evaluadas": ["CAMPO_SINTETICO"], "pool": nombres},
         "cobertura_por_metodo_y_tamano": [{"metodo": "individual", "componentes": 1,
                                          "evaluados": len(filas), "mejor": filas[1]}]}
    r = {"top_seleccion": [filas[1]], "version_codigo": "prueba", "candidatos_evaluados": len(filas)}
    s = {"version_codigo": "prueba", "resultados": [
        {t: {n: {"calibrada_elegidas": 2, "elegidos": 10} for n in ("rf_atributos", "mezcla", "conjunto_catboost", "jerarquico", "stacking")}
         for t in ("seleccion", "confirmacion")} for _ in range(5)]}
    texto = anexo(b, r, s)
    tabla = texto.split("## Todos los pipelines individuales", 1)[1].split("## Evidencia detallada", 1)[0]
    assert sum(linea.startswith("| ") for linea in tabla.splitlines()) == len(filas) + 2
    assert tabla.index("jerarquico_60_20") < tabla.index("tasa_fija")
    assert "1/10 · 10,00 %" in tabla and "9/10 · 90,00 %" in tabla
    assert "ml_rf_atributos\\|fijo" in tabla and "CAMPO_SINTETICO" in texto
    assert "200 VIN, 20 CALIBRADA, 10 elegidos" in texto and "2,0/10 (20,00 %)" in texto
