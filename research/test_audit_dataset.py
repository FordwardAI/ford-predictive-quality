"""Synthetic regression check; no supplied dataset required."""
import csv
from pathlib import Path
from tempfile import TemporaryDirectory

from audit_dataset import audit, compare, table


def test_csv():
    headers = [f"field_{i}" for i in range(41)]
    for i, name in {0: "VIN", 2: "Hora Inspección", 3: "Fecha Inspección",
                    22: "Fecha Reparación", 23: "Hora Reparación",
                    37: "Rep Respuesta a Pregunta Desensamblar",
                    38: "Código de Catálogo", 39: "Auditoría Adicional",
                    40: "Componente Auditoría Adicional"}.items():
        headers[i] = name
    row = [""] * 41
    row[0], row[1], row[2], row[3] = "synthetic", 'comma, quote " and\nnewline', "0,2439814815", "DIA_261"
    row[22], row[23], row[39] = "#N/A", "0,2535185185", "OK"
    with TemporaryDirectory() as directory:
        path = Path(directory) / "sample.csv"

        def write(rows):
            with path.open("w", encoding="utf-8-sig", newline="") as output:
                csv.writer(output).writerows([headers, headers, *rows])

        write([row, row])
        assert list(table(path))[2] == row  # CSV quoting and decimal text survive.
        result = audit(path)
        assert (result["rows"], result["vins"], result["exact_duplicate_event_rows"]) == (2, 1, 1)
        assert result["missing_by_column"]["Fecha Reparación"] == 2
        assert result["component_missing_event_labels"] == {"OK": 2}
        assert result["temporal"]["Fecha Reparación"]["min"] is None
        assert result["temporal"]["Fecha Inspección"]["first_date_vin_cohorts"] == {"despues_260": {"OK": 1}}

        # Compare nulls, decimal precision and spaces without changing CSV values.
        row[1] = "text "
        write([row])
        old = ["NaN" if x in {"", "#N/A"} else x for x in row]
        old[1], old[2], old[23] = "text", "0.243981", "0.253519"
        markdown = Path(directory) / "sample.md"
        markdown.write_text("\n".join("| " + " | ".join(r) + " |" for r in [headers, ["---"] * 41, headers, old]), encoding="utf-8", newline="\n")
        assert compare(path, markdown)["unexplained_cells"] == 0
        row[2] = "0,243982"
        write([row])
        assert compare(path, markdown)["unexplained_cells"] == 1
        row[2] = "0,2439815"  # Exact midpoint remains compatible with rounding.
        write([row])
        assert compare(path, markdown)["unexplained_cells"] == 0
        row[3] = "DIA_262"
        write([row])
        assert compare(path, markdown)["unexplained_cells"] == 1

        for invalid in [row[:-1], ["NaN", *row[1:]], [*row[:3], "bad-date", *row[4:]]]:
            write([invalid])
            try:
                audit(path)
            except AssertionError:
                pass
            else:
                raise AssertionError("Malformed input accepted")


if __name__ == "__main__":
    test_csv()
    print("CSV audit regression check passed")
