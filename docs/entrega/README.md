# Borradores de la entrega

Pieza **P10** del [plan de acción][plan-piezas], seguida en [#33][i33]. Estos borradores en Markdown son la base del Informe (E2), que se arma **fuera del repo** sobre el template de Ford ([alcance de entrega][alc]). La presentación (E1) es el sitio de [`prototipos/presentacion-3d/`](../../prototipos/presentacion-3d/README.md), con su [speech](speech-presentacion.md). Los datos personales de la carátula van solo en los archivos finales.

**La solución es CatBoost con atributos del código, reentrenado cada 5 días.** Se llegó en dos etapas, y la prueba final se leyó tres veces: tasa fija, CatBoost y Random Forest. Todos los borradores cuentan la misma historia, cuyo detalle está en [cómo se iteró la solución](02-2-especificaciones-tecnicas.md#cómo-se-iteró-la-solución).

Reglas que siguen todos los archivos:

- Cada afirmación lleva su fuente (comentario del ticket, archivo del repo o URL externa) y, donde hace afirmaciones, se separan **observaciones**, **hipótesis** y **decisiones acordadas** ([AGENTS.md][agents]).
- Cada cifra lleva «entre auditados con actividad QLS, [tramo], base ficticia, n = …» ([base QLS][qls], punto 2).
- Rigen las afirmaciones permitidas y prohibidas de [validación][val], punto 8: nada de impacto o ahorro en planta, reducción de calibraciones, validez para no auditados ni causas.
- Las cifras de validación salen solo de [`solucion/resultados/`][res] (`preparacion.json`, `p3.json`, `p4.json`, `p5.json`, `p6.json`, `p8.json`, `eleccion.json`, `precision.json`). Las de la prueba final salen de [`prueba-final.json`][final]: `corridas[0]` es la tasa fija, `corridas[1]` CatBoost (la solución; `corridas[2]` la repite) y `corridas[3]` Random Forest.
- Las piezas del diferencial (dónde mirar, mínimo por código, detector y hojas de ejemplo) se midieron con el **predictor de la primera etapa** (tasa fija), y se rotulan así.
- Vocabulario de [CONTEXT.md][ctx]. Nunca «probabilidad de la unidad».

## Índice

| Archivo | Qué es | Dónde va |
| --- | --- | --- |
| [01-descripcion-desafio.md](01-descripcion-desafio.md) | Proceso, selección al azar del 5 %, la pregunta y los datos | Informe §1 |
| [02-1-resumen-ejecutivo.md](02-1-resumen-ejecutivo.md) | Resultado de CatBoost en la prueba final, la iteración y los límites fijos | Informe §2.1 |
| [02-2-especificaciones-tecnicas.md](02-2-especificaciones-tecnicas.md) | Las cuatro partes obligatorias de la ficha: enfoque, elección del modelo en dos etapas, preparación de datos y validación sin fuga; incluye la tabla de las tres lecturas | Informe §2.2 |
| [02-2-1-informacion-complementaria.md](02-2-1-informacion-complementaria.md) | La hoja (E3) y la plataforma, diagramas de proceso y solución, contenido del .zip | Informe §2.2.1 |
| [02-3-seguridad-privacidad.md](02-3-seguridad-privacidad.md) | Normas (ISO/IEC 27001, NIST CSF 2.0, ISA/IEC 62443, Ley 25.326), análisis de riesgos y controles de la evolución en GCP | Informe §2.3 |
| [03-factibilidad-economica.md](03-factibilidad-economica.md) | Implementación, operación, mantenimiento, escenarios de escala con precios públicos y fórmula del beneficio | Informe §3 |
| [04-valor-diferencial.md](04-valor-diferencial.md) | «Dónde mirar», selección que aprende, detector de cambios, señal por mercado, subcategorización | Informe §4 |
| [05-trabajo-futuro.md](05-trabajo-futuro.md) | Implementación con días de control, escalado, plataforma, replicabilidad y límites de una prueba en planta | Informe §5 |
| [05-1-scoring-fin-de-linea.md](05-1-scoring-fin-de-linea.md) | Feedback del jurado (02/10): puntaje de fin de línea, mediciones en la verificación de calidad, arquitectura en GCP (Pub/Sub, MQTT, BigQuery, Dataflow), evaluación en vivo y costos | Informe §5 (apartado nuevo), referencia [19] |
| [06-conclusiones.md](06-conclusiones.md) | Resultado, valor y próximos pasos concretos | Informe §6 |
| [ideas-descartadas.md](ideas-descartadas.md) | Passport, perfil por VIN, secuencias, anomalías, 20 % permanente y otras, con su motivo | Informe §2.2 o anexo · Preguntas |
| [preguntas-jurado.md](preguntas-jurado.md) | 33 preguntas probables con respuesta corta y fuente | Preparación de preguntas |
| [speech-presentacion.md](speech-presentacion.md) | Guion hablado de la presentación 3D, pantalla por pantalla, unos 30 minutos | Presentación (E1) |

Las figuras se referencian con los nombres que genera P9 en [`figuras/`](figuras/) (PNG y SVG): `comparacion_alternativas`, `veces_azar`, `veces_azar_prueba_final`, `etiquetas_parciales`, `donde_mirar`, `detector_potencia`, `diagrama_proceso` y `diagrama_solucion`. Se regeneran con el comando único de [`solucion/`](../../solucion/README.md).

## Estudios exploratorios

El [estudio de modelos, columnas y ensembles](../../research/busqueda-amplia.md), su [anexo completo](../../research/anexo-busqueda.md), la [opción más precisa](../../research/opcion-mas-precisa.md) y la [simulación con verdad conocida](../../research/simulacion-evaluacion.md) son evidencia exploratoria con Día < 195 de la base ficticia. Sostienen el anexo y las respuestas a preguntas con ese calificador. No cambian la solución ni las lecturas de la prueba final.

## Estado de las cifras pendientes

Las cifras de validación, la hoja de desarrollo y las tres lecturas de la prueba final ya están en los borradores. No quedan marcas `[pendiente: …]` con cifras.

Para listar cualquier marca que se agregue: `grep -n "pendiente:" docs/entrega/*.md`.

## Decisiones de la sesión conjunta (30/09)

Tomadas por Mateo Serebrinsky y Facundo Lanusse, sin el tercer integrante; detalle en [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33#issuecomment-5917939084). Se tomaron durante la primera etapa; las que hablan de la tasa fija quedaron superadas cuando se eligió CatBoost, también el 30/09.

1. **«Y» en la frase de resultado:** la precisión *esperada* al azar con el mismo cupo diario (`azar_mismo_cupo`); el sorteo con semilla queda como control.
2. **Potencia:** se cita lo observado, ±3,4 a ±4,5 puntos en validación, no el «±3» del plan.
3. **Umbral de «se sostiene»:** las dos reglas actuales (Wilson para los códigos que casi no se calibran; mejora / inconcluso / peor para «dónde mirar»).
4. **Subcategorización:** fuera del preregistro; se muestra solo con cifras de validación, rotulada así.
5. **Alarmas del detector:** observaciones sin causa, junto a la tasa esperada de falsas alarmas.
6. **Hoja del día mostrado:** se explica antes que el cupo se concentra en un código.
7. **Días de control:** el rango ancho es el motivo para medir en planta y calcular allí la duración de la etapa.
8. **Operación con tasa fija** (superada): era tasa fija revisada periódicamente, con el detector avisando entre revisiones. Hoy la operación es CatBoost reentrenado cada 5 días con calendario fijo, como en la [plataforma](../../plataforma/README.md). La columna «Tasa reciente» de la hoja y [`docs/plan-de-accion.md`](../plan-de-accion.md) (especificación original) conservan el lenguaje de la primera etapa.

[plan-piezas]: ../plan-de-accion.md#piezas-de-trabajo
[alc]: ../alcance-entrega.md
[agents]: ../../AGENTS.md
[ctx]: ../../CONTEXT.md
[res]: ../../solucion/resultados/
[final]: ../../solucion/resultados/prueba-final.json
[i33]: https://github.com/FordwardAI/ford-predictive-quality/issues/33
[val]: https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014
[qls]: https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478
