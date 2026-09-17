# Ford Predictive Quality

Vocabulario del proceso descrito en la consigna y el documento inicial. Las relaciones temporales y la cobertura de la base se investigan por separado.

## Language

**VIN**:
Identificador de una unidad o vehículo. Un VIN puede estar asociado a múltiples eventos.
_Avoid_: Usar «registro» como sinónimo de vehículo.

**Evento de calidad**:
Registro de una incidencia, inspección o reparación asociado a un vehículo. Varias filas pueden referirse al mismo VIN; la semántica exacta y la duplicación de eventos requieren revisión.

**Gate Release**:
Instancia de validación del cumplimiento de especificaciones al finalizar las intervenciones del proceso productivo, según la consigna.

**Auditoría Adicional**:
Inspección de alta precisión posterior a Gate Release, denominada también Inspección Adicional en la consigna. Evalúa la necesidad de ajustes finos en unidades que ya cumplen los estándares de liberación.

**Recomendación de auditoría**:
Propuesta dirigida a Calidad para priorizar un VIN que acaba de aprobar Gate Release, antes de su derivación a Auditoría Adicional y con el historial disponible en ese momento. Calidad confirma la selección.

**VIN elegible para Auditoría Adicional**:
Unidad que aprobó Gate Release, sigue disponible para derivación y todavía no pasó por Auditoría Adicional.

**OK en Auditoría Adicional**:
Resultado de una auditoría sin calibración adicional. No equivale por sí solo a «no auditado» ni debe confundirse con el OK de Gate Release.

**CALIBRADA**:
Resultado que indica necesidad de calibración adicional durante la auditoría. No significa que la unidad incumpliera los estándares de Gate Release.

**Cupo de auditoría**:
Cantidad de vehículos que pueden seleccionarse para Auditoría Adicional dentro de una ventana operativa. Según el contexto del proceso aportado por el equipo, Ford selecciona actualmente el 5% mediante muestreo aleatorio; la ventana y las reglas operativas exactas quedan pendientes de confirmación de Ford.
