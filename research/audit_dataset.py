"""Audit the supplied Markdown export without exposing individual vehicle records."""
import collections
import hashlib
import json
from pathlib import Path
import re
import sys


def cells(line):
    return [re.sub(r"\\([\\|_])", r"\1", cell.strip())
            for cell in re.split(r"(?<!\\)\|", line.strip()[1:-1])]


def day(value):
    if value in {"", "NaN"}:
        return None
    match = re.fullmatch(r"DIA_(\d+)", value)
    assert match, f"Unexpected date format: {value!r}"
    return int(match[1])


def audit(path):
    missing = collections.Counter()
    labels = collections.Counter()
    days = {name: collections.defaultdict(collections.Counter)
            for name in ["Fecha Inspección", "Fecha Reparación"]}
    vins = {}
    digest = hashlib.sha256()
    table_rows = 0
    blank_or_non_table = 0
    exact_rows = set()
    duplicate_rows = 0
    with path.open("rb") as source:
        for raw in source:
            digest.update(raw)
            line = raw.decode("utf-8").strip()
            if not line.startswith("|"):
                blank_or_non_table += 1
                continue
            row = cells(line)
            table_rows += 1
            if table_rows == 1:
                descriptions = row
                continue
            if table_rows == 2:
                assert all(re.fullmatch(r":?-+:?", x) for x in row)
                continue
            if table_rows == 3:
                headers = row
                assert len(headers) == len(set(headers)) == len(descriptions) == 41
                assert headers[37:40] == ["Rep Respuesta a Pregunta Desensamblar", "Código de Catálogo", "Auditoría Adicional"]
                continue
            assert len(row) == len(headers), f"Wrong field count in table row {table_rows}"
            record = dict(zip(headers, row))
            assert record["VIN"] not in {"", "NaN"}
            label = record["Auditoría Adicional"]
            labels[label] += 1
            missing.update(key for key, value in record.items() if value in {"", "NaN"})
            row_hash = hashlib.sha256(line.encode()).digest()
            duplicate_rows += row_hash in exact_rows
            exact_rows.add(row_hash)
            vin = vins.setdefault(record["VIN"], {"labels": set(), "rows": 0, "dates": {}, "components": set()})
            vin["labels"].add(label)
            vin["rows"] += 1
            vin["components"].add(record["Componente Auditoría Adicional"])
            for field in days:
                value = day(record[field])
                days[field][value][label] += 1
                if value is not None:
                    old = vin["dates"].get(field, (value, value))
                    vin["dates"][field] = (min(old[0], value), max(old[1], value))
    rows = table_rows - 3
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
                           "latest_first_event_day_of_positive_vin": max(positive_starts), "min": min(present), "max": max(present), "days_present": len(present),
                           "missing_day_ids_in_range": sorted(set(range(min(present), max(present)+1)) - set(present)),
                           "last_positive_day": max(positive), "first_positive_day": min(positive),
                           "period_event_labels": periods, "vin_groups_at_260": dict(categories)}
    return {"source": str(path.resolve()), "sha256": digest.hexdigest(), "bytes": path.stat().st_size,
            "rows": rows, "columns": len(headers), "vins": len(vins), "event_labels": dict(labels),
            "vin_label_sets": dict(collections.Counter(" / ".join(sorted(v["labels"])) for v in vins.values())),
            "min_rows_per_vin": min(v["rows"] for v in vins.values()), "max_rows_per_vin": max(v["rows"] for v in vins.values()),
            "exact_duplicate_event_rows": duplicate_rows, "missing_by_column": {h: missing[h] for h in headers},
            "temporal": temporal, "description_mismatch_at_38_40": [list(x) for x in zip(range(38,41), descriptions[37:40], headers[37:40])],
            "component_missing_event_labels": {label: sum(v["rows"] for v in vins.values() if v["labels"] == {label} and v["components"] <= {"", "NaN"}) for label in labels},
            "vins_with_multiple_component_values": sum(len(v["components"]) > 1 for v in vins.values()),
            "non_table_lines": blank_or_non_table, "integrity_checks": "PASS: 41 unique headers; every row has 41 fields; all nonmissing dates match DIA_n; no missing VIN; row and VIN partitions reconcile."}


if __name__ == "__main__":
    assert cells(r"| VIN\_1 | A\|B | NaN |") == ["VIN_1", "A|B", "NaN"]
    assert day("DIA_260") == 260 and day("NaN") is None
    print(json.dumps(audit(Path(sys.argv[1])), ensure_ascii=False, indent=2))
