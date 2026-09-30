# Borradores de la entrega

Pieza **P10** del [plan de acción][plan-piezas], seguida en [#33][i33]. Estos borradores en Markdown son la base del Informe (.docx, E2) y de la presentación (.pptx, E1), que se arman **fuera del repo** sobre los templates de Ford ([alcance de entrega][alc]). Los datos personales de la carátula van solo en los archivos finales.

Reglas que siguen todos los archivos:

- Cada afirmación lleva su fuente (comentario del ticket, archivo del repo o URL externa) y, donde hace afirmaciones, se separan **observaciones**, **hipótesis** y **decisiones acordadas** ([AGENTS.md][agents]).
- Cada cifra lleva «entre auditados con actividad QLS, [tramo], base ficticia, n = …» ([base QLS][qls], punto 2).
- Rigen las afirmaciones permitidas y prohibidas de [validación][val], punto 8: nada de impacto o ahorro en planta, reducción de calibraciones, validez para no auditados ni causas.
- Las cifras de validación salen solo de [`solucion/resultados/`][res] (`preparacion.json`, `p3.json`, `p4.json`, `p5.json`, `p6.json`, `p8.json`, `eleccion.json`). Las cifras de la prueba final salen de [`prueba-final.json`][final] (corrida 1, la única, del 30/09). Lo que todavía depende de una pieza queda como `[pendiente: Pn]` o `[pendiente: Cn]`.
- Vocabulario de [CONTEXT.md][ctx]. Nunca «probabilidad de la unidad».

## Índice

| Archivo | Qué es | Dónde va |
| --- | --- | --- |
| [01-descripcion-desafio.md](01-descripcion-desafio.md) | Proceso, selección al azar del 5 %, la pregunta y los datos | Informe §1 · Separador 01 |
| [02-1-resumen-ejecutivo.md](02-1-resumen-ejecutivo.md) | Versión elegida tras la corrida (mejora), con el calificador y los límites fijos | Informe §2.1 · Diapositiva de resultado (02) |
| [02-2-especificaciones-tecnicas.md](02-2-especificaciones-tecnicas.md) | Las cuatro partes obligatorias de la ficha: enfoque, elección del modelo (y por qué solo el código), preparación de datos y validación sin fuga | Informe §2.2 · Separador 02 |
| [02-2-1-informacion-complementaria.md](02-2-1-informacion-complementaria.md) | Resumen de la hoja (E3), diagramas de proceso y solución, contenido del .zip | Informe §2.2.1 · Demo (02) |
| [02-3-seguridad-privacidad.md](02-3-seguridad-privacidad.md) | Normas (ISO/IEC 27001, NIST CSF 2.0, ISA/IEC 62443, Ley 25.326) y análisis de riesgos | Informe §2.3 · Diapositiva de seguridad (02) |
| [03-factibilidad-economica.md](03-factibilidad-economica.md) | Implementación, operación, mantenimiento, escenarios de escala con precios públicos y fórmula del beneficio | Informe §3 · Separador 03 |
| [04-valor-diferencial.md](04-valor-diferencial.md) | «Dónde mirar», selección que aprende, detector de cambios, señal por mercado, subcategorización | Informe §4 · Separador 04 |
| [05-trabajo-futuro.md](05-trabajo-futuro.md) | Implementación con días de control, escalado, replicabilidad y límites de una prueba en planta | Informe §5 · Separador 05 |
| [06-conclusiones.md](06-conclusiones.md) | Resultado (mejora), valor y próximos pasos concretos | Informe §6 · Separador 06 |
| [ideas-descartadas.md](ideas-descartadas.md) | Passport, perfil por VIN, secuencias, anomalías, 20 % permanente y otras, con su motivo | Informe §2.2 o anexo · Preguntas |
| [preguntas-jurado.md](preguntas-jurado.md) | 30 preguntas probables con respuesta corta y fuente | Preparación de preguntas |
| [guion-presentacion.md](guion-presentacion.md) | Diapositiva por diapositiva, ~20 minutos más versión núcleo de 12 a 15 | Presentación |

Las figuras se referencian con los nombres que genera P9 en [`figuras/`](figuras/) (PNG y SVG): `comparacion_alternativas`, `veces_azar`, `etiquetas_parciales`, `donde_mirar`, `detector_potencia`, `diagrama_proceso` y `diagrama_solucion`. Esa carpeta la mantiene P9 y no forma parte de este commit.

## Estado de las cifras pendientes

Las cifras de validación de P3 a P6, la hoja de desarrollo de P8 y las de la prueba final (corrida única del 30/09, **mejora**) ya están en los borradores. Queda:

| Marca | Qué falta | Archivos |
| --- | --- | --- |
| `[pendiente: C3]` | Captura de la hoja del Día 260 (sale de la salida local, fuera de Git) | 02-2-1 |

Para listar todas las marcas: `grep -n "pendiente:" docs/entrega/*.md`.

## Decisiones de la sesión conjunta (30/09)

Tomadas por Mateo Serebrinsky y Facundo Lanusse, sin el tercer integrante; detalle en [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33#issuecomment-5917939084).

1. **«Y» en la frase de resultado:** la precisión *esperada* al azar con el mismo cupo diario (`azar_mismo_cupo`); el sorteo con semilla queda como control.
2. **Potencia:** se cita lo observado, ±3,4 a ±4,5 puntos en validación, no el «±3» del plan.
3. **Umbral de «se sostiene»:** las dos reglas actuales (Wilson para los códigos que casi no se calibran; mejora / inconcluso / peor para «dónde mirar»).
4. **Subcategorización:** fuera del preregistro; se muestra solo con cifras de validación, rotulada así.
5. **Alarmas del detector:** observaciones sin causa, junto a la tasa esperada de falsas alarmas.
6. **Hoja del día mostrado:** se explica antes que el cupo se concentra en un código.
7. **Días de control:** el rango ancho es el motivo para medir en planta y calcular allí la duración de la etapa.
8. **Operación con tasa fija:** tasa fija revisada periódicamente, con el detector avisando entre revisiones. **La periodicidad de la revisión sigue sin fijarse.** Ajustado el texto de `CONTEXT.md` y de los borradores. Siguen diciendo «tasa reciente» / «recálculo diario» lo que genera el código: la columna «Tasa reciente» de la hoja, el texto de las figuras `diagrama_proceso` y `diagrama_solucion`, y `docs/plan-de-accion.md` (especificación original); cambiarlos implica tocar `solucion/` y regenerar.

[plan-piezas]: ../plan-de-accion.md#piezas-de-trabajo
[plan-inc]: ../plan-de-accion.md#incompatibilidades-y-cómo-se-resuelven
[plan-par]: ../plan-de-accion.md#parámetros
[alc]: ../alcance-entrega.md
[agents]: ../../AGENTS.md
[ctx]: ../../CONTEXT.md
[res]: ../../solucion/resultados/
[final]: ../../solucion/resultados/prueba-final.json
[p3]: ../../solucion/resultados/p3.json
[p5]: ../../solucion/resultados/p5.json
[p6]: ../../solucion/resultados/p6.json
[p8]: ../../solucion/resultados/p8.json
[sal]: https://github.com/FordwardAI/ford-predictive-quality/issues/11#issuecomment-5817130432
[i33]: https://github.com/FordwardAI/ford-predictive-quality/issues/33
[val]: https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014
[alt]: https://github.com/FordwardAI/ford-predictive-quality/issues/10#issuecomment-5820794998
[qls]: https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478
