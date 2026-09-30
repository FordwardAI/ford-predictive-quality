# Historial del VIN: experimento de validación

Responde a la propuesta del 30/09 de modelar el historial de eventos de cada VIN (representación por VIN, riesgo por combinaciones, CatBoost/LightGBM, MIL con atención, learning to rank). **Evaluado en validación (Día < 195); prueba final no releída; disponibilidad del historial no verificada.** Código: [`solucion/historial_vin.py`](../solucion/historial_vin.py). Resultados agregados: [`historial_vin.json`](../solucion/resultados/historial_vin.json). Fuente: CSV y catálogo vigentes ([datos locales](../docs/datos-locales.md)). Unidad de análisis: VIN.

## Método

- **Bloques de tiempo** como en [`precision.json`](../solucion/resultados/precision.json): selección en los días 100–174 (cuatro bloques) y confirmación en 175–194. Cada modelo se entrena con los VIN de Día ≤ inicio del bloque − 6 y el cupo diario es el 5 % (`max(1, N_d // 20)`). Bootstrap por días, 2000 remuestreos, semillas registradas.
- **Predictores:** el código de catálogo y los atributos que se leen de él, más las fichas de los eventos del VIN (CP, grupo y zona que reportan, componente de inspección, incidencia y su tipo, CCC, VFG, VRT, PUL a reparar). Lista cerrada en `datos.EVENTO_COLUMNAS`: nunca el resultado ni el componente de Auditoría Adicional.
- **Siete modelos** (una semilla, 1): regresión logística, LightGBM, CatBoost, riesgo histórico por combinaciones (código × ficha), MIL con promedio de eventos, MIL con atención y LightGBM Ranker (lambdarank con un grupo por día). Los hiperparámetros se eligen por log-loss en los últimos 30 días del entrenamiento, nunca por precisión.
- **Cada modelo contra su par sin historial** (mismo modelo con código + atributos). Dos supuestos de disponibilidad: **A**, todos los eventos hasta el Día del VIN; **B**, solo eventos con fecha ≤ Día del VIN − 5 (Gate Release pasa 0–5 días antes de la auditoría, respuesta de Ford del 22/09).
- **Criterio fijado antes de correr:** «el historial aporta» si con B supera a su par en la precisión acumulada de selección, con el rango del 95 % de la diferencia pareada por encima de 0, y también en el bloque de confirmación.

## Observaciones

Entre auditados con actividad QLS, selección 100–174, base ficticia, n = 15.279 VIN, 740 elegidos (confirmación 175–194: 225 elegidos).

- **Ningún modelo cumple el criterio.** Con B, los rangos del 95 % de la diferencia con el par sin historial van de −5,0 a +2,6 puntos en selección y ninguno queda por encima de 0. Con A (el supuesto optimista) tampoco: ninguno supera a su par con el rango por encima de 0, así que no hay señal que atribuir a una fuga.
- **El historial no mejora el AUC:** entre 0,528 y 0,539 con historial y entre 0,525 y 0,542 sin él (promedio de los bloques), coherente con el 0,50 de los [experimentos anteriores](experimentos-modelado.md).
- **La atención no cambia nada:** MIL con atención y MIL con promedio dan la misma precisión en selección (13,6 % con B) y el mismo AUC.
- **Los pares sin historial rinden 13,5–17,8 % en selección** contra 12,7 % de la tasa fija reajustada y 11,2 % al azar: lo que aporta es el código con sus atributos, como ya mostraba [`precision.json`](../solucion/resultados/precision.json).
- **Con B casi no hay historial:** entre el 89 % y el 95 % de los VIN de cada bloque no tiene ningún evento con fecha ≤ Día − 5. Con B el modelo con historial es, para casi todos, su par sin historial.

## Hipótesis

- El historial de incidencias no tiene relación con lo que se calibra, como ya se vio con AUC ≈ 0,50; las dos formas nuevas (atención y ranking) no cambian eso. No se probó por qué.
- B es una prueba débil del historial: casi no hay eventos disponibles 5 días antes. Un resultado negativo con B no descarta que un historial más temprano (por ejemplo, el de estaciones previas a Gate Release, si Ford lo confirmara) aporte algo. Con A tampoco aparece señal.

## Decisiones acordadas

- El historial se reabrió como experimento (Mateo Serebrinsky, 30/09) y se midió solo en validación, sin tercera lectura de la prueba final.
- Con este resultado **el historial no entra en la solución**; sigue vigente la regla de `AGENTS.md`. No se incorporaron el objetivo auxiliar ni el ensamble de la propuesta porque ningún modelo mostró señal (condición fijada en el plan).

## Límites

- Una sola semilla por modelo y 740 elegidos: el ruido es de unos ±4 puntos por modelo.
- Se probaron 14 comparaciones (7 modelos × 2 supuestos) sin corrección por comparaciones múltiples; el resultado es negativo de todas formas.
- La base es ficticia; no prueba impacto en planta.
