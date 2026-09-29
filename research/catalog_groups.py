"""Aggregate CALIBRADA by the catalog code grouping received on 29/09 without exposing VIN records."""
import argparse
import collections
import csv
import json
from pathlib import Path

from audit_dataset import fingerprint
from validation_partitions import CUTOFF, records, vin_days

# Column triplets (group, code, dominant attribute) of the three side-by-side tables in the grouping file.
TABLES = {"motor": (0, 1, 2), "traccion": (4, 5, 6), "mercado": (9, 10, 11)}
PARTITIONS = {"entrenamiento_comparacion": (None, 149), "validacion": (155, 194), "prueba_final": (200, None)}


def grouping(rows):
    """Map each catalog code to its attributes. Rows 1–3 are title, blank and headers; tables do not share rows."""
    attributes = collections.defaultdict(dict)
    for row in rows[3:]:
        for name, (group, code, dominant) in TABLES.items():
            if len(row) <= dominant or not row[code].strip():
                continue
            code_value = row[code].strip()
            assert name not in attributes[code_value], f"Duplicate code {code_value} in {name}"
            attributes[code_value][name] = row[group].strip()
            attributes[code_value][f"{name}_dominante"] = row[dominant].strip()
    return dict(attributes)


def dimensions(attributes):
    """Views compared; versión is dominant per traction and market tables, which must agree."""
    for code, a in attributes.items():
        assert a["traccion_dominante"] == a["mercado_dominante"], f"Version mismatch for {code}"
    return {
        "codigo": lambda c: c,
        "familia_motor": lambda c: attributes[c]["motor"],
        "motor_dominante": lambda c: attributes[c]["motor_dominante"],
        "traccion": lambda c: attributes[c]["traccion"],
        "version_dominante": lambda c: attributes[c]["traccion_dominante"],
        "mercado": lambda c: attributes[c]["mercado"],
        "combinacion": lambda c: " / ".join(attributes[c][k] for k in
                                            ("motor_dominante", "traccion", "traccion_dominante", "mercado")),
    }


def positions(attributes):
    """Attributes fully determined by the character at each code position (1-based)."""
    names = ("motor_dominante", "traccion", "traccion_dominante", "mercado")
    width = min(len(c) for c in attributes)
    return {str(i + 1): [n for n in names
                         if all(len(v) == 1 for v in _values(attributes, i, n).values())] for i in range(width)}


def _values(attributes, i, name):
    values = collections.defaultdict(set)
    for code, a in attributes.items():
        values[code[i]].add(a[name])
    return values


def chi_square(groups):
    n = sum(a for a, _ in groups.values())
    p = sum(b for _, b in groups.values()) / n if n else 0
    if p in (0, 1):
        return None
    return sum((b - a * p) ** 2 / (a * p) + (a - b - a * (1 - p)) ** 2 / (a * (1 - p)) for a, b in groups.values())


def rates(vins, key):
    groups = collections.defaultdict(lambda: [0, 0])
    for code, label in vins:
        groups[key(code)][0] += 1
        groups[key(code)][1] += label == "CALIBRADA"
    return {"grupos": len(groups), "chi2": None if (x := chi_square(groups)) is None else round(x, 1),
            "tasas": {k: {"vins": a, "calibrada": b, "calibrada_pct": round(100 * b / a, 2)}
                      for k, (a, b) in sorted(groups.items(), key=lambda kv: (-kv[1][1] / kv[1][0], kv[0]))}}


def analyse(attributes, events):
    events = list(events)
    codes = collections.defaultdict(set)
    for record in events:
        codes[record["VIN"]].add(record["Código de Catálogo"].strip())
    vins = vin_days(events)
    main = [(next(iter(codes[v])), label, d) for v, (first, d, label) in vins.items()
            if first is not None and first <= CUTOFF]
    data_codes = collections.Counter(c for c, *_ in main)
    views = dimensions(attributes)
    result = {"cobertura": {"codigos_agrupacion": len(attributes), "codigos_base": len(set().union(*codes.values())),
                            "vin_con_mas_de_un_codigo": sum(len(s) > 1 for s in codes.values()),
                            "codigos_base_sin_agrupacion": sorted(set().union(*codes.values()) - set(attributes)),
                            "codigos_agrupacion_sin_vin": sorted(set(attributes) - set(data_codes)),
                            "combinaciones_distintas": len({views["combinacion"](c) for c in attributes}),
                            "atributos_determinados_por_posicion": positions(attributes)},
              "poblacion_principal": {k: rates([(c, l) for c, l, _ in main], f) for k, f in views.items()}}
    # Per-code rates stay out of the published output; only the test statistic is kept.
    result["poblacion_principal"]["codigo"] = {k: v for k, v in result["poblacion_principal"]["codigo"].items()
                                               if k != "tasas"}
    for name, (lo, hi) in PARTITIONS.items():
        subset = [(c, l) for c, l, d in main if (lo is None or d >= lo) and (hi is None or d <= hi)]
        result[name] = {k: rates(subset, f) for k, f in views.items() if k != "codigo"}
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Dataset QLS CSV")
    parser.add_argument("grouping", type=Path, help="Códigos de catálogo CSV")
    args = parser.parse_args()
    with args.grouping.open(encoding="utf-8-sig", newline="") as source:
        attributes = grouping(list(csv.reader(source, strict=True)))
    output = {"source": args.source.name, "sha256": fingerprint(args.source),
              "grouping": args.grouping.name, "grouping_sha256": fingerprint(args.grouping), "unit": "VIN",
              "definitions": {"poblacion_principal": f"primera Fecha Inspección <= DIA_{CUTOFF}",
                              "particiones": {k: list(v) for k, v in PARTITIONS.items()},
                              "dia_del_vin": "max(Fecha Inspección, Fecha Reparación)"},
              **analyse(attributes, records(args.source))}
    print(json.dumps(output, ensure_ascii=False, indent=2))
