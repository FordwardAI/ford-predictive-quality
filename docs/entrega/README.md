# Borradores de la entrega

Pieza **P10** del [plan de acción][plan-piezas], seguida en [#33][i33]. Estos borradores en Markdown son la base del Informe (.docx, E2) y de la presentación (.pptx, E1), que se arman **fuera del repo** sobre los templates de Ford ([alcance de entrega][alc]). Los datos personales de la carátula van solo en los archivos finales.

Reglas que siguen todos los archivos:

- Cada afirmación lleva su fuente (comentario del ticket, archivo del repo o URL externa) y, donde hace afirmaciones, se separan **observaciones**, **hipótesis** y **decisiones acordadas** ([AGENTS.md][agents]).
- Cada cifra lleva «entre auditados con actividad QLS, [tramo], base ficticia, n = …» ([base QLS][qls], punto 2).
- Rigen las afirmaciones permitidas y prohibidas de [validación][val], punto 8: nada de impacto o ahorro en planta, reducción de calibraciones, validez para no auditados ni causas.
- Las cifras de validación salen solo de [`solucion/resultados/`][res] (`preparacion.json`, `p3.json`, `p4.json`, `p5.json`, `p6.json`, `p8.json`, `eleccion.json`). Lo que depende de piezas sin terminar queda como `[pendiente: Pn]`; la prueba final, como `[pendiente: P7]`.
- Vocabulario de [CONTEXT.md][ctx]. Nunca «probabilidad de la unidad».

## Índice

| Archivo | Qué es | Dónde va |
| --- | --- | --- |
| [01-descripcion-desafio.md](01-descripcion-desafio.md) | Proceso, selección al azar del 5 %, la pregunta y los datos | Informe §1 · Separador 01 |
| [02-1-resumen-ejecutivo.md](02-1-resumen-ejecutivo.md) | Tres versiones (mejora, inconcluso, peor), escritas antes de la corrida, con el calificador y los límites fijos | Informe §2.1 · Diapositiva de resultado (02) |
| [02-2-especificaciones-tecnicas.md](02-2-especificaciones-tecnicas.md) | Las cuatro partes obligatorias de la ficha: enfoque, elección del modelo (y por qué solo el código), preparación de datos y validación sin fuga | Informe §2.2 · Separador 02 |
| [02-2-1-informacion-complementaria.md](02-2-1-informacion-complementaria.md) | Resumen de la hoja (E3), diagramas de proceso y solución, contenido del .zip | Informe §2.2.1 · Demo (02) |
| [02-3-seguridad-privacidad.md](02-3-seguridad-privacidad.md) | Normas (ISO/IEC 27001, NIST CSF 2.0, ISA/IEC 62443, Ley 25.326) y análisis de riesgos | Informe §2.3 · Diapositiva de seguridad (02) |
| [03-factibilidad-economica.md](03-factibilidad-economica.md) | Implementación, operación, mantenimiento, escenarios de escala con precios públicos y fórmula del beneficio | Informe §3 · Separador 03 |
| [04-valor-diferencial.md](04-valor-diferencial.md) | «Dónde mirar», selección que aprende, detector de cambios, señal por mercado, subcategorización | Informe §4 · Separador 04 |
| [05-trabajo-futuro.md](05-trabajo-futuro.md) | Implementación con días de control, escalado, replicabilidad y límites de una prueba en planta | Informe §5 · Separador 05 |
| [06-conclusiones.md](06-conclusiones.md) | Resultado (a elegir), valor y próximos pasos concretos | Informe §6 · Separador 06 |
| [ideas-descartadas.md](ideas-descartadas.md) | Passport, perfil por VIN, secuencias, anomalías, 20 % permanente y otras, con su motivo | Informe §2.2 o anexo · Preguntas |
| [preguntas-jurado.md](preguntas-jurado.md) | 30 preguntas probables con respuesta corta y fuente | Preparación de preguntas |
| [guion-presentacion.md](guion-presentacion.md) | Diapositiva por diapositiva, ~20 minutos más versión núcleo de 12 a 15 | Presentación |

Las figuras se referencian con los nombres que genera P9 en [`figuras/`](figuras/) (PNG y SVG): `comparacion_alternativas`, `veces_azar`, `etiquetas_parciales`, `donde_mirar`, `detector_potencia`, `diagrama_proceso` y `diagrama_solucion`. Esa carpeta la mantiene P9 y no forma parte de este commit.

## Estado de las cifras pendientes

Las cifras de validación de P3 a P6 y la hoja de desarrollo de P8 ya están en los borradores. Queda:

| Marca | Qué falta | Archivos |
| --- | --- | --- |
| `[pendiente: P7]` | Todo lo de la prueba final: X, Y, rango, lectura, piezas del diferencial que se sostienen, preregistro y la hoja del último día ≤260 | 02-1, 02-2, 02-2-1, 03, 04, 06, guion |

Para listar todas las marcas: `grep -n "pendiente:" docs/entrega/*.md`.

## Para decidir en equipo

1. **Qué es «Y» en la frase de resultado.** El código calcula la referencia del azar como la precisión *esperada* al azar con el mismo cupo diario (`azar_mismo_cupo`: 9,9 % en validación) y aparte un sorteo simulado con semilla (9,0 % en validación), entre auditados con actividad QLS, validación 155–194, base ficticia, n = 8.038 VIN ([`p3.json`][p3]). Los borradores usan la esperada, que es la base de «veces el azar» y de la lectura. Conviene confirmarlo.
2. **Potencia.** El plan dice «unos ±3 puntos» ([plan][plan-inc], incompatibilidad 11). En validación, los rangos observados de las alternativas elegibles miden de 6,8 a 9,0 puntos de ancho, es decir ±3,4 a ±4,5 ([`p3.json`][p3]). Los borradores usan la cifra observada; la conclusión del plan (se esperan empates) no cambia.
3. **Umbral de «se sostiene».** El [plan][plan-par] fija la regla solo para los códigos que casi no se calibran (rango de Wilson entero por debajo de la tasa general). Para «dónde mirar» rige la lectura mejora / inconcluso / peor de [alternativas][alt], punto 11. Los borradores usan esas dos reglas.
4. **Qué entra al preregistro del diferencial.** En validación, «dónde mirar» mejora, el mínimo por código quedó en P = 40 y el detector tiene umbral h = 4,4; la subcategorización **no** mantuvo el orden de tasas entre grupos ([`p5.json`][p5]; [`p6.json`][p6]). Según el [plan][plan-inc] (incompatibilidad 3), lo que no llega al preregistro se muestra solo con cifras de validación. Hay que decidir en P7 si la subcategorización se preregistra igual o queda como «solo validación».
5. **Alarmas reales del detector.** En validación hubo 7 alarmas en 40 días, frente a una tasa calibrada de ~1 falsa alarma cada 30 días ([`p6.json`][p6]). Los borradores las presentan como observaciones, sin causa. Conviene acordar cómo mostrarlas.
6. **La hoja de desarrollo concentra el cupo en un código.** En el Día 190, toda la cantidad sugerida cae en un solo código, más 2 filas de mínimo por código ([`p8.json`][p8]). Es coherente con lo observado en la [salida para Calidad][sal], pero en la demo conviene explicarlo antes de que lo pregunte el jurado.
7. **Días de control: rango ancho.** Estiman bien las veces el azar (1,35 frente a 1,34 con etiquetas completas), pero con un rango de 0,75 a 2,47 en 35 días ([`p5.json`][p5]). Refuerza que la duración de la etapa en planta se calcule con datos reales ([base QLS][qls], punto 7).
8. **Tasa fija frente a «tasa reciente del código».** Ganó la tasa fija (≤149, reentrenada con ≤194 para la prueba), que no se actualiza día a día. El [glosario][ctx] y los borradores describen la hoja con la «tasa reciente del código» y un «recálculo diario». Hay que acordar cómo se describe la operación: por ejemplo, tasa fija recalculada en cada revisión periódica, con el detector de cambios avisando entre revisiones. Los borradores no cambiaron esa descripción.

[plan-piezas]: ../plan-de-accion.md#piezas-de-trabajo
[plan-inc]: ../plan-de-accion.md#incompatibilidades-y-cómo-se-resuelven
[plan-par]: ../plan-de-accion.md#parámetros
[alc]: ../alcance-entrega.md
[agents]: ../../AGENTS.md
[ctx]: ../../CONTEXT.md
[res]: ../../solucion/resultados/
[p3]: ../../solucion/resultados/p3.json
[p5]: ../../solucion/resultados/p5.json
[p6]: ../../solucion/resultados/p6.json
[p8]: ../../solucion/resultados/p8.json
[sal]: https://github.com/FordwardAI/ford-predictive-quality/issues/11#issuecomment-5817130432
[i33]: https://github.com/FordwardAI/ford-predictive-quality/issues/33
[val]: https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014
[alt]: https://github.com/FordwardAI/ford-predictive-quality/issues/10#issuecomment-5820794998
[qls]: https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478
