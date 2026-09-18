"""Audit the supplied CSV (or historical Markdown) without exposing VIN records."""
import argparse
import collections
import csv
from decimal import Decimal
import hashlib
import itertools
import json
from pathlib import Path
import re

MISSING = {"", "NaN", "#N/A"}


def cells(line):
    return [re.sub(r"\\([\\|_])", r"\1", cell.strip())
            for cell in re.split(r"(?<!\\)\|", line.strip()[1:-1])]


def day(value):
    if value.strip() in MISSING:
        return None
    match = re.fullmatch(r"DIA_(\d+)", value)
    assert match, f"Unexpected date format: {value!r}"
    return int(match[1])


def table(path):
    """Yield descriptions, technical headers, then records; retain CSV precision."""
    with path.open(encoding="utf-8-sig", newline="") as source:
        if path.suffix.lower() == ".csv":
            yield from csv.reader(source, strict=True)
        elif path.suffix.lower() == ".md":
            rows = (cells(line) for line in source if line.startswith("|"))
            yield next(rows)
            assert all(re.fullmatch(r":?-+:?", x) for x in next(rows))
            yield from rows
        else:
            raise ValueError("Expected .csv or historical .md input")


def fingerprint(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def compare(csv_path, markdown_path):
    """Compare every cell in row order; explain export differences, never rewrite data."""
    left, right = table(csv_path), table(markdown_path)
    descriptions = next(left), next(right)
    headers = next(left)
    assert headers == next(right), "Technical headers differ"
    differences = collections.defaultdict(collections.Counter)
    max_hour_delta = Decimal(0)
    rows = 0
    for a, b in itertools.zip_longest(left, right):
        assert a is not None and b is not None, "Row counts differ"
        assert len(a) == len(b) == len(headers), "Field counts differ"
        rows += 1
        for name, x, y in zip(headers, a, b):
            if x == y:
                continue
            if x.strip() in MISSING and y.strip() in MISSING:
                kind = "missing_representation"
            elif x.replace("\u00a0", " ").strip() == y.replace("\u00a0", " ").strip():
                kind = "whitespace"
            elif name in {"Hora Inspección", "Hora Reparación"}:
                value = Decimal(x.replace(",", "."))
                delta = abs(value - Decimal(y))
                max_hour_delta = max(max_hour_delta, delta)
                kind = "compatible_with_6_decimal_place_rounding" if delta <= Decimal("0.0000005") else "unexplained"
            else:
                kind = "unexplained"
            differences[name][kind] += 1
    return {"compared_rows": rows, "technical_headers_equal": True,
            "reference_sha256": fingerprint(markdown_path),
            "description_differences_at_positions": [i for i, (a, b) in enumerate(zip(*descriptions), 1) if a != b],
            "different_cells_by_column": dict(differences),
            "max_absolute_hour_difference": str(max_hour_delta),
            "unexplained_cells": sum(c["unexplained"] for c in differences.values())}


def audit(path):
    missing = collections.Counter()
    labels = collections.Counter()
    days = {name: collections.defaultdict(collections.Counter)
            for name in ["Fecha Inspección", "Fecha Reparación"]}
    vins = {}
    exact_rows = set()
    duplicate_rows = 0
    source = table(path)
    descriptions, headers = next(source), next(source)
    assert len(headers) == len(set(headers)) == len(descriptions) == 41
    assert headers[37:40] == ["Rep Respuesta a Pregunta Desensamblar", "Código de Catálogo", "Auditoría Adicional"]
    assert {"VIN", "Fecha Inspección", "Fecha Reparación", "Componente Auditoría Adicional"} <= set(headers)
    rows = 0
    component_missing = collections.Counter()
    for rows, row in enumerate(source, 1):
        assert len(row) == len(headers), f"Wrong field count in data row {rows}"
        record = dict(zip(headers, row))
        assert record["VIN"].strip() not in MISSING, f"Missing VIN in data row {rows}"
        label = record["Auditoría Adicional"]
        labels[label] += 1
        missing.update(key for key, value in record.items() if value.strip() in MISSING)
        row_hash = hashlib.sha256(json.dumps(row, ensure_ascii=False).encode()).digest()
        duplicate_rows += row_hash in exact_rows
        exact_rows.add(row_hash)
        vin = vins.setdefault(record["VIN"], {"labels": set(), "rows": 0, "dates": {}, "components": set()})
        vin["labels"].add(label)
        vin["rows"] += 1
        vin["components"].add(record["Componente Auditoría Adicional"])
        if record["Componente Auditoría Adicional"].strip() in MISSING:
            component_missing[label] += 1
        for field in days:
            value = day(record[field])
            days[field][value][label] += 1
            if value is not None:
                old = vin["dates"].get(field, (value, value))
                vin["dates"][field] = (min(old[0], value), max(old[1], value))
    assert rows > 0, "No data rows"
    assert rows == sum(labels.values()) == sum(v["rows"] for v in vins.values())
    assert all(sum(sum(x.values()) for x in series.values()) == rows for series in days.values())
    temporal = {}
    for field, series in days.items():
        present = sorted(d for d in series if d is not None)
        periods = {}
        for name, predicate in [("antes_260", lambda d: d < 260), ("dia_260", lambda d: d == 260), ("despues_260", lambda d: d > 260)]:
            total = collections.Counter()
            for d, count in series.items():
                if d is not None and predicate(d):
                    total.update(count)
            periods[name] = dict(total)
        positive = [d for d in present if series[d]["CALIBRADA"]]
        categories = collections.defaultdict(collections.Counter)
        for vin in vins.values():
            bounds = vin["dates"].get(field)
            category = "sin_fecha" if bounds is None else "solo_hasta_260" if bounds[1] <= 260 else "solo_despues_260" if bounds[0] > 260 else "cruza_260"
            categories[category][" / ".join(sorted(vin["labels"]))] += 1
        assert sum(sum(x.values()) for x in categories.values()) == len(vins)
        first_date_cohorts = collections.defaultdict(collections.Counter)
        positive_starts = []
        for vin in vins.values():
            bounds = vin["dates"].get(field)
            category = "sin_fecha" if bounds is None else "antes_260" if bounds[0] < 260 else "dia_260" if bounds[0] == 260 else "despues_260"
            first_date_cohorts[category][" / ".join(sorted(vin["labels"]))] += 1
            if bounds is not None and vin["labels"] == {"CALIBRADA"}:
                positive_starts.append(bounds[0])
        temporal[field] = {"first_date_vin_cohorts": dict(first_date_cohorts),
                           "latest_first_event_day_of_positive_vin": max(positive_starts, default=None), "min": min(present, default=None), "max": max(present, default=None), "days_present": len(present),
                           "missing_day_ids_in_range": sorted(set(range(min(present), max(present)+1)) - set(present)) if present else [],
                           "last_positive_day": max(positive, default=None), "first_positive_day": min(positive, default=None),
                           "period_event_labels": periods, "vin_groups_at_260": dict(categories)}
    return {"source": path.name, "format": path.suffix.lower().lstrip("."), "sha256": fingerprint(path), "bytes": path.stat().st_size,
            "rows": rows, "columns": len(headers), "vins": len(vins), "event_labels": dict(labels),
            "vin_label_sets": dict(collections.Counter(" / ".join(sorted(v["labels"])) for v in vins.values())),
            "min_rows_per_vin": min(v["rows"] for v in vins.values()), "max_rows_per_vin": max(v["rows"] for v in vins.values()),
            "exact_duplicate_event_rows": duplicate_rows, "missing_by_column": {h: missing[h] for h in headers},
            "temporal": temporal, "description_mismatch_at_38_40": [list(x) for x in zip(range(38,41), descriptions[37:40], headers[37:40])],
            "component_missing_event_labels": {label: component_missing[label] for label in labels},
            "vins_with_multiple_component_values": sum(len(v["components"]) > 1 for v in vins.values()),
            "integrity_checks": "PASS: 41 unique headers; every row has 41 fields; all nonmissing dates match DIA_n; no missing VIN; row and VIN partitions reconcile."}


if __name__ == "__main__":
    assert cells(r"| VIN\_1 | A\|B | NaN |") == ["VIN_1", "A|B", "NaN"]
    assert day("DIA_260") == 260 and day("NaN") is None
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--compare-markdown", type=Path)
    args = parser.parse_args()
    result = audit(args.source)
    if args.compare_markdown:
        result["markdown_comparison"] = compare(args.source, args.compare_markdown)
    print(json.dumps(result, ensure_ascii=False, indent=2))
