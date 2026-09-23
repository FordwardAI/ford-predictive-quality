# Alcance de entrega y reparto de trabajo

Borrador del 23 de septiembre de 2026 para [¿Qué alcance de entrega y reparto de trabajo se compromete para el 2 de octubre?](https://github.com/FordwardAI/ford-predictive-quality/issues/12).

**Estado: propuesta pendiente de acuerdo del equipo.** Salvo la sección «Ya acordado», nada de lo que sigue está decidido. Responsables, fechas y orden de recorte son propuestas para discutir entre los tres. Este documento no resuelve el ticket.

## Ya acordado

- **Fecha de entrega:** viernes 2 de octubre de 2026. [Consigna y fuentes](../research/consigna-fuentes.md#evidencia-y-autoridad).
- **Equipo:** tres integrantes, dos de informática y uno de industrial.
- **Sin templates, rige la alternativa 7:** Ford indicó el 22/09 que los templates de presentaciones anteriores del Drive detallan las entregas obligatorias. El equipo todavía no los tiene. Mientras falten, el equipo fija entregables y duración **como supuesto propio y no como requisito de Ford**, dimensionados a lo que la ficha exige, sin inventar formatos ni comprometer una aplicación. [Consultas a Ford](../research/consultas-ford.md), consulta 7; alternativa aceptada el 18/09.
- **Contacto con Ford:** lo coordina MaximoGeorgalos.
- **Comparación contra el azar al mismo cupo del 5%**, sin modelar costos. [Resolución sobre el momento de la auditoría](https://github.com/FordwardAI/ford-predictive-quality/issues/4#issuecomment-5718463685) y [reunión con Ford del 22/09](https://github.com/FordwardAI/ford-predictive-quality/issues/5#issuecomment-5800841330).

## Qué exige la ficha técnica

Fuente: [ficha técnica del desafío](fuentes/documentation.md), secciones «Base de Datos» y «Criterios de Evaluación». Es la referencia más cercana a una lista de entregables mientras no estén los templates.

| Elemento | Carácter según la ficha | Criterio de evaluación que lo mide |
| --- | --- | --- |
| Enfoque metodológico y lógica conceptual | **Obligatorio** («deberá detallar») | Justificación de la solución |
| Elección del modelo frente a otras alternativas | **Obligatorio** | Justificación de la solución |
| Preparación de los datos | **Obligatorio** | Rigor técnico y validación |
| Esquema de validación que demuestre efectividad | **Obligatorio** | Rigor técnico y validación; capacidad de predicción |
| Exposición oral ante el jurado con soporte visual | **Evaluado** como criterio, no enunciado como entregable | Presentación y speech |
| Dashboard o reporte accionable: predicciones, unidades priorizadas, variables de mayor impacto | **Valorado** («se valorará»), no obligatorio | Aplicabilidad e impacto |

**La ficha no especifica:** si la propuesta es un documento escrito o va dentro de la presentación, duración del pitch o de la demo, cantidad de diapositivas, si se entrega código o modelo, canal de entrega ni hora de cierre. Tampoco pondera los criterios.

## Entregables propuestos

Supuesto del equipo según la alternativa 7. Si los templates llegan y dicen otra cosa, esta tabla se ajusta.

| | Entregable | Carácter | Formato propuesto | Responsable propuesto | Listo cuando |
| --- | --- | --- | --- | --- | --- |
| **E1** | Presentación | Obligatorio en la práctica | Diapositivas. Una versión núcleo que entre en la mitad del tiempo objetivo, porque la duración real no se conoce. | Coordina MaximoGeorgalos; presentan los tres | Cubre las cuatro partes obligatorias, muestra el resultado contra el azar con su incertidumbre y declara los límites de la base ficticia. Se ensayó completa al menos una vez con cronómetro. |
| **E2** | Propuesta metodológica | Contenido obligatorio; formato supuesto | Documento breve en el repo, que además sirve de respaldo y anexo de E1 | Informática; industrial revisa proceso y aplicabilidad | Cubre las cuatro partes obligatorias. Cada afirmación enlaza evidencia reproducible y separa observaciones, hipótesis y decisiones. |
| **E3** | Reporte accionable | Valorado | Reporte estático: unidades priorizadas del conjunto de evaluación, motivos y comparación con el azar al 5%. Su contenido lo define [¿Qué necesita ver Calidad para actuar sobre una priorización?](https://github.com/FordwardAI/ford-predictive-quality/issues/11). | MaximoGeorgalos, con informática | Alguien de Calidad podría decidir qué auditar mirándolo, sin explicación técnica. Se genera fuera del repo; al repo va el código que lo produce, no filas por VIN. |
| **E4** | Código y evidencia reproducible | Interno: no lo exige Ford | Scripts en el repo, ejecutables desde la raíz con el CSV identificado por hash | Informática | Reproduce desde cero los números que aparecen en E1, E2 y E3, y sus pruebas pasan. |

**No son entregables comprometidos:** una aplicación o dashboard interactivo, y las ideas de innovación del [documento inicial](fuentes/ford_predictive_quality_wayfinder.md), como el Predictive Quality Passport. Entran solo si sobra tiempo; ver el orden de recorte.

## Responsables propuestos

Se deduce de las asignaciones actuales en GitHub y de los roles del [README](../README.md#reparto-sugerido). **No está acordado:** cada persona confirma o cambia su fila.

| Persona | Frente | Decisiones del mapa | Entregables |
| --- | --- | --- | --- |
| MaximoGeorgalos — industrial | Proceso, contacto con Ford, alcance y salida para Calidad | Alcance de entrega (asignado); [salida para Calidad](https://github.com/FordwardAI/ford-predictive-quality/issues/11) (propuesto) | Coordina E1; E3 |
| mateoserebrinsky — informática | Datos | [Registros y variables admisibles](https://github.com/FordwardAI/ford-predictive-quality/issues/6) (asignado); [representación del historial](https://github.com/FordwardAI/ford-predictive-quality/issues/9) (propuesto) | E2, parte de datos; E4 |
| Facundo-Lanusse — informática | Evaluación y modelado | [Mejora útil frente al azar](https://github.com/FordwardAI/ford-predictive-quality/issues/8) (asignado); [validación sin fuga](https://github.com/FordwardAI/ford-predictive-quality/issues/7) y [alternativas predictivas](https://github.com/FordwardAI/ford-predictive-quality/issues/10) (propuesto) | E2, parte de modelo y validación; E4 |

La [especificación final](https://github.com/FordwardAI/ford-predictive-quality/issues/13) la verifican los tres.

## Calendario propuesto

**El problema.** Los hitos del README ubicaban el cierre de la especificación el 19–20/09 y la construcción entre el 21 y el 25. Al 23/09 siguen abiertas seis decisiones antes de construir (admisibilidad, validación, mejora útil, representación, alternativas y salida para Calidad), y la cadena más larga, admisibilidad → validación → representación → alternativas, no empezó. Quedan nueve días.

**Dos reglas propuestas para que entre:**

1. **Cada decisión abierta tiene fecha límite y un default.** Si vence sin acuerdo, se adopta la opción más simple que el ticket ya tenga documentada, declarada como supuesto. Es el mismo mecanismo que funcionó con las consultas a Ford.
2. **Lo que no depende de una decisión abierta arranca ya:** la estructura de la presentación, del documento y del reporte. Cada día que se atrasan las decisiones sale de la construcción, no del margen final.

| Fecha | Día | Hito propuesto |
| --- | --- | --- |
| 23–24/09 | mié–jue | Cerrar admisibilidad, mejora útil y alcance de entrega. Conseguir los templates. Armar la estructura de E1 y E2. |
| 25/09 | vie | Cerrar validación, representación, alternativas y salida para Calidad en versión acotada, y la especificación final. Última fecha útil para integrar información de Ford o de los templates. |
| 26–29/09 | sáb–mar | Construir: comparación con el azar, alternativas acordadas y reporte. El fin de semana está pendiente de confirmar. |
| 29/09 | mar, fin del día | **Congelar resultados:** desde acá no cambian modelos ni números. |
| 30/09 | mié | Integrar resultados en E1, E2 y E3. Primer ensayo completo. |
| 1/10 | jue | Margen: correcciones, segundo ensayo y verificación de reproducibilidad. |
| 2/10 | vie | Entrega y presentación. Hora de cierre pendiente. |

## Orden de recorte propuesto

Si falta tiempo o información, se recorta en este orden, empezando por lo que menos suma por hora de trabajo:

1. **Dashboard interactivo o aplicación:** queda el reporte estático, que ya cumple lo que la ficha valora.
2. **Ideas de innovación del documento inicial:** Passport, predicción de componente, anomalías, aprendizaje continuo.
3. **Análisis de qué tienen en común los VIN que no fallaron.** Ford mostró interés en la reunión del 22/09 ([contexto en la salida para Calidad](https://github.com/FordwardAI/ford-predictive-quality/issues/11)). Sumaría a Innovación, pero no está acordado.
4. **Cantidad de alternativas predictivas:** se reduce a la comparación contra el azar, una alternativa principal y una referencia simple.
5. **Extensión de E2:** pasa a versión breve y lo esencial va en la presentación.

**No se recorta nunca (propuesta):** las cuatro partes obligatorias de la propuesta, la comparación contra el azar al 5%, la validación sin fuga, la declaración de límites y supuestos, y al menos un ensayo completo.

## Pendientes

| Pendiente | Responsable propuesto | Fecha límite | Si no se resuelve |
| --- | --- | --- | --- |
| Templates del Drive: lista oficial de entregables | MaximoGeorgalos | 25/09 | Rige la tabla de entregables de este documento como supuesto (alternativa 7). |
| Duración del pitch y de la demo | MaximoGeorgalos, junto con los templates | 25/09 | Versión núcleo que entre en la mitad del tiempo objetivo. |
| Canal de entrega y hora de cierre del 2/10 | MaximoGeorgalos | 25/09 | Todo listo al final del 1/10. |
| ¿Se trabaja el fin de semana del 26–27/09? | Los tres | Al acordar este documento | La construcción se reduce al 28–29/09 y el recorte empieza antes. |
| Formato de la propuesta: documento aparte o dentro de la presentación | Los tres | Al acordar este documento | Documento breve más presentación, como en E2. |
| Ford dijo que la clave es «detectar qué componente presentó la falla y a qué área está asociado». ¿Cambia lo que debe mostrar la salida? | Mejora útil y salida para Calidad | Con esos tickets | Se mantiene la priorización de VIN como salida principal. |

Los templates no se copian al repo: se registra solo la lista de qué se entrega, sin material confidencial.

## Qué no decide este documento

Métricas, umbrales, criterio de resultado inconcluso, modelos, variables admisibles, particiones y exclusiones: cada una corresponde a su ticket. Este documento tampoco implementa ni entrena nada. Organiza qué se entrega, quién lo hace y cuándo.
