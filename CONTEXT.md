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

**Día del VIN**:
Última fecha de evento (DIA_n) observada para un VIN. Se usa como aproximación del día de su Auditoría Adicional, porque la base no registra esa fecha. Es un identificador de día, no una fecha de calendario.
_Avoid_: Llamarlo «fecha de auditoría».

**Cupo de auditoría**:
Cantidad de vehículos que pueden seleccionarse para Auditoría Adicional dentro de una ventana operativa, expresada como fracción de la producción que aprueba Gate Release. Ford confirmó el 22/09 que hoy selecciona el 5% de forma completamente aleatoria, sin criterio específico, y que no busca ampliar ese porcentaje por costo y capacidad. La ventana exacta no se precisó: Ford pidió basarse en el dataset entregado, por lo que queda como supuesto del equipo.

**Proporción auditada**:
Fracción de la producción que aprueba Gate Release y se deriva a Auditoría Adicional; hoy, el 5%.
_Avoid_: Confundirla con la proporción CALIBRADA.

**Proporción CALIBRADA**:
Fracción de VIN auditados cuyo resultado es CALIBRADA. En la base entregada, que reúne solo auditados y es ficticia, es 10,1858%; no es una tasa acreditada de planta.
_Avoid_: Prevalencia de planta, tasa de falla.

**Precisión en el cupo**:
Proporción CALIBRADA entre los VIN que una selección envía a Auditoría Adicional llenando el cupo completo: de cada 100 elegidos, cuántos se calibran.
_Avoid_: Precisión del modelo, sin indicar el cupo.

**Veces el azar**:
Cociente entre la precisión en el cupo de una selección y la proporción CALIBRADA del conjunto del que se eligió, que es lo que lograría en promedio la selección aleatoria. Mide cuánta dirección tiene la selección; en términos técnicos, lift.
_Avoid_: Mejora, sin indicar la referencia.

**Resultado inconcluso**:
Lectura de una evaluación cuyo rango de incertidumbre incluye la referencia del azar: la dirección observada no se distingue de la suerte. Con la base ficticia no permite separar falta de señal de etiquetas sin relación con el historial.
