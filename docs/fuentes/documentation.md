Ford Innovation Challenge III

IA Edition

Detalle de Desafío

Área: Calidad

Mentor: Haure, Pablo – Rabaza, Fernando

SPOC: Gonzalez Buzaglo, Martina

Fecha: 23/7/26

# Índice general

1. [Descripción General del Pain Point](#_bookmark0) 3
   1. [Título del Pain Point](#_bookmark1) 3
   2. [Resumen Ejecutivo](#_bookmark2) 3
2. [Contexto del Proceso](#_bookmark3) 4
   1. [Descripción del Proceso Actual](#_bookmark4) 4
   2. [Ubicación en Planta / Flujo](#_bookmark5) 4
3. [Definición del Desafío](#_bookmark6) 5
   1. [Desafío Específico](#_bookmark7) 5
   2. [Impacto Operativo](#_bookmark8) 5
4. [Datos Técnicos Relevantes](#_bookmark9) 6
   1. [Parámetros Operativos](#_bookmark10) 6
   2. Base de Datos 6
5. [Expectativas de Solución](#_bookmark13) 7
   1. [Objetivo de Mejora](#_bookmark14) 7
   2. [Criterios de Evaluación](#_bookmark15) 7
6. [Información Complementaria](#_bookmark16) 8
   1. [Documentación Disponible](#_bookmark17) 8
   2. [Referentes Técnicos](#_bookmark18) 8
   3. [Consideraciones de Seguridad](#_bookmark19) 8
7. [Anexos](#_bookmark20) 9

## Título del Desafío

Data-Driven Predictive Quality

## Resumen Ejecutivo

Desarrollo de un modelo predictivo capaz de analizar datos industriales e identificar patrones. Ello nos permitirá predecir qué unidades se beneficiarán de una revisión preventiva de precisión antes de su liberación final.

## Descripción del Proceso Actual

La Planta Pacheco cuenta con un sistema de registro integral —el QLS (Quality Leadership System)— que documenta la trazabilidad y el historial detallado de cada unidad a lo largo de los procesos de producción en Carrocería, Pintura y Montaje. En este registro se consolida información operativa clave, como los tiempos de permanencia en estación, el historial de reparaciones, los registros de controles automáticos y los registros de inspectores. Este esquema garantiza que, al finalizar el proceso productivo, la validación de liberación (Gate Release) verifique que el vehículo cumpla estrictamente con todas las especificaciones y estándares de ingeniería.

En la etapa previa al egreso de planta, se realiza una Inspección Adicional de alta precisión por muestreo. Aun estando todas las unidades dentro de los parámetros normativos ('OK'), este control evalúa micro-variaciones del proceso para derivar a verificación y ajuste fino a aquellas que exhiban desvíos sutiles respecto al estándar nominal.

## Ubicación en Planta / Flujo

A lo largo de la línea de manufactura en Planta Pacheco, cada unidad atraviesa etapas clave hasta su liberación. El modelo predictivo a desarrollar se integrará específicamente en la instancia de **Inspección Adicional.**

![](data:image/png;base64...)

Un desafío central en nuestra planta es comprender la interacción profunda entre las múltiples variables del proceso de Producción. Buscamos impulsar nuestra evolución tecnológica mediante el desarrollo de un modelo de Data Driven Predictive Quality capaz de identificar patrones analíticos complejos, transformando datos en información accionable para asistir en la toma de decisiones preventivas y mantener nuestros estándares de calidad en el rango óptimo de excelencia.

## Desafío Específico

Nuestro proceso de manufactura se destaca por su alta tecnología, trazabilidad y precisión, garantizando que cada vehículo cumpla estrictamente con los estándares de ingeniería antes de su liberación. A lo largo de la línea de producción, nuestro sistema de trazabilidad (QLS) registra continuamente miles de parámetros operativos, tiempos de ciclo y el historial de reparaciones de cada vehículo. Una vez completadas las intervenciones necesarias, las unidades avanzan hacia la instancia de Gate Release, donde se valida el cumplimiento de las especificaciones y se define su condición (OK / NO OK). Posteriormente, los vehículos ingresan a la etapa de Inspección Adicional por muestreo (5%), donde se evalúan micro-desviaciones respecto a la media del proceso para ejecutar los ajustes y calibraciones de alta precisión correspondientes. El objetivo de este desafío es desarrollar un modelo predictivo capaz de analizar el flujo de datos del QLS, identificar patrones complejos y predecir de forma anticipada qué unidades requerirán calibración fina en la Inspección Adicional. De este modo, se busca transformar la inspección en un proceso focalizado y proactivo, optimizando los tiempos de ciclo y maximizando la eficiencia operativa.

## Impacto Operativo

La implementación de un modelo de Calidad Predictiva permitiría focalizar las inspecciones de alta precisión exclusivamente en aquellas unidades identificadas por el modelo, agilizar el flujo productivo, minimizar los tiempos de espera y ajuste fino, e incrementar la eficiencia operativa general de la planta, asegurando una liberación ágil y garantizando los más altos estándares de excelencia en cada vehículo entregado.

## Parámetros Operativos

Los parámetros operativos serán brindados por separado a través del responsable del área.

## Base de Datos

**Disclaimer: La base de datos adjuntada es una base ficticia generada especialmente a los efectos del presente desafío.**

Todos los instrumentales de medición son relevados y volcados en una hoja de registro. Los mismos serán compartidos días después de esta ficha técnica. Aproximadamente 190.000 valores.

Se espera el desarrollo de una solución de Inteligencia Artificial y Analítica Predictiva capaz de procesar el historial de trazabilidad del sistema QLS (tiempos de permanencia en estación, registros operativos, historial de reparaciones y otras variables que se consideren relevantes). Mediante el análisis de estos datos, el sistema deberá identificar patrones y anticipar con alta precisión qué unidades requerirán ajustes finos durante la etapa de Inspección Adicional.

La propuesta deberá detallar el enfoque metodológico adoptado, explicando la lógica conceptual detrás del desarrollo y fundamentando la elección del modelo seleccionado frente a otras alternativas técnicas. Asimismo, se deberá describir el proceso de preparación de los datos y el esquema de validación que demuestre la efectividad del algoritmo. Como complemento, se valorará la inclusión de una interfaz o mecanismo visual (dashboard o reporte accionable) que presente las predicciones de forma clara, identifique las unidades priorizadas y visibilice las variables de mayor impacto en el resultado, facilitando la toma de decisiones ágiles y proactivas en el entorno productivo.

## Criterios de Evaluación

*Las propuestas se evaluarán según los siguientes aspectos:*

* ***Rigor técnico y validación:*** *Calidad en el procesamiento de los datos del QLS, solidez del algoritmo y efectividad de las métricas utilizadas para medir su precisión.*
* ***Justificación de la solución:*** *Claridad para explicar el razonamiento detrás del desarrollo y fundamentar por qué se eligió ese modelo frente a otras alternativas.*
* ***Capacidad de predicción:*** *Precisión del modelo para anticipar qué unidades requerirán calibración en la Inspección Adicional.*
* ***Aplicabilidad e impacto:*** *Viabilidad para integrar la solución en la planta y utilidad de las herramientas visuales (dashboards o reportes) para la toma de decisiones.*
* ***Innovación:*** *Creatividad en el análisis de variables y en el enfoque de la solución.*
* ***Presentación y speech:*** *Claridad, síntesis y solvencia en la exposición oral ante el jurado, respaldada por un soporte visual claro y profesional.*

## Documentación Disponible

Adjunta en el .ZIP

## Referentes Técnicos

Mentor: Haure, Pablo - phaure@ford.com

Mentor: Rabaza, Fernando - frabaza@ford.com

SPOC: Gonzalez Buzaglo, Martina – mgonz521@ford.com
