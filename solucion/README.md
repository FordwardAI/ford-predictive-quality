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
- `--piezas precision` corre la elección por mayor precisión en origen móvil (opcional, unos 30 minutos; no entra en el
  comando por defecto). Escribe `solucion/resultados/precision.json` y usa solo Día < 195.
- `--piezas ensemble` compara CatBoost con atributos y la tasa móvil suavizada hacia mercado, solos y mezclados
  (pesos 25/50/75 %, ventanas 30/60/120 días). Elige en 100–174 y comprueba en 175–194, ya visto: exploratorio.
  Escribe `solucion/resultados/ensemble.json`; no modifica el preregistro ni lee la prueba final.
- `--piezas busqueda` amplía los individuales, columnas y datos sintéticos de entrenamiento; prueba parejas,
  conjuntos de familias, pesos discretos/continuos, mediana, rangos y stacking temporal. Usa Día <195 y
  predicciones previas de 70–94 para arrancar el meta-modelo. Guarda predicciones solo en la caché externa y
  publica agregados en `solucion/resultados/busqueda.json`. Es exploratorio y no modifica el preregistro.
- `--cache` (por defecto `~/.cache/ford-predictive-quality`) guarda la tabla por VIN ya enmascarada, fuera del repo.
- `--salida` (por defecto `~/.cache/ford-predictive-quality/salida`) recibe la hoja de códigos prioritarios, que tiene tasas por código y no se versiona.

Cada pieza escribe `solucion/resultados/<pieza>.json`: solo agregados por alternativa y por día, sin VIN ni tasas por código.

## Segunda lectura de la prueba final (propuesta)

La prueba final ya se leyó una vez (30/09) con la tasa fija. Si el equipo quiere leerla con la ganadora por precisión,
es una **segunda lectura**, más débil que la primera: se acuerda un preregistro nuevo y se informan las dos.

```sh
# 1. Propuesta (no lee la prueba: tabla enmascarada). Genera solucion/preregistro-precision.json.
.venv/bin/python -m solucion.preregistro generar-segunda --csv "<CSV>" --catalogo "<catálogo>"
# 2. En equipo: cambiar "estado" a "acordado", commitear e integrar a main.
# 3. Una sola corrida, en sesión conjunta:
.venv/bin/python -m solucion.preregistro correr --preregistro solucion/preregistro-precision.json \
  --hash-preregistro "$(shasum -a 256 solucion/preregistro-precision.json | cut -d' ' -f1)" \
  --csv "<CSV>" --catalogo "<catálogo>"
```

Lee solo el predictor (P5, P6 y la E3 ya se leyeron) y agrega la corrida 2 a `solucion/resultados/prueba-final.json`.

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
| `precision.py` | propuesta 30/09 | Elección por mayor precisión en bloques de tiempo (selección 100–174, confirmación 175–194), con suavizado jerárquico y ML con atributos del código; sin desempate por simplicidad |
| `empaquetar.py` | P13 | .zip de reproducción (código, entorno, resultados, hoja); falla si entra un CSV o un VIN |
