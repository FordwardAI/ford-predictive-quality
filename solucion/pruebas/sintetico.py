"""Datos sintéticos para las pruebas: nunca se usan registros reales como fixtures."""
import random

from solucion.datos import construir

CATALOGO = {  # Cuatro códigos, dos mercados.
    "AAA1": {"mercado": "LOCATION_1", "motor": "M1", "motor_dominante": "M1 A", "traccion": "4X2",
             "traccion_dominante": "VERSION_1", "mercado_dominante": "VERSION_1"},
    "AAB1": {"mercado": "LOCATION_1", "motor": "M1", "motor_dominante": "M1 A", "traccion": "4X4",
             "traccion_dominante": "VERSION_2", "mercado_dominante": "VERSION_2"},
    "ABA1": {"mercado": "LOCATION_2", "motor": "M2", "motor_dominante": "M2 A", "traccion": "4X2",
             "traccion_dominante": "VERSION_1", "mercado_dominante": "VERSION_1"},
    "ABB1": {"mercado": "LOCATION_2", "motor": "M2", "motor_dominante": "M2 A", "traccion": "4X4",
             "traccion_dominante": "VERSION_2", "mercado_dominante": "VERSION_2"},
}
TASAS = {"AAA1": 0.30, "AAB1": 0.15, "ABA1": 0.08, "ABB1": 0.02}


def evento(vin, dia, codigo, etiqueta, componente="", reparacion=None, incidencia="FALLA"):
    return {"VIN": vin, "Fecha Inspección": f"DIA_{dia}", "Fecha Reparación": f"DIA_{reparacion or dia}",
            "Hora Inspección": "0,25", "Hora Reparación": "0,5", "Código de Catálogo": codigo,
            "Auditoría Adicional": etiqueta, "Componente Auditoría Adicional": componente,
            "UC Nombre Incidencia": incidencia}


def eventos(dias=range(1, 261), por_dia=40, semilla=7, tasas=TASAS):
    rng = random.Random(semilla)
    codigos = list(tasas)
    salida = []
    for dia in dias:
        for i in range(por_dia):
            codigo = codigos[i % len(codigos)]
            cal = rng.random() < tasas[codigo]
            componente = rng.choice(["FRENOS", "DIRECCION", "SUSPENSION"]) if cal else ""
            vin = f"SYN{dia:03d}{i:03d}"
            salida.append(evento(vin, dia, codigo, "CALIBRADA" if cal else "OK", componente,
                                 incidencia=rng.choice(["FALLA", "RUIDO", "ENSAMBLE"])))
            if i % 5 == 0:  # Algunos VIN con dos eventos.
                salida.append(evento(vin, dia, codigo, "CALIBRADA" if cal else "OK", componente, incidencia="RUIDO"))
    return salida


def tabla(desbloquear=False, **kw):
    return construir(eventos(**kw), CATALOGO, fuente={"csv_sha256": "sintetico"}, desbloquear=desbloquear)
