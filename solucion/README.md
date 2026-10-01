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
- `--cache` (por defecto `~/.cache/ford-predictive-quality`) guarda la tabla por VIN ya enmascarada, fuera del repo.
- `--salida` (por defecto `~/.cache/ford-predictive-quality/salida`) recibe la hoja de códigos prioritarios, que tiene tasas por código y no se versiona.

Las piezas de entrega y `precision` escriben `solucion/resultados/<pieza>.json`; los experimentos,
`solucion/experimentos/resultados/<pieza>.json`: solo agregados por alternativa y por día, sin VIN ni tasas por código.

## Experimentos conservados

[Comandos, módulos y resultados exploratorios](experimentos/README.md) viven en `solucion/experimentos/`.
No forman parte del comando por defecto ni cambian la solución acordada. `precision.py` permanece aquí:
reconstruye el predictor del segundo preregistro y sus pruebas.

## Registro de la prueba final

La prueba final ya tuvo **dos lecturas el 30/09**: tasa fija (`preregistro.json`) y CatBoost con atributos,
reentrenado cada 5 días (`preregistro-precision.json`). Las dos están en
[`resultados/prueba-final.json`](resultados/prueba-final.json); la segunda tiene evidencia más débil
porque ocurre después de conocer la primera. Esta limpieza no adopta otro modelo ni vuelve a correrlas.

La reproducción recalcula validación y genera la hoja de desarrollo del Día 190. La hoja de prueba final
se produjo en la sesión registrada; no se regenera leyendo de nuevo sus etiquetas. Para el alcance y las
cifras de los entregables, consultar [los borradores](../docs/entrega/README.md).

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
| `precision.py` | segunda lectura 30/09 | Elección por mayor precisión en bloques de tiempo (selección 100–174, confirmación 175–194), con suavizado jerárquico y ML con atributos del código; sin desempate por simplicidad |
| `empaquetar.py` | P13 | .zip de reproducción (código, entorno, resultados, hoja); falla si entra un CSV o un VIN |
