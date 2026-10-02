# Prueba de concepto: reproducción

Código del [plan de acción](../docs/plan-de-accion.md), seguido en [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33). Todo se evalúa en **validación (Día del VIN 155–194)**. Las etiquetas de Día ≥200 quedan enmascaradas al cargar y solo se desbloquean con el preregistro acordado (`solucion/preregistro.py`).

## Entorno

Python 3.13 (ver `.python-version`). Desde la raíz del repo:

```sh
brew install libomp              # macOS: OpenMP para xgboost y lightgbm (Linux: apt-get install libgomp1)
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

La prueba final tuvo **tres lecturas**, cada una con su preregistro:
- tasa fija, el 30/09 (`preregistro.json`);
- **CatBoost con atributos, reentrenado cada 5 días**, el 30/09 (`preregistro-precision.json`): es la solución;
- Random Forest con atributos, el 01/10 (`preregistro-efectividad.json`).

Las tres están en [`resultados/prueba-final.json`](resultados/prueba-final.json). La lectura de CatBoost tiene evidencia más débil porque se acordó conociendo la primera ([cómo se iteró la solución](../docs/entrega/02-2-especificaciones-tecnicas.md#cómo-se-iteró-la-solución)). No se vuelven a correr.

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
| `ml.py` | P4 | ML sobre el código: siete familias, promedio y stacking, en modo fijo y reentrenado |
| `exploracion.py` | P5 | Etiquetas parciales, mínimo por código, Thompson y días de control |
| `diferencial.py` | P6 | «Dónde mirar», detector de cambios, subcategorización y anexo de historial |
| `preregistro.py` | P7 | Preregistro y lectura de la prueba final |
| `hoja.py` | P8 | Hoja de códigos prioritarios: planilla CSV/XLSX e imprimible |
| `figuras.py` | P9 | Figuras y diagramas de `docs/entrega/figuras/` |
| `run.py` | P2 | Comando único |
| `precision.py` | solución (30/09) | Elección por mayor precisión en bloques de tiempo (selección 100–174, confirmación 175–194), con suavizado jerárquico y ML con atributos del código; sin desempate por simplicidad |
| `empaquetar.py` | P13 | .zip de reproducción (código, entorno, resultados, hoja); falla si entra un CSV o un VIN |
