# Alcance de entrega y reparto de trabajo

Documento de [¿Qué alcance de entrega y reparto de trabajo se compromete para el 2 de octubre?](https://github.com/FordwardAI/ford-predictive-quality/issues/12). Borrador del 23/09, actualizado el 24/09 con los templates del Drive y el 29/09 con la revisión de la especificación final.

**Estado: ticket cerrado el 24/09; revisado el 29/09 en [¿La especificación permite repartir el trabajo sin decisiones críticas pendientes?](https://github.com/FordwardAI/ford-predictive-quality/issues/13).** Este documento fija qué se entrega, con qué formato y qué contiene cada sección. **El trabajo, su orden y sus criterios de aceptación están en el [plan de acción](plan-de-accion.md).** El calendario del 24/09, el congelamiento de resultados del 29/09 y el orden de recorte quedaron sin efecto: se hace todo y no hay responsables por persona.

## Ya acordado

- **Fecha de entrega:** Trials Day, viernes 2 de octubre de 2026, en Planta Pacheco, de 9:00 a 15:00. Cada equipo presenta unos 30 minutos ante el jurado. Después del almuerzo hay un par de horas para ajustar con el feedback, y **los entregables se entregan al cierre, a las 15:00** (correo de Ford registrado en el [ticket de la especificación](https://github.com/FordwardAI/ford-predictive-quality/issues/13)).
- **Equipo:** FordwardAI, tres integrantes: dos de informática y uno de industrial.
- **Templates recibidos:** Ford indicó el 22/09 que los templates del Drive detallan las entregas obligatorias. El equipo los revisó el 24/09 ([resumen en el ticket](https://github.com/FordwardAI/ford-predictive-quality/issues/12#issuecomment-5823923345)) y los volvió a revisar el 29/09. En lo que definen, el formato de la entrega, reemplazan el supuesto de la alternativa 7. La [ficha técnica](fuentes/documentation.md) sigue siendo la consigna, es decir, qué tiene que resolver la solución.
- **Contacto con Ford:** lo coordina MaximoGeorgalos.
- **Comparación contra el azar al mismo cupo:** el cupo diario simulado es el 5 % de los auditados con actividad QLS de cada día. No se modelan costos dentro de la planta. Ver la [resolución sobre el momento de la auditoría](https://github.com/FordwardAI/ford-predictive-quality/issues/4#issuecomment-5718463685), la [reunión con Ford del 22/09](https://github.com/FordwardAI/ford-predictive-quality/issues/5#issuecomment-5800841330) y la [base QLS](https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478).

## Qué exigen los templates

Las copias de los templates quedan fuera del repo. Acá se registra solo la estructura que piden.

| Entregable | Formato | Estructura exigida |
| --- | --- | --- |
| **Informe de la Solución** | .docx sobre el template de Ford: A4, Palatino y número de página | **Carátula:** «Ford Innovation Challenge III — AI Edition — 2026», logo, título, desafío, equipo y la tabla de integrantes (nombre, universidad, carrera y correo). **Índice:** es un campo que hay que actualizar. **Secciones:** 1. Descripción del desafío. 2. Descripción de la solución: 2.1 Resumen ejecutivo (**media carilla como máximo**; es lo primero que lee el evaluador), 2.2 Especificaciones técnicas (justificar por qué la solución resuelve el desafío), 2.2.1 Información complementaria (todos los entregables que se puedan adjuntar, como diagramas de flujo e imágenes) y 2.3 Seguridad y privacidad (justificar que no introduce un riesgo de ciberseguridad, con normas y análisis de riesgos). 3. Factibilidad económica (costo de implementación, herramientas y mantenimiento; justificar la inversión). 4. Valor diferencial e innovación. 5. Trabajo futuro, con replicabilidad. 6. Conclusiones, con los próximos pasos concretos hacia la implementación. |
| **Presentación** | .pptx sobre el template de Ford, 16:9, fechada «Octubre 2026». El archivo sigue el patrón `FIC_III_Desafio_AAA_Equipo_BBB.pptx` | Portada con desafío, equipo y tres integrantes. Seis separadores, 01 a 06, con las mismas secciones que el informe salvo seguridad y privacidad, que no tiene bloque propio. Diapositiva de cierre. Las 50 diapositivas genéricas de la marca Ford se borran. No se modifican los logos, las imágenes tienen que tener derechos de uso y los íconos salen de GEAR. |
| **.zip** | Adjunto | Todos los entregables que no se puedan incluir en el informe. |

**Los templates no especifican:** la cantidad de diapositivas, la extensión del informe (fuera del resumen ejecutivo) ni el canal de entrega. La duración (~30 minutos) y la hora de cierre (15:00) las dio Ford por correo.

## Qué exige la ficha técnica

Fuente: [ficha técnica del desafío](fuentes/documentation.md), secciones «Base de Datos» y «Criterios de Evaluación». Define qué contenido debe tener la solución. Los templates dicen dónde va.

| Elemento | Carácter según la ficha | Criterio que lo evalúa | Dónde va |
| --- | --- | --- | --- |
| Enfoque metodológico y lógica conceptual | **Obligatorio** («deberá detallar») | Justificación de la solución | Informe 2.2 |
| Elección del modelo frente a otras alternativas | **Obligatorio** | Justificación de la solución | Informe 2.2 |
| Preparación de los datos | **Obligatorio** | Rigor técnico y validación | Informe 2.2 |
| Esquema de validación que demuestre efectividad | **Obligatorio** | Rigor técnico y validación; capacidad de predicción | Informe 2.2 |
| Exposición oral ante el jurado con soporte visual | **Evaluado** | Presentación y speech | Presentación |
| Dashboard o reporte accionable: predicciones, unidades priorizadas, variables de mayor impacto | **Valorado** («se valorará») | Aplicabilidad e impacto | Informe 2.2.1 y .zip |

## Entregables

| | Entregable | Formato | Listo cuando |
| --- | --- | --- | --- |
| **E1** | Presentación | .pptx sobre el template, fuera del repo: ~20 minutos de exposición y ~10 de preguntas, más una versión núcleo de 12 a 15 minutos. Presentan los tres. | Cubre las secciones del template, muestra el resultado contra el azar con su incertidumbre y declara los límites de la base ficticia. Se ensayó completa con cronómetro. |
| **E2** | Informe de la Solución | .docx sobre el template, fuera del repo, armado desde los borradores de `docs/entrega/`. | Tiene todas las secciones del template y las cuatro partes obligatorias de la ficha en 2.2. Cada afirmación se apoya en evidencia reproducible y separa observaciones, hipótesis y decisiones. |
| **E3** | Reporte accionable: la hoja de códigos prioritarios | Reporte estático diario, definido en [¿Qué necesita ver Calidad para actuar sobre una priorización?](https://github.com/FordwardAI/ford-predictive-quality/issues/11#issuecomment-5817130432). Tiene cantidad sugerida por código ([operación](https://github.com/FordwardAI/ford-predictive-quality/issues/23#issuecomment-5896188950)), columnas legibles y sale como planilla más una versión imprimible ([agrupación](https://github.com/FordwardAI/ford-predictive-quality/issues/27#issuecomment-5896362581)). Suma una lista de unidades sugeridas y un bloque «por qué este código» ([plan](plan-de-accion.md)). Va resumida en el Informe 2.2.1 y completa en el .zip. | Alguien de Calidad podría decidir qué auditar mirándola, sin explicación técnica. Se genera fuera del repo: al repo va el código que la produce, no filas por VIN. |
| **E4** | Código y evidencia reproducible | Scripts en el repo, ejecutables desde la raíz con el CSV y el catálogo identificados por hash. Van en el .zip o con un enlace al repo, sin datos crudos. | Reproduce desde cero los números de E1, E2 y E3, y sus pruebas pasan. |

**Plataforma web:** para el 2/10 no se construye una aplicación: la E3 sigue siendo la hoja (planilla más imprimible), como fijó la [agrupación](https://github.com/FordwardAI/ford-predictive-quality/issues/27#issuecomment-5896362581). Desde el 30/09 la plataforma web deja de estar descartada: se presenta como **propuesta de implementación y escalado**, para visualizar todos los datos de la solución, con un prototipo de pantallas en la presentación (decisión de Facundo-Lanusse en [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33)). Las ideas del documento inicial que no entran (Predictive Quality Passport, perfil de riesgo por VIN) se nombran en el informe junto con el motivo.

## Contenido por sección del informe

La mayoría de las secciones salen de decisiones ya cerradas en el mapa. Seguridad y privacidad, Factibilidad económica y Trabajo futuro se escriben durante la construcción, con la orientación del [plan](plan-de-accion.md).

| Sección | Qué contiene | Se apoya en |
| --- | --- | --- |
| 1. Descripción del desafío | El problema de elegir qué auditar después de Gate Release y el muestreo aleatorio del 5 % como referencia. | [Consigna y fuentes](../research/consigna-fuentes.md); [momento y conjunto de la auditoría](https://github.com/FordwardAI/ford-predictive-quality/issues/4#issuecomment-5718463685) |
| 2.1 Resumen ejecutivo | Qué hace la solución, cómo resuelve el desafío y por qué es viable, en media carilla. Hay tres versiones escritas antes de la corrida única. | Todo el mapa; [plan](plan-de-accion.md#cómo-se-comunican-los-resultados) |
| 2.2 Especificaciones técnicas | Las cuatro partes de la ficha: registros y variables (con la defensa de usar solo el código), preparación de datos, validación temporal, alternativas comparadas y criterio de mejora. | [Registros y variables](https://github.com/FordwardAI/ford-predictive-quality/issues/6), [validación](https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014), [mejora útil](https://github.com/FordwardAI/ford-predictive-quality/issues/8#issuecomment-5801943323), [representación](https://github.com/FordwardAI/ford-predictive-quality/issues/9#issuecomment-5820084609), [alternativas](https://github.com/FordwardAI/ford-predictive-quality/issues/10#issuecomment-5820794998) |
| 2.2.1 Información complementaria | Resumen de E3, diagrama del proceso con el punto donde entra la hoja y diagrama de la solución. | [Salida para Calidad](https://github.com/FordwardAI/ford-predictive-quality/issues/11#issuecomment-5817130432); [plan](plan-de-accion.md) |
| 2.3 Seguridad y privacidad | Una investigación breve de normas de ciberseguridad y el análisis de riesgos de la solución: qué datos usa, dónde corre y quién accede. | [Plan](plan-de-accion.md), pieza P10 |
| 3. Factibilidad económica | Costos de implementación, operación y mantenimiento de la solución, escenarios de escala y la justificación a cupo fijo. No incluye costos dentro de la planta (costo de auditar o de dejar pasar una falla): se deja la fórmula para que Ford aplique los suyos. | [Plan](plan-de-accion.md#factibilidad-económica-y-escalado) |
| 4. Valor diferencial e innovación | «Dónde mirar» (componente), la selección que aprende de sus auditorías (mínimo por código y días de control), detector de cambios por código, señal por mercado de destino e insumo para la subcategorización. | [Alternativas y diferencial](https://github.com/FordwardAI/ford-predictive-quality/issues/10#issuecomment-5820794998); [base QLS](https://github.com/FordwardAI/ford-predictive-quality/issues/29#issuecomment-5896631478) |
| 5. Trabajo futuro | Cómo implementaría y escalaría Ford la solución: implementación inicial con días de control y sus límites (solo se conoce el resultado de lo que se audita) y replicabilidad en otras líneas o plantas. | [Plan](plan-de-accion.md#factibilidad-económica-y-escalado) |
| 6. Conclusiones | Resultado contra el azar, valor y próximos pasos concretos. | Corrida única de la prueba final ([plan](plan-de-accion.md)) |

## Reparto de trabajo

**Sin responsables por persona:** el equipo trabaja todo en conjunto (decisión del 29/09). Las piezas, sus dependencias y sus criterios de aceptación están en el [plan de acción](plan-de-accion.md). Quien empieza una pieza la marca en [Construir la prueba de concepto y los entregables para el Trials Day](https://github.com/FordwardAI/ford-predictive-quality/issues/33).

## Pendientes

| Pendiente | Si no se resuelve |
| --- | --- |
| Canal de entrega a las 15:00 del 2/10 | Llevar todo en dos medios (notebook y pendrive o enlace). |
| Público y jurado de la presentación | Se presenta para un jurado mixto, técnico y de planta. |

Los templates no se copian al repo: se registra solo la lista de qué se entrega, sin material confidencial. Los datos personales de la carátula van solo en los archivos finales.

## Qué no decide este documento

Métricas, umbrales, modelos, variables admisibles, particiones y exclusiones: cada una corresponde a su ticket. Los parámetros y el orden del trabajo están en el [plan de acción](plan-de-accion.md). Este documento no implementa ni entrena nada: organiza qué se entrega y con qué formato.
