# Prueba de concepto: reproducción

Código del [plan de acción](../docs/plan-de-accion.md), seguido en [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33). Todo se evalúa en **validación (Día del VIN 155–194)**. Las etiquetas de Día ≥200 quedan enmascaradas al cargar y solo se desbloquean con el preregistro acordado (`solucion/preregistro.py`).

## Entorno

Python 3.13 (ver `.python-version`). Desde la raíz del repo:

```sh
brew install libomp              # solo macOS: lo necesitan xgboost y lightgbm
python3.13 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Comando único

Los datos quedan fuera del repo y se pasan por argumento. El código verifica sus SHA-256 ([datos locales](../docs/datos-locales.md)).

```sh
.venv/bin/python -m solucion.run \
  --csv "/ruta/a/Dataset QLS Inspección Adicional.csv" \
  --catalogo "/ruta/a/Códigos de catálogo.csv"
```

- `--piezas preparacion,p3,p4,eleccion,p6,p5,p8,p9` corre un subconjunto, en ese orden de dependencias.
- `--cache` (por defecto `~/.cache/ford-predictive-quality`) guarda la tabla por VIN ya enmascarada, fuera del repo.
- `--salida` (por defecto `~/.cache/ford-predictive-quality/salida`) recibe la hoja de códigos prioritarios, que tiene tasas por código y no se versiona.

Cada pieza escribe `solucion/resultados/<pieza>.json`: solo agregados por alternativa y por día, sin VIN ni tasas por código.

## Pruebas

```sh
.venv/bin/python -m solucion.pruebas   # sintéticas: no necesitan el CSV
python3 research/test_audit_dataset.py
```

## Módulos

| Módulo | Pieza | Qué hace |
| --- | --- | --- |
| `datos.py` | P1 | Tabla por VIN con las etiquetas de la prueba final enmascaradas |
| `puntaje.py` | P1 | Protocolo de puntaje: única vía a las etiquetas, con Día ≤ t−5 |
| `cupo.py` | P1 | Cupo diario, desempate con semilla, bootstrap por días y regla de elección |
| `preparacion.py` | P1 | Evidencia de preparación y control contra `research/validation-partitions.json` |
| `referencias.py` | P3 | Azar, tasa fija, móviles, mercado, decaimiento, oráculo y fuga |
| `eleccion.py` | P3/P4 | Ganadora en validación |
| `run.py` | P2 | Comando único |
