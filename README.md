# Ford Predictive Quality — organización del proyecto

**Entrega del proyecto terminado: 2 de octubre de 2026. Equipo: dos integrantes de informática y uno de industrial.**

Este espacio organiza las decisiones para llegar a una especificación que el equipo pueda ejecutar. El alcance del mapa y la fecha están confirmados; responsables individuales, hitos internos y recortes que se sugieren abajo todavía deben acordarse.

[Mapa canónico](https://github.com/FordwardAI/ford-predictive-quality/issues/1) · [Tablero del proyecto](https://github.com/orgs/FordwardAI/projects/1) · [Vocabulario](CONTEXT.md)

## Cómo avanzar

1. Leer las investigaciones ya terminadas: [población y etiquetas](research/poblacion-etiquetas.md) y [consigna y fuentes](research/consigna-fuentes.md).
2. Preparar la reunión con Ford usando [conclusiones preliminares y consultas priorizadas](research/consultas-ford.md). El equipo ya pidió la reunión por correo y consultó por datos operativos numéricos y diccionarios; espera respuesta. El ticket **Qué aclaraciones pedir a Ford y cómo avanzar si no llegan** sigue en curso. En paralelo, acordar el alcance de entrega a partir de la lectura de la consigna ya terminada.
3. Resolver admisibilidad de datos, validación y medida de éxito antes de elegir representación y modelos.
4. Precisar la salida que necesita Calidad y cerrar una especificación con responsables y criterios de aceptación.

Las dependencias indican qué decisiones deben estar resueltas para cerrar otra; no impiden preparar preguntas o reunir evidencia antes. Un ticket resuelto es una decisión o investigación documentada, no una funcionalidad construida.

## Tickets y dependencias

Vista de navegación al 17 de septiembre de 2026. El estado y las dependencias canónicos viven en GitHub; esta tabla es una instantánea.

| Decisión o investigación | Estado | Depende de | Participación sugerida |
| --- | --- | --- | --- |
| [¿Qué población y etiquetas representa la base entregada?](https://github.com/FordwardAI/ford-predictive-quality/issues/2) | Resuelta | Sin bloqueantes | Informática — datos |
| [¿Qué exige la consigna y qué fuentes están disponibles?](https://github.com/FordwardAI/ford-predictive-quality/issues/3) | Resuelta | Sin bloqueantes | Informática — documentación, con revisión de industrial |
| [¿Cuándo y sobre qué conjunto de VIN se decide la auditoría?](https://github.com/FordwardAI/ford-predictive-quality/issues/4) | Resuelta | Sin bloqueantes | Industrial, con el equipo |
| [¿Qué aclaraciones pedir a Ford y cómo avanzar si no llegan?](https://github.com/FordwardAI/ford-predictive-quality/issues/5) | Abierta | [¿Qué población y etiquetas representa la base entregada?](https://github.com/FordwardAI/ford-predictive-quality/issues/2)<br>[¿Qué exige la consigna y qué fuentes están disponibles?](https://github.com/FordwardAI/ford-predictive-quality/issues/3)<br>[¿Cuándo y sobre qué conjunto de VIN se decide la auditoría?](https://github.com/FordwardAI/ford-predictive-quality/issues/4) | Industrial, con informática para evidencia |
| [¿Qué registros y variables son admisibles para el experimento?](https://github.com/FordwardAI/ford-predictive-quality/issues/6) | Abierta | [¿Qué población y etiquetas representa la base entregada?](https://github.com/FordwardAI/ford-predictive-quality/issues/2)<br>[¿Cuándo y sobre qué conjunto de VIN se decide la auditoría?](https://github.com/FordwardAI/ford-predictive-quality/issues/4)<br>[¿Qué aclaraciones pedir a Ford y cómo avanzar si no llegan?](https://github.com/FordwardAI/ford-predictive-quality/issues/5) | Informática — datos, con industrial |
| [¿Qué validación permite evaluar el uso propuesto sin fuga de información?](https://github.com/FordwardAI/ford-predictive-quality/issues/7) | Abierta | [¿Qué registros y variables son admisibles para el experimento?](https://github.com/FordwardAI/ford-predictive-quality/issues/6) | Informática — evaluación |
| [¿Qué cuenta como una mejora útil frente al muestreo aleatorio?](https://github.com/FordwardAI/ford-predictive-quality/issues/8) | Abierta | [¿Qué población y etiquetas representa la base entregada?](https://github.com/FordwardAI/ford-predictive-quality/issues/2)<br>[¿Cuándo y sobre qué conjunto de VIN se decide la auditoría?](https://github.com/FordwardAI/ford-predictive-quality/issues/4) | Equipo completo |
| [¿Cómo representar el historial de un VIN con la información admisible?](https://github.com/FordwardAI/ford-predictive-quality/issues/9) | Abierta | [¿Qué registros y variables son admisibles para el experimento?](https://github.com/FordwardAI/ford-predictive-quality/issues/6)<br>[¿Qué validación permite evaluar el uso propuesto sin fuga de información?](https://github.com/FordwardAI/ford-predictive-quality/issues/7) | Informática — datos y modelado |
| [¿Qué alternativas predictivas y qué diferencial vale la pena evaluar?](https://github.com/FordwardAI/ford-predictive-quality/issues/10) | Abierta | [¿Qué exige la consigna y qué fuentes están disponibles?](https://github.com/FordwardAI/ford-predictive-quality/issues/3)<br>[¿Qué validación permite evaluar el uso propuesto sin fuga de información?](https://github.com/FordwardAI/ford-predictive-quality/issues/7)<br>[¿Qué cuenta como una mejora útil frente al muestreo aleatorio?](https://github.com/FordwardAI/ford-predictive-quality/issues/8)<br>[¿Cómo representar el historial de un VIN con la información admisible?](https://github.com/FordwardAI/ford-predictive-quality/issues/9) | Informática — modelado, con industrial |
| [¿Qué necesita ver Calidad para actuar sobre una priorización?](https://github.com/FordwardAI/ford-predictive-quality/issues/11) | Abierta | [¿Cuándo y sobre qué conjunto de VIN se decide la auditoría?](https://github.com/FordwardAI/ford-predictive-quality/issues/4)<br>[¿Qué cuenta como una mejora útil frente al muestreo aleatorio?](https://github.com/FordwardAI/ford-predictive-quality/issues/8) | Industrial, con informática |
| [¿Qué alcance de entrega y reparto de trabajo se compromete para el 2 de octubre?](https://github.com/FordwardAI/ford-predictive-quality/issues/12) | Abierta | [¿Qué exige la consigna y qué fuentes están disponibles?](https://github.com/FordwardAI/ford-predictive-quality/issues/3) | Equipo completo |
| [¿La especificación permite repartir el trabajo sin decisiones críticas pendientes?](https://github.com/FordwardAI/ford-predictive-quality/issues/13) | Abierta | [¿Qué aclaraciones pedir a Ford y cómo avanzar si no llegan?](https://github.com/FordwardAI/ford-predictive-quality/issues/5)<br>[¿Qué validación permite evaluar el uso propuesto sin fuga de información?](https://github.com/FordwardAI/ford-predictive-quality/issues/7)<br>[¿Qué cuenta como una mejora útil frente al muestreo aleatorio?](https://github.com/FordwardAI/ford-predictive-quality/issues/8)<br>[¿Cómo representar el historial de un VIN con la información admisible?](https://github.com/FordwardAI/ford-predictive-quality/issues/9)<br>[¿Qué alternativas predictivas y qué diferencial vale la pena evaluar?](https://github.com/FordwardAI/ford-predictive-quality/issues/10)<br>[¿Qué necesita ver Calidad para actuar sobre una priorización?](https://github.com/FordwardAI/ford-predictive-quality/issues/11)<br>[¿Qué alcance de entrega y reparto de trabajo se compromete para el 2 de octubre?](https://github.com/FordwardAI/ford-predictive-quality/issues/12) | Equipo completo |

## Reparto sugerido

| Frente | Liderazgo propuesto | Resultado esperado |
| --- | --- | --- |
| Proceso y consultas a Ford | Industrial | Instante de selección, capacidad, interpretación operativa y respuestas de mentores. |
| Datos | Informática A | Evidencia de población, calidad y disponibilidad temporal de campos; representación admisible. |
| Evaluación y modelado | Informática B | Protocolo de evaluación y comparación de alternativas, sin contaminar la evaluación final. |
| Alcance, salida y presentación | Los tres | Explicación consistente del problema, evidencia y propuesta de uso. |

Informática A/B son posiciones provisionales, no personas asignadas. Ningún rol sugerido reserva un ticket.

## Hitos propuestos para proteger la entrega

Esta secuencia es una propuesta organizativa, no un calendario aprobado ni una resolución de los tickets. El trabajo de construcción comienza después de cerrar las decisiones que lo condicionan.

| Fechas de 2026 | Hito propuesto |
| --- | --- |
| 16–18 de septiembre | Confirmar alcance, población, proceso y consultas críticas a mentores. |
| 19–20 de septiembre | Cerrar especificación y protocolo; definir una alternativa si falta información. |
| 21–25 de septiembre | Construir y comparar las alternativas acordadas; preparar una salida mínima. |
| 26–28 de septiembre | Integrar resultados y evaluar según el protocolo; documentar límites. |
| 29 de septiembre–1 de octubre | Consolidar entregables, revisar reproducibilidad y ensayar presentación. |
| 2 de octubre | Presentar el proyecto terminado. |

El ticket de alcance debe fijar responsables reales, formatos, hora de cierre, margen y qué se recorta primero.

## Qué se sabe de la consigna

La ficha pide justificar el enfoque y el modelo, describir la preparación de datos y la validación. Valora una interfaz o reporte accionable y evalúa también aplicabilidad, innovación y presentación oral con soporte visual. No debemos inventar formatos de entrega que la fuente no especifica.

La base está declarada **ficticia**. El benchmark operativo propuesto es el muestreo del 5%; la fracción de unidades CALIBRADA dentro de la base es un concepto distinto. Los informes separan lo observado de lo que sigue pendiente de Ford. Se verificaron 195.808 eventos, 59.681 VIN y 6.079 VIN CALIBRADA. Los 4.910 VIN cuya primera inspección registrada es posterior a DIA_260 son todos OK; existen eventos positivos posteriores de VIN anteriores. La causa sigue abierta.

## Cómo retomar

Abrir el mapa y elegir el primer ticket abierto, no asignado y sin bloqueantes abiertos. Tras resolver el momento y la población de selección, quedan disponibles las decisiones sobre consultas a Ford, mejora útil frente al muestreo aleatorio y alcance de entrega. Reclamarlo antes de trabajar; cerrar un ticket de conversación solo con una decisión explícita del equipo. Al resolver, conservar la respuesta en el ticket y añadir un enlace resumido al mapa. Consultar las skills indicadas en sus Notes.

La fuente canónica es el mapa en GitHub, con sus sub-issues y dependencias nativas. Las copias locales en `.scratch/` son una instantánea de la migración y no deben usarse como un segundo tracker. La consigna y el documento inicial están en [fuentes](docs/fuentes/).
