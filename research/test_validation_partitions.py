"""Synthetic regression check for the validation partitions; no supplied dataset required."""
from validation_partitions import partitions, vin_days


def event(vin, inspection, repair="#N/A", label="OK"):
    return {"VIN": vin, "Fecha Inspección": inspection, "Fecha Reparación": repair, "Auditoría Adicional": label}


def test_partitions():
    vins = vin_days([
        event("a", "DIA_140", "DIA_152"),        # Repair moves Día del VIN into the margin.
        event("b", "DIA_150", label="CALIBRADA"),
        event("b", "DIA_160", label="CALIBRADA"),  # Latest event places it in validation.
        event("c", "DIA_199"),                    # Final margin: neither training nor test.
        event("d", "DIA_258", "DIA_263"),         # Main population, test after 260.
        event("e", "DIA_261"),                    # First inspection after 260: cohort.
    ])
    assert vins["a"] == (140, 152, "OK") and vins["b"] == (150, 160, "CALIBRADA")
    result = partitions(vins)
    assert result["entrenamiento_comparacion"]["vins"] == 0
    assert result["validacion"] == {"vins": 1, "calibrada": 1, "calibrada_pct": 100.0, "k_5pct": 1}
    assert result["entrenamiento_final"]["vins"] == 2
    assert result["prueba_final"]["vins"] == result["prueba_final_despues_260"]["vins"] == 1
    assert result["prueba_final_hasta_260"] == {"vins": 0, "calibrada": 0, "calibrada_pct": None, "k_5pct": 0}
    assert result["cohorte_posterior_260"]["vins"] == 1
    assert result["sensibilidad_prueba_con_cohorte"]["vins"] == 2
    assert result["poblacion_principal"]["vins"] == 4


if __name__ == "__main__":
    test_partitions()
    print("PASS")
