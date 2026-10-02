# Diccionario de datos

Columnas del CSV QLS vigente ([datos locales](datos-locales.md)), con los nombres técnicos originales. Lo que no está confirmado se indica en cada fila. El resultado y el componente de la Auditoría Adicional nunca son predictores ([CONTEXT.md](../CONTEXT.md)).

| Nombre | Descripción |
| --- | --- |
| VIN | Identificador único del vehículo. Un VIN puede tener varios eventos de calidad. |
| INSPECTOR | Inspector que registró el defecto en el punto de recolección (Collection Point). |
| Hora Inspección | Hora registrada de la inspección del evento de calidad. La unidad de la representación numérica no está confirmada. |
| Fecha Inspección | Día registrado de la inspección, anonimizado como DIA_n; no es una fecha de calendario ni la fecha de Auditoría Adicional. |
| CP | Collection Point: punto donde se registró el defecto. No se dispone de un diccionario de sus códigos. |
| Sec.CP | Sector donde se registró el defecto. |
| CP Grupo Trabajo Reporta | Grupo de trabajo que reportó el defecto. |
| CP Zona Reporta | Zona que reportó el defecto. |
| Componente Inspección | Componente que presentó el defecto en la verificación de calidad. |
| UC Nombre Incidencia | Incidencia o defecto que presentó el componente de inspección. |
| UC Nombre Tipo Incidencia | Detalle del tipo de incidencia registrado en la inspección. |
| UC Nombre Posicion A | Detalle de ubicación de la incidencia, posición A. No se dispone de la definición de sus valores. |
| UC Nombre Posicion B | Detalle de ubicación de la incidencia, posición B. No se dispone de la definición de sus valores. |
| UC Nombre Posicion C | Detalle de ubicación de la incidencia, posición C. No se dispone de la definición de sus valores. |
| UC Nombre Grupo Posicion C | Grupo de ubicación asociado a la posición C de la incidencia. No se dispone de la definición de sus valores. |
| UC Nombre Posición D | Detalle de ubicación de la incidencia, posición D. No se dispone de la definición de sus valores. |
| UC Nombre Grupo Posición D | Grupo de ubicación asociado a la posición D de la incidencia. No se dispone de la definición de sus valores. |
| UC Posición Arbitraria | Detalle de ubicación de la incidencia registrado como posición arbitraria. Su codificación no está confirmada. |
| CCC | Customer Concern Code: código funcional específico del defecto; aporta el mayor detalle dentro de la clasificación VRT/VFG/CCC. No se dispone del diccionario de códigos. |
| VFG | Vehicle Function Group: código funcional del defecto por componente; corresponde a un subconjunto de VRT. No se dispone del diccionario de códigos. |
| VRT | Variable Reduction Team: código funcional del defecto por área o equipo funcional. No se dispone del diccionario de códigos. |
| UC Nombre PUL a Reparar | Grupo vinculado a la reparación del defecto. La cabecera lo describe como el grupo que reparó, aunque el nombre indica «a Reparar»; no está confirmado si representa asignación o ejecución. |
| Fecha Reparación | Día registrado de la reparación del defecto, anonimizado como DIA_n. No es una fecha de calendario ni la fecha de Auditoría Adicional. |
| Hora Reparación | Hora registrada de la reparación del defecto. La unidad de la representación numérica no está confirmada. |
| Código de Reparador | Código que identifica al reparador. No se dispone del diccionario de códigos. |
| Rep PUL | Subgrupo que reparó el defecto, según la descripción de la cabecera. Ford define PUL como el equipo de reparación. |
| Rep Parte Causal | Parte reparada, según la descripción de la cabecera. No está confirmado si identifica además la causa del defecto. |
| Rep.incid. | Defecto reparado. |
| Rep.Tipo Incid. | Detalle adicional del tipo de incidencia en la reparación. |
| Rep.PosA | Detalle de ubicación de la reparación, posición A. No se dispone de la definición de sus valores. |
| Rep.PosB | Detalle de ubicación de la reparación, posición B. No se dispone de la definición de sus valores. |
| Rep.PosC | Detalle de ubicación de la reparación, posición C. No se dispone de la definición de sus valores. |
| Rep.Grp.PosC | Grupo de ubicación asociado a la posición C de la reparación. No se dispone de la definición de sus valores. |
| Rep Nombre Posición D | Detalle de ubicación de la reparación, posición D. No se dispone de la definición de sus valores. |
| Rep Nombre Grupo Posición D | Grupo de ubicación asociado a la posición D de la reparación. No se dispone de la definición de sus valores. |
| Rep.Pos.arbit | Detalle de ubicación de la reparación registrado como posición arbitraria. Su codificación no está confirmada. |
| Rep Respuesta a Pregunta Remplazar | Indica si se reemplazó el componente durante la reparación: Y = sí; N = no. |
| Rep Respuesta a Pregunta Desensamblar | El nombre alude a una respuesta sobre desensamblar durante la reparación, pero su significado y valores no están confirmados. Su descripción en la cabecera está desalineada y corresponde al resultado de Auditoría Adicional. |
| Código de Catálogo | Código del vehículo que representa versión y características, incluido el mercado de destino. La agrupación recibida asigna familia, motor dominante, tracción, versión dominante y mercado a cada código; motor y versión dominantes no son datos exactos de cada vehículo. |
| Auditoría Adicional | Resultado de la auditoría posterior a Gate Release: OK = no necesitó calibración adicional; CALIBRADA = necesitó calibración adicional. OK no significa «no auditado». La descripción de esta columna en la cabecera está desalineada. |
| Componente Auditoría Adicional | Componente calibrado durante la Auditoría Adicional. En la base está presente para CALIBRADA y vacío para OK; revela el resultado y no debe usarse como predictor de ese resultado. |
