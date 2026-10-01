# Experimentos conservados

Evidencia exploratoria, separada del recorrido de [reproducción de la entrega](../README.md).
Todo usa Día <195, ya explorado, entre auditados con actividad QLS de la base ficticia.
No modifica los preregistros ni relee la prueba final. Comandos desde la raíz del repo,
con el mismo [entorno fijado](../../requirements.txt).

## Historial, modelos y mezclas

- `--piezas historial_vin` compara representaciones del historial; escribe `solucion/experimentos/resultados/historial_vin.json`.
  Disponibilidad operativa no probada: [informe](../../research/historial-vin.md).
- `--piezas ensemble` compara CatBoost con atributos y la tasa móvil suavizada hacia mercado, solos y mezclados
  (pesos 25/50/75 %, ventanas 30/60/120 días). Elige en 100–174 y comprueba en 175–194, ya visto: exploratorio.
  Escribe `solucion/experimentos/resultados/ensemble.json`; no modifica el preregistro ni lee la prueba final.
- `--piezas busqueda` amplía los individuales, columnas y datos sintéticos de entrenamiento; prueba parejas,
  conjuntos de familias, pesos discretos/continuos, mediana, rangos y stacking temporal. Usa Día <195 y
  predicciones previas de 70–94 para arrancar el meta-modelo. Guarda predicciones solo en la caché externa y
  publica agregados en `solucion/experimentos/resultados/busqueda.json`. Es exploratorio y no modifica el preregistro.
- `--piezas semillas_busqueda` comprueba con semillas 1–5 la mezcla de catálogo elegida, con pesos
  congelados: 60 % stacking fijo + 40 % jerárquico 60 días, peso 20. Compara sus componentes,
  CatBoost conjunto y RF con atributos; escribe `solucion/experimentos/resultados/semillas_busqueda.json`.

La revisión de catálogo y elección adaptativa reutiliza la caché de predicciones de `busqueda`, sin entrenar
ni releer la prueba final. Usar únicamente la caché local propia (pickle no es un formato seguro para archivos externos):

```sh
.venv/bin/python -m solucion.experimentos.robustez_busqueda \
  --predicciones '<cache>/busqueda-<hash>.pickle' \
  --salida solucion/experimentos/resultados/robustez_busqueda.json
```

Cobertura, resultados y límites de estos experimentos en [búsqueda amplia](../../research/busqueda-amplia.md).

## Mundo simulado con verdad conocida

`python -m solucion.experimentos.simulacion --csv '<CSV vigente>' --catalogo '<catálogo vigente>' --catboost` (o
`--piezas simulacion` en `solucion.run`) arma un mundo donde la tasa verdadera de cada VIN se conoce, ajustado solo con
Día <195 y con los días y códigos reales, y corre sobre él, 24 veces por escenario, las mismas alternativas y el mismo
protocolo de bloques. Mide la precisión verdadera de cada opción (sin el ruido de las etiquetas), la fracción de la mejor
selección posible que alcanza y cuánto de la diferencia entre opciones se vería en los datos. La amplitud de la señal se
calibra con las estimaciones reales sin ML en la selección. **Es una simulación, no evidencia sobre la planta.** Escribe
`solucion/experimentos/resultados/simulacion.json`; unos 85 minutos con CatBoost. Informe: [simulación](../../research/simulacion-evaluacion.md).

## Opción más precisa con el código

`python -m solucion.experimentos.opcion_precisa --csv '<CSV vigente>' --catalogo '<catálogo vigente>'` mide el techo
del código y la estabilidad del orden entre bloques. Compara dos familias nuevas con las del equipo: riesgo relativo
estandarizado por día y tasa con olvido hacia el mercado, con parámetros elegidos por log-loss secuencial en 60–149.
También prueba tres palancas (demora de resultados, días de playa e historial QLS). Solo Día <195; escribe
`solucion/experimentos/resultados/opcion_precisa.json`. Informe: [opción más precisa](../../research/opcion-mas-precisa.md).

## Escenarios de datos de proceso inventados

La simulación de sensibilidad añade 13 proxies normalizados de cuatro dimensiones de proceso
a catálogo/atributos y compara logística, RF y LightGBM en cinco semillas. **Las columnas se
generan condicionadas a las etiquetas para imponer una señal hipotética**, también en evaluación;
no son mediciones de planta ni un predictor desplegable. Incluye señal nula/débil/moderada/fuerte,
ruido/faltantes y una inversión temporal. Solo Día <195, en los mismos bloques ya explorados.
No forma parte del comando por defecto ni modifica el preregistro.

```sh
.venv/bin/python -m solucion.experimentos.sensibilidad_proceso \
  --csv '<CSV vigente>' --catalogo '<catálogo vigente>' \
  --salida solucion/experimentos/resultados/sensibilidad_proceso.json
```

Informe y límites: [sensibilidad a datos de proceso](../../research/sensibilidad-proceso.md).

La ampliación con los **candidatos priorizados** reproduce los controles de #48 y conserva
sus configuraciones: RF con atributos, CatBoost conjunto, stacking y mezcla 60/40 con tasa
jerárquica. El stacking recibe proxies mediante una corrección de logits aprendida en su
tramo interno; las siete bases y los pesos originales quedan congelados. Tasa fija y
jerárquico permanecen como controles por código, sin consumir proxies.

```sh
.venv/bin/python -m solucion.experimentos.sensibilidad_candidatos \
  --csv '<CSV vigente>' --catalogo '<catálogo vigente>' \
  --historico solucion/experimentos/resultados/semillas_busqueda.json \
  --salida solucion/experimentos/resultados/sensibilidad_candidatos.json
```

Supuestos y comparación completa: [sensibilidad de candidatos](../../research/sensibilidad-candidatos.md).
El [anexo completo](../../research/anexo-busqueda.md) presenta todos los pipelines y columnas. Para regenerar
el anexo y las figuras desde los agregados publicados, sin entrenar ni abrir el dataset:

```sh
MPLCONFIGDIR='<carpeta temporal>' .venv/bin/python research/documentar_busqueda.py
```


## Organización

Los ocho módulos (`historial_vin`, `columnas`, `ensemble`, `busqueda`, `robustez_busqueda`,
`semillas_busqueda`, `sensibilidad_proceso`, `sensibilidad_candidatos`) conservan sus pruebas
sintéticas en `solucion/pruebas/`. Los siete JSON en `resultados/` son los agregados originales,
sin alterar su contenido: sus rutas y versiones históricas describen la corrida que los produjo.
Las cachés anteriores permanecen fuera del repo. El cambio de código genera una nueva huella
para futuras corridas de búsqueda; la revisión de robustez permite usar la caché anterior por ruta.

No se eliminan informes, figuras ni resultados de alternativas descartadas: justifican la comparación.
El prototipo de plataforma continúa en `prototipos/`, fuera del ZIP y del recorrido principal.
