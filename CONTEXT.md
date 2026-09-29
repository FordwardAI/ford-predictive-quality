# Ford Predictive Quality

Vocabulario del proceso descrito en la consigna y el documento inicial. Las relaciones temporales y la cobertura de la base se investigan por separado.

## Language

**VIN**:
Identificador de una unidad o vehículo. Un VIN puede estar asociado a múltiples eventos.
_Avoid_: Usar «registro» como sinónimo de vehículo.

**Evento de calidad**:
Incidencia registrada en la verificación de calidad sobre un vehículo, junto con su reparación. La inspección y la reparación de una incidencia forman un solo evento, no dos. Un VIN puede tener varios eventos; el conjunto de sus eventos es su historial. La causa de los eventos repetidos exactamente sigue sin conocerse.
_Avoid_: Contar la inspección y la reparación como eventos separados; usar la cantidad de eventos como sinónimo de riesgo del VIN.

**Verificación de calidad**:
Etapa del proceso productivo, anterior a Gate Release, por la que pasan todos los vehículos y en la que se registran los eventos de calidad.
_Avoid_: «Calidad» a secas para nombrar la etapa.

**Gate Release**:
Instancia de validación del cumplimiento de especificaciones al finalizar las intervenciones del proceso productivo, según la consigna.

**Auditoría Adicional**:
Inspección de alta precisión posterior a Gate Release, denominada también Inspección Adicional en la consigna. Evalúa la necesidad de ajustes finos en unidades que ya cumplen los estándares de liberación.

**Responsable de la selección**:
Persona que elige, entre los vehículos que aprobaron Gate Release, cuáles se derivan a Auditoría Adicional. Hoy los elige al azar.
_Avoid_: «Calidad» a secas para nombrar a quien selecciona.

**Recomendación de auditoría**:
Propuesta dirigida al responsable de la selección para priorizar vehículos que acaban de aprobar Gate Release, antes de su derivación a Auditoría Adicional y con la información disponible en ese momento. El responsable de la selección decide cuántos y cuáles se derivan.

**Agrupación del catálogo**:
Atributos asignados a cada código de catálogo en el archivo recibido el 29/09: familia y motor dominante, tracción, versión dominante y mercado. Son atributos del código, no de cada vehículo. «Dominante» sugiere el valor mayoritario del código; el archivo no lo aclara.
_Avoid_: Leer motor o versión como dato exacto de cada vehículo.

**Hoja de códigos prioritarios**:
Forma diaria de la recomendación de auditoría: los códigos de catálogo ordenados por su tasa reciente del código, con rango, vehículos programados y acumulado. Prioriza códigos, no vehículos: dentro de un código los vehículos son equivalentes.
_Avoid_: Ranking de VIN, lista de unidades.

**Tasa reciente del código**:
Proporción CALIBRADA entre los VIN auditados de un código de catálogo en una ventana cuyos resultados ya se conocen según el margen de disponibilidad. Es una tasa de la versión y el mercado, no la probabilidad de un vehículo.
_Avoid_: Probabilidad de la unidad, score.

**VIN elegible para Auditoría Adicional**:
Unidad que aprobó Gate Release, sigue disponible para derivación y todavía no pasó por Auditoría Adicional.

**OK en Auditoría Adicional**:
Resultado de una auditoría sin calibración adicional. No equivale por sí solo a «no auditado» ni debe confundirse con el OK de Gate Release.

**CALIBRADA**:
Resultado que indica necesidad de calibración adicional durante la auditoría. No significa que la unidad incumpliera los estándares de Gate Release.

**Día del VIN**:
Última fecha de evento (DIA_n) observada para un VIN, contando inspecciones y reparaciones. Se usa como aproximación del día de su Auditoría Adicional, porque la base no registra esa fecha. Es un identificador de día, no una fecha de calendario.
_Avoid_: Llamarlo «fecha de auditoría».

**Margen de disponibilidad**:
Días que pasan entre el Día del VIN y el momento en que su resultado puede usarse para recomendar otros VIN. Se toman 5 días, el máximo informado por Ford entre Gate Release y Auditoría Adicional.
_Avoid_: Usar un resultado antes de que se conozca.

**Validación**:
Tramo de VIN, anterior a la prueba final, que se usa para comparar alternativas y elegir sus ajustes.
_Avoid_: Llamarlo «prueba».

**Prueba final**:
Tramo de VIN posterior a la validación, sobre el que la alternativa elegida y congelada se evalúa una sola vez frente al azar.
_Avoid_: Elegir o ajustar una alternativa mirando su resultado.

**Cupo de auditoría**:
Cantidad de vehículos que pueden seleccionarse para Auditoría Adicional dentro de una ventana operativa, expresada como fracción de la producción que aprueba Gate Release. Ford confirmó el 22/09 que hoy selecciona el 5% de forma completamente aleatoria, sin criterio específico, y que no busca ampliar ese porcentaje por costo y capacidad. La ventana exacta no se precisó: Ford pidió basarse en el dataset entregado, por lo que queda como supuesto del equipo.

**Cupo diario**:
Cupo de auditoría de un día: el 5% de los VIN de ese Día del VIN, redondeado hacia abajo y con mínimo de uno. Es la ventana que supone el equipo, coherente con una hoja por día; Ford no la fijó.
_Avoid_: Un único cupo sobre todo un tramo de días.

**Grupo de control**:
Porción del cupo que se sigue eligiendo al azar mientras se usa una recomendación de auditoría. Sirve para medir la selección frente al azar y para seguir conociendo el resultado de códigos que la recomendación no elige.
_Avoid_: «Exploración» a secas; confundirlo con la selección aleatoria actual, que abarca todo el cupo.

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
