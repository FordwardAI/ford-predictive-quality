# Ford Predictive Quality — organización del proyecto

**Entrega: Trials Day, viernes 2 de octubre de 2026, Planta Pacheco (presentación de ~30 minutos y entregables al cierre, a las 15:00). Equipo FordwardAI: dos integrantes de informática y uno de industrial.**

El [mapa de decisiones](https://github.com/FordwardAI/ford-predictive-quality/issues/1) llegó a su destino el 29/09/2026: una especificación ejecutable. Lo que falta es construir, y eso está ordenado en el **[plan de acción](docs/plan-de-accion.md)**: piezas de trabajo, dependencias, parámetros y criterios de aceptación. No hay calendario interno ni responsables por persona: el equipo trabaja en conjunto.

[Plan de acción](docs/plan-de-accion.md) · [Mapa canónico](https://github.com/FordwardAI/ford-predictive-quality/issues/1) · [Tablero del proyecto](https://github.com/orgs/FordwardAI/projects/1) · [Vocabulario](CONTEXT.md) · [Alcance de entrega](docs/alcance-entrega.md)

## Trabajo en equipo

Consultar [CONTRIBUTING.md](CONTRIBUTING.md) para nombres de ramas, mensajes de commit y títulos de PR.

Las [convenciones compartidas](AGENTS.md) rigen para Codex y Claude Code. La [guía de incorporación y skills](docs/trabajo-equipo.md) explica cómo retomar tickets, coordinar agentes y usar `ford-data-analysis` sobre el CSV sin subir datos crudos. Claude importa las mismas instrucciones mediante `CLAUDE.md`.

## Cómo avanzar

1. Leer el [plan de acción](docs/plan-de-accion.md) y el issue [Construir la prueba de concepto y los entregables para el Trials Day](https://github.com/FordwardAI/ford-predictive-quality/issues/33).
2. Tomar una pieza cuyas dependencias estén terminadas, marcarla en el issue y trabajarla en una rama propia.
3. Respetar las reglas del plan: el código de catálogo es el único predictor del análisis principal, todo se elige en validación y la prueba final se corre una sola vez, en conjunto y sobre el preregistro.
4. Dejar en GitHub toda la información de trabajo (código, agregados revisados y borradores). Los .docx y .pptx finales, los templates y los datos crudos quedan fuera del repo.

## Decisiones

Cada decisión vive en su ticket; el mapa las indexa en «Decisions so far» y el plan resume qué rige hoy y qué se enmendó. Las investigaciones de base son [población y etiquetas](research/poblacion-etiquetas.md), [consigna y fuentes](research/consigna-fuentes.md), [consultas a Ford](research/consultas-ford.md) y el [registro de la agrupación del catálogo](research/catalogo-agrupacion.md).

## Qué se sabe de la consigna

La ficha pide justificar el enfoque y el modelo, y describir la preparación de datos y la validación. Valora un reporte accionable y evalúa también aplicabilidad, innovación y presentación oral con soporte visual. El formato de la entrega lo fijan los templates del Drive: Informe de la Solución (.docx), presentación (.pptx) y un .zip con lo que no entre en el informe. Ver [alcance de entrega](docs/alcance-entrega.md#qué-exigen-los-templates).

La base está declarada **ficticia** y reúne solo auditados con actividad QLS. El benchmark operativo es el muestreo al azar del 5 %; la proporción CALIBRADA dentro de la base es un concepto distinto. La fuente vigente es el CSV recibido el 18 de septiembre, auditado completo; ver [identificación y reproducción](docs/datos-locales.md). Entre auditados con actividad QLS de la base ficticia hay 195.808 eventos, 59.681 VIN y 6.079 VIN CALIBRADA. Los 4.910 VIN cuya primera inspección registrada es posterior a DIA_260 son todos OK. Ford analiza una posible mejora en planta cerca de ese día, sin confirmarla; la causa no está acreditada.

## Fuentes

La fuente canónica de las decisiones es el mapa en GitHub, con sus sub-issues y dependencias nativas. Las copias locales en `.scratch/` son una instantánea de la migración y no deben usarse como un segundo tracker. La consigna y el documento inicial están en [fuentes](docs/fuentes/).
