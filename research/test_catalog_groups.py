"""Synthetic regression check for the catalog grouping reader; no supplied files required."""
from catalog_groups import analyse, grouping


def row(motor, traccion, mercado):
    """One CSV row holding one (group, code, dominant) triplet per side-by-side table."""
    return [*motor, "", *traccion, "", "", *mercado]


def event(vin, code, label="OK", inspection="DIA_100"):
    return {"VIN": vin, "Código de Catálogo": code + " ", "Fecha Inspección": inspection,
            "Fecha Reparación": "#N/A", "Auditoría Adicional": label}


def test_grouping():
    rows = [["title"], [], ["headers"],
            row(("LION", "AXB5", "LION B"), ("4X2", "AYD5", "V1"), ("L1", "AXB5", "V2")),
            row(("PANTHER", "AYD5", "PANTHER J"), ("4X4", "AXB5", "V2"), ("L2", "AYD5", "V1"))]
    attributes = grouping(rows)  # Tables are matched by code, not by row.
    assert attributes["AXB5"] == {"motor": "LION", "motor_dominante": "LION B", "traccion": "4X4",
                                  "traccion_dominante": "V2", "mercado": "L1", "mercado_dominante": "V2"}
    result = analyse(attributes, [event("a", "AXB5", "CALIBRADA"), event("a", "AXB5", "CALIBRADA"),
                                  event("b", "AYD5"), event("c", "AYD5", inspection="DIA_261")])
    assert result["cobertura"]["vin_con_mas_de_un_codigo"] == 0
    assert result["cobertura"]["codigos_base_sin_agrupacion"] == []
    assert result["cobertura"]["atributos_determinados_por_posicion"]["3"] == [
        "motor_dominante", "traccion", "traccion_dominante", "mercado"]  # B/D differ in every attribute.
    assert result["cobertura"]["atributos_determinados_por_posicion"]["1"] == []
    mercado = result["poblacion_principal"]["mercado"]["tasas"]  # VIN c is the post-260 cohort.
    assert mercado == {"L1": {"vins": 1, "calibrada": 1, "calibrada_pct": 100.0},
                       "L2": {"vins": 1, "calibrada": 0, "calibrada_pct": 0.0}}
    assert "tasas" not in result["poblacion_principal"]["codigo"]
    assert result["entrenamiento_comparacion"]["traccion"]["tasas"]["4X4"]["vins"] == 1


if __name__ == "__main__":
    test_grouping()
    print("PASS")
