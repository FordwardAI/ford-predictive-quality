"""Aggregate VIN counts for the agreed temporal validation (#7) without exposing VIN records."""
import argparse
import json
from pathlib import Path

from audit_dataset import day, fingerprint, table

CUTOFF = 260  # Population filter: first inspection after this day is the sensitivity cohort (#6).
PARTITIONS = {  # Día del VIN ranges, inclusive; 5-day margins at 150–154 and 195–199.
    "entrenamiento_comparacion": (None, 149),
    "validacion": (155, 194),
    "entrenamiento_final": (None, 194),
    "prueba_final": (200, None),
}


def vin_days(rows):
    """Map each VIN to (first inspection day, Día del VIN, label).

    Día del VIN is the latest inspection or repair day, a proxy for the audit day.
    """
    vins = {}
    for record in rows:
        dates = [d for d in (day(record["Fecha Inspección"]), day(record["Fecha Reparación"])) if d is not None]
        first, last, label = vins.get(record["VIN"], (None, None, record["Auditoría Adicional"]))
        inspection = day(record["Fecha Inspección"])
        if inspection is not None:
            first = inspection if first is None else min(first, inspection)
        if dates:
            last = max(dates) if last is None else max(last, *dates)
        vins[record["VIN"]] = (first, last, label)
    return vins


def summary(group):
    n = len(group)
    positives = sum(label == "CALIBRADA" for label in group)
    return {"vins": n, "calibrada": positives, "calibrada_pct": round(100 * positives / n, 2) if n else None,
            "k_5pct": max(1, int(0.05 * n)) if n else 0}


def partitions(vins):
    main = {v: x for v, x in vins.items() if x[0] is not None and x[0] <= CUTOFF}
    cohort = {v: x for v, x in vins.items() if v not in main}

    def select(population, lo, hi):
        return [label for _, d, label in population.values() if (lo is None or d >= lo) and (hi is None or d <= hi)]

    result = {name: summary(select(main, lo, hi)) for name, (lo, hi) in PARTITIONS.items()}
    result["prueba_final_hasta_260"] = summary(select(main, 200, CUTOFF))
    result["prueba_final_despues_260"] = summary(select(main, CUTOFF + 1, None))
    result["cohorte_posterior_260"] = summary([label for *_, label in cohort.values()])
    result["sensibilidad_prueba_con_cohorte"] = summary(select(main, 200, None) + [label for *_, label in cohort.values()])
    result["poblacion_principal"] = summary([label for *_, label in main.values()])
    return result


def records(path):
    source = table(path)
    next(source)
    headers = next(source)
    for row in source:
        yield dict(zip(headers, row))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    output = {"source": args.source.name, "sha256": fingerprint(args.source), "unit": "VIN",
              "definitions": {"dia_del_vin": "max(Fecha Inspección, Fecha Reparación)",
                              "poblacion_principal": f"primera Fecha Inspección <= DIA_{CUTOFF}",
                              "particiones": {k: list(v) for k, v in PARTITIONS.items()},
                              "k": "max(1, floor(0.05 * N))"},
              "partitions": partitions(vin_days(records(args.source)))}
    print(json.dumps(output, ensure_ascii=False, indent=2))
