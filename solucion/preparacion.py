"""Evidencia de preparación de datos (P1), sin leer etiquetas de la prueba final."""
import collections
import json

from .cupo import cupo
from .datos import CUTOFF, PRUEBA_DESDE, RAIZ, TRAMOS

PARTICIONES = RAIZ / "research" / "validation-partitions.json"
TRAMOS_CON_ETIQUETA = {"entrenamiento_comparacion": "entrenamiento", "validacion": "validacion",
                       "entrenamiento_final": "entrenamiento_final"}
TRAMOS_SOLO_N = {"prueba_final": "prueba_final", "prueba_final_hasta_260": "prueba_final_hasta_260",
                 "prueba_final_despues_260": "prueba_final_despues_260"}


def _dias(vins):
    por_dia = collections.Counter(v.dia for v in vins)
    return {"dias_con_vin": len(por_dia), "suma_k_d": sum(cupo(n) for n in por_dia.values()),
            "vin_por_dia_mediana": sorted(por_dia.values())[len(por_dia) // 2] if por_dia else 0,
            "cupo_de_dias_con_menos_de_20_vin_pct": round(100 * sum(cupo(n) for n in por_dia.values() if n < 20)
                                                         / max(1, sum(cupo(n) for n in por_dia.values())), 1)}


def control_particiones(tabla, publicadas):
    """Compara con research/validation-partitions.json: N en todo tramo, CALIBRADA solo en <=194."""
    salida = {}
    for clave, tramo in {**TRAMOS_CON_ETIQUETA, **TRAMOS_SOLO_N}.items():
        vins = tabla.tramo(tramo)
        esperado = publicadas[clave]
        fila = {"vins": len(vins), "vins_publicados": esperado["vins"], "coincide_vins": len(vins) == esperado["vins"]}
        if clave in TRAMOS_CON_ETIQUETA:
            assert TRAMOS[tramo][1] is not None and TRAMOS[tramo][1] < PRUEBA_DESDE
            cal = sum(v.calibrada for v in vins)
            fila.update({"calibrada": cal, "calibrada_publicada": esperado["calibrada"],
                         "coincide_calibrada": cal == esperado["calibrada"]})
        salida[clave] = fila
    salida["cohorte_posterior_260"] = {"vins": len(tabla.cohorte),
                                       "vins_publicados": publicadas["cohorte_posterior_260"]["vins"],
                                       "coincide_vins": len(tabla.cohorte) == publicadas["cohorte_posterior_260"]["vins"]}
    salida["poblacion_principal"] = {"vins": len(tabla.vins),
                                     "vins_publicados": publicadas["poblacion_principal"]["vins"],
                                     "coincide_vins": len(tabla.vins) == publicadas["poblacion_principal"]["vins"]}
    return salida


def evidencia(tabla):
    publicadas = json.loads(PARTICIONES.read_text(encoding="utf-8"))["partitions"]
    control = control_particiones(tabla, publicadas)
    entrenamiento = {v.codigo for v in tabla.tramo("entrenamiento")}
    nuevos = {}
    for tramo in ("validacion", "prueba_final"):
        vins = tabla.tramo(tramo)
        codigos = {v.codigo for v in vins} - entrenamiento
        mercados_entrenamiento = {tabla.mercado(c) for c in entrenamiento}
        nuevos[tramo] = {"codigos_sin_historial_en_149": len(codigos),
                         "vins_de_esos_codigos": sum(v.codigo in codigos for v in vins),
                         "mercados_sin_historial_en_149": len({tabla.mercado(v.codigo) for v in vins}
                                                               - mercados_entrenamiento)}
    hasta_194 = tabla.tramo("entrenamiento_final")
    componente = collections.Counter((v.etiqueta, v.componente is not None) for v in hasta_194)
    return {
        "fuente": tabla.fuente, "unidad": "VIN",
        "poblacion": f"auditados con actividad QLS, primera Fecha Inspección <= DIA_{CUTOFF}, base ficticia",
        "eventos": {"filas": tabla.preparacion.get("filas"),
                    "duplicados_exactos_conservados": tabla.preparacion.get("duplicados_exactos"),
                    "na_en_fecha_reparacion": tabla.preparacion.get("na_fecha_reparacion"),
                    "descripciones_desalineadas_38_40": tabla.preparacion.get("descripciones_38_40"),
                    "nota": "Se usan los nombres técnicos (segundo registro), no las descripciones."},
        "control_particiones": control,
        "todo_coincide": all(all(v for k, v in fila.items() if k.startswith("coincide")) for fila in control.values()),
        "cupo_diario": {"validacion": _dias(tabla.tramo("validacion")),
                        "prueba_final_sin_etiquetas": _dias(tabla.tramo("prueba_final")),
                        "despues_260_sin_etiquetas": _dias(tabla.tramo("prueba_final_despues_260"))},
        "codigos_nuevos": nuevos,
        "componente_como_fuga_hasta_194": {
            "calibrada_con_componente": componente[("CALIBRADA", True)],
            "calibrada_sin_componente": componente[("CALIBRADA", False)],
            "ok_con_componente": componente[("OK", True)], "ok_sin_componente": componente[("OK", False)],
            "lectura": "El componente solo existe cuando el resultado es CALIBRADA: usarlo como predictor es fuga."},
        "cohorte_posterior_260": {"vins": len(tabla.cohorte),
                                  "nota": "Todos OK según research/audit-csv.json; aquí no se leen sus etiquetas."},
        "etiquetas_prueba_final": "enmascaradas" if not tabla.desbloqueada else "desbloqueadas",
    }
