# Alcance de entrega y reparto de trabajo

Documento de [¿Qué alcance de entrega y reparto de trabajo se compromete para el 2 de octubre?](https://github.com/FordwardAI/ford-predictive-quality/issues/12). Borrador del 23/09, actualizado el 24/09 con los templates del Drive.

**Estado: ticket cerrado el 24/09.** Quedan fijados los entregables, su formato, el contenido de cada sección, el calendario de trabajo y el orden de recorte. **No se asignan responsables por persona:** el equipo decidió no repartir roles todavía, así que cada pieza de trabajo figura sin responsable. El reparto se revisa en [¿La especificación permite repartir el trabajo sin decisiones críticas pendientes?](https://github.com/FordwardAI/ford-predictive-quality/issues/13).

## Ya acordado

- **Fecha de entrega:** viernes 2 de octubre de 2026. [Consigna y fuentes](../research/consigna-fuentes.md#evidencia-y-autoridad).
- **Equipo:** tres integrantes, dos de informática y uno de industrial.
- **Templates recibidos:** Ford indicó el 22/09 que los templates del Drive detallan las entregas obligatorias. El equipo los revisó el 24/09; [resumen en el ticket](https://github.com/FordwardAI/ford-predictive-quality/issues/12#issuecomment-5823923345). Reemplazan el supuesto de la alternativa 7 en lo que definen: el formato de la entrega. La [ficha técnica](fuentes/documentation.md) sigue siendo la consigna, es decir, qué tiene que resolver la solución.
- **Contacto con Ford:** lo coordina MaximoGeorgalos.
- **Comparación contra el azar al mismo cupo del 5 %**, sin modelar costos dentro de la planta. [Resolución sobre el momento de la auditoría](https://github.com/FordwardAI/ford-predictive-quality/issues/4#issuecomment-5718463685) y [reunión con Ford del 22/09](https://github.com/FordwardAI/ford-predictive-quality/issues/5#issuecomment-5800841330).

## Qué exigen los templates

Las copias de los templates quedan fuera del repo. Acá se registra solo la estructura que piden.

| Entregable | Formato | Estructura exigida |
| --- | --- | --- |
| **Informe de la Solución** | .docx sobre el template de Ford | Carátula: desafío, equipo e integrantes (nombre, universidad, carrera, correo). Secciones: 1. Descripción del desafío. 2. Descripción de la solución: 2.1 Resumen ejecutivo (**media carilla como máximo**; es lo primero que lee el evaluador), 2.2 Especificaciones técnicas, con 2.2.1 Información complementaria, y 2.3 Seguridad y privacidad. 3. Factibilidad económica. 4. Valor diferencial e innovación. 5. Trabajo futuro, con replicabilidad. 6. Conclusiones. |
| **Presentación** | .pptx sobre el template de Ford, fechada «Octubre 2026» | Portada con desafío, equipo y tres integrantes. Las mismas secciones que el informe, salvo seguridad y privacidad, que no tiene bloque propio. Hay diapositivas genéricas con la marca Ford: no modificar los logos y usar imágenes con derechos de uso. |
| **.zip** | Adjunto | Todos los entregables que no se puedan incluir en el informe. |

**Los templates no especifican:** duración del pitch o de la demo, cantidad de diapositivas, extensión del informe (fuera del resumen ejecutivo), canal de entrega ni hora de cierre. Ver [Pendientes](#pendientes).

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

| | Entregable | Formato | Responsable | Listo cuando |
| --- | --- | --- | --- | --- |
| **E1** | Presentación | .pptx sobre el template. Una versión núcleo que entre en la mitad del tiempo objetivo, porque la duración real no se conoce. | Sin asignar; presentan los tres | Cubre las secciones del template, muestra el resultado contra el azar con su incertidumbre y declara los límites de la base ficticia. Se ensayó completa al menos una vez con cronómetro. |
| **E2** | Informe de la Solución | .docx sobre el template. Lo que se redacte en el repo sirve de borrador de sus secciones. | Sin asignar | Tiene todas las secciones del template y las cuatro partes obligatorias de la ficha en 2.2. Cada afirmación se apoya en evidencia reproducible y separa observaciones, hipótesis y decisiones. |
| **E3** | Reporte accionable: la hoja de códigos prioritarios | Reporte estático diario, definido en [¿Qué necesita ver Calidad para actuar sobre una priorización?](https://github.com/FordwardAI/ford-predictive-quality/issues/11#issuecomment-5817130432). Va resumido en el Informe 2.2.1 y completo en el .zip. | Sin asignar | Alguien de Calidad podría decidir qué auditar mirándolo, sin explicación técnica. Se genera fuera del repo: al repo va el código que lo produce, no filas por VIN. |
| **E4** | Código y evidencia reproducible | Scripts en el repo, ejecutables desde la raíz con el CSV identificado por hash. Van en el .zip o con un enlace al repo, sin datos crudos. | Sin asignar | Reproduce desde cero los números que aparecen en E1, E2 y E3, y sus pruebas pasan. |

**No es un entregable comprometido:** una aplicación o dashboard interactivo. Entra solo si sobra tiempo; ver el orden de recorte.

## Contenido por sección del informe

La mayoría de las secciones salen de decisiones ya cerradas en el mapa. Hay tres que ningún ticket cubría: **Seguridad y privacidad, Factibilidad económica y Trabajo futuro.** Se escriben durante la construcción, con la orientación de esta tabla.

| Sección | Qué contiene | Se apoya en |
| --- | --- | --- |
| 1. Descripción del desafío | El problema de elegir qué auditar después de Gate Release y el muestreo aleatorio del 5 % como referencia. | [Consigna y fuentes](../research/consigna-fuentes.md); [momento y conjunto de la auditoría](https://github.com/FordwardAI/ford-predictive-quality/issues/4#issuecomment-5718463685) |
| 2.1 Resumen ejecutivo | Qué hace la solución, cómo resuelve el desafío y por qué es viable, en media carilla. | Todo el mapa; se escribe al final |
| 2.2 Especificaciones técnicas | Las cuatro partes de la ficha: registros y variables, validación temporal, alternativas comparadas y criterio de mejora. | [Registros y variables](https://github.com/FordwardAI/ford-predictive-quality/issues/6), [validación](https://github.com/FordwardAI/ford-predictive-quality/issues/7#issuecomment-5805038014), [mejora útil](https://github.com/FordwardAI/ford-predictive-quality/issues/8#issuecomment-5801943323), [representación](https://github.com/FordwardAI/ford-predictive-quality/issues/9#issuecomment-5820084609), [alternativas](https://github.com/FordwardAI/ford-predictive-quality/issues/10#issuecomment-5820794998) |
| 2.2.1 Información complementaria | Resumen de E3 y diagramas del flujo. | [Salida para Calidad](https://github.com/FordwardAI/ford-predictive-quality/issues/11#issuecomment-5817130432) |
| 2.3 Seguridad y privacidad | Una investigación breve sobre normas de ciberseguridad y el análisis de riesgos de la solución: qué datos usa, dónde corre y quién accede. | Sin ticket: se investiga al construir |
| 3. Factibilidad económica | **Solo la factibilidad de la solución propuesta:** herramientas, costo de implementación y de mantenimiento. No incluye costos dentro de la planta (costo de auditar o de dejar pasar una falla), que siguen fuera de la métrica. | Sin ticket: se estima al construir |
| 4. Valor diferencial e innovación | Predicción de componente («dónde mirar»), grupo de control al azar del 20 %, detector de cambios por código e insumo para la subcategorización. | [Alternativas y diferencial](https://github.com/FordwardAI/ford-predictive-quality/issues/10#issuecomment-5820794998) |
| 5. Trabajo futuro | Cómo seguiría Ford: prueba en planta con sus límites (solo se conoce el resultado de lo que se audita) y replicabilidad en otras líneas o plantas. | «Not yet specified» del [mapa](https://github.com/FordwardAI/ford-predictive-quality/issues/1) |
| 6. Conclusiones | Resultado contra el azar, valor y próximos pasos. | Resultados congelados el 29/09 |

## Reparto de trabajo

**Sin responsables por persona:** el equipo decidió no asignar roles todavía (24/09). El trabajo se divide en las piezas de las tablas anteriores: E1 a E4 y las secciones del informe. Las asignaciones de tickets que ya existen en GitHub no reservan entregables. Ver [¿La especificación permite repartir el trabajo sin decisiones críticas pendientes?](https://github.com/FordwardAI/ford-predictive-quality/issues/13).

## Calendario de trabajo

Reemplaza los hitos del README, que quedaron superados. **Dos reglas:**

1. **Cada decisión abierta tiene fecha límite y un default.** Si vence sin acuerdo, se adopta la opción más simple que el ticket ya tenga documentada y se declara como supuesto.
2. **Lo que no depende de una decisión abierta arranca ya:** la estructura de la presentación, del informe y del reporte sobre sus templates. Cada día que se atrasan las decisiones sale de la construcción, no del margen final.

| Fecha | Día | Hito |
| --- | --- | --- |
| 24/09 | jue | Templates revisados y alcance cerrado. Armar el esqueleto de E1 y E2 sobre los templates. |
| 25/09 | vie | Cerrar la especificación final. Última fecha útil para integrar información de Ford, incluida la [entrevista al responsable de la selección](https://github.com/FordwardAI/ford-predictive-quality/issues/23). |
| 26–29/09 | sáb–mar | Construir: comparación con el azar, alternativas acordadas, reporte y las secciones de seguridad, factibilidad y trabajo futuro. Falta confirmar si se trabaja el fin de semana. |
| 29/09 | mar, fin del día | **Congelar resultados:** desde acá no cambian modelos ni números. |
| 30/09 | mié | Integrar resultados en E1, E2 y E3. Primer ensayo completo. |
| 1/10 | jue | Margen: correcciones, segundo ensayo, verificación de reproducibilidad y armado del .zip. |
| 2/10 | vie | Entrega y presentación. Hora de cierre pendiente. |

## Orden de recorte

Si falta tiempo o información, se recorta en este orden, empezando por lo que menos suma por hora de trabajo:

1. **Dashboard interactivo o aplicación:** queda el reporte estático, que ya cumple lo que la ficha valora.
2. **Ampliación de ML:** NB, RF, LightGBM, CatBoost, MLP, promedio, stacking, decaimiento, demostración de fuga y anexo de historial. Es el orden de [alternativas y diferencial](https://github.com/FordwardAI/ford-predictive-quality/issues/10#issuecomment-5820794998).
3. **Diferenciales prescindibles**, en este orden: subcategorización, detector de cambios por código y «aprende de sus auditorías».
4. **Ideas del [documento inicial](fuentes/ford_predictive_quality_wayfinder.md)** que no están en el núcleo, como el Predictive Quality Passport, y el análisis de qué tienen en común los VIN que no fallaron.
5. **Extensión del informe:** cada sección se reduce a lo esencial, pero ninguna queda vacía.

**No se recorta nunca:**
- Todas las secciones de los templates, incluida Innovación.
- Las cuatro partes obligatorias de la ficha.
- El núcleo de la comparación: azar, tasa fija, tasas móviles, logística y XGBoost, oráculo y lectura con etiquetas parciales.
- La comparación contra el azar al 5 % y la validación sin fuga.
- La predicción de componente y el grupo de control del 20 %, que sostienen la sección de Innovación.
- La declaración de límites y supuestos.
- Al menos un ensayo completo.

## Pendientes

| Pendiente | Quién consulta | Fecha límite | Si no se resuelve |
| --- | --- | --- | --- |
| Duración del pitch y de la demo | MaximoGeorgalos, con Ford | 25/09 | Versión núcleo que entre en la mitad del tiempo objetivo. |
| Canal de entrega y hora de cierre del 2/10 | MaximoGeorgalos, con Ford | 25/09 | Todo listo al final del 1/10. |
| ¿Se trabaja el fin de semana del 26–27/09? | Los tres | 25/09 | La construcción se reduce al 28–29/09 y el recorte empieza antes. |
| Responsables por persona | Los tres | [Especificación final](https://github.com/FordwardAI/ford-predictive-quality/issues/13) | Cada uno toma piezas sin asignar al empezar a construir y lo registra en su ticket. |

Los templates no se copian al repo: se registra solo la lista de qué se entrega, sin material confidencial.

## Qué no decide este documento

Métricas, umbrales, modelos, variables admisibles, particiones y exclusiones: cada una corresponde a su ticket. Este documento tampoco implementa ni entrena nada. Organiza qué se entrega, con qué formato y cuándo.
