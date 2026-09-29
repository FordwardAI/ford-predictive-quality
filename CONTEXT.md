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

**Actividad QLS**:
Que un VIN tenga al menos un evento de calidad registrado en QLS, el sistema donde la verificación de calidad registra incidencias y reparaciones. Según Ford (29/09), la base entregada reúne solo VIN auditados con actividad QLS: quedan afuera los auditados sin incidencias.
_Avoid_: «Todos los auditados» para describir la base; usar QLS sin haberlo definido en el mismo documento.

**Gate Release**:
Instancia de validación del cumplimiento de especificaciones al finalizar las intervenciones del proceso productivo, según la consigna.

**Auditoría Adicional**:
Inspección de alta precisión posterior a Gate Release, denominada también Inspección Adicional en la consigna. Evalúa la necesidad de ajustes finos en unidades que ya cumplen los estándares de liberación.

**Responsable de la selección**:
Equipo de analistas que elige, entre los vehículos que aprobaron Gate Release y esperan en la playa de despacho, cuáles se derivan a Auditoría Adicional. Según Ford (29/09), elige cada dos horas aproximadamente y hoy lo hace al azar.
_Avoid_: «Calidad» a secas para nombrar a quien selecciona; ubicar la selección en Gate Release.

**Playa de despacho**:
Lugar al que llegan los vehículos después de Gate Release y donde esperan, de 0 a 5 días, el paso a despacho. Allí se eligen los vehículos para Auditoría Adicional; el código de catálogo figura en una etiqueta del parabrisas.

**Recomendación de auditoría**:
Propuesta dirigida al responsable de la selección para priorizar, en la playa de despacho, vehículos que ya aprobaron Gate Release, antes de su derivación a Auditoría Adicional y con la información disponible en ese momento. Calidad de Planta fija cuántos, con el cupo diario; el responsable de la selección decide cuáles se derivan.

**Agrupación del catálogo**:
Atributos asignados a cada código de catálogo en el archivo recibido el 29/09: familia y motor dominante, tracción, versión dominante y mercado. Son atributos del código, no de cada vehículo. «Dominante» sugiere el valor mayoritario del código; el archivo no lo aclara.
_Avoid_: Leer motor o versión como dato exacto de cada vehículo.

**Mercado de destino**:
Atributo del código de catálogo que indica el país o mercado al que va el vehículo, según la agrupación del catálogo. En la base está anonimizado como `LOCATION_n`.
_Avoid_: «País», «location» o «región» como sinónimos sueltos.

**Hoja de códigos prioritarios**:
Forma diaria de la recomendación de auditoría, armada al inicio del día con los códigos programados: los códigos de catálogo ordenados por su tasa reciente del código, con rango, vehículos programados, acumulado y cantidad sugerida por código para llenar el cupo diario. Prioriza códigos, no vehículos: dentro de un código los vehículos son equivalentes. El equipo de analistas la consume en sus rondas. Si un código no llega a la playa de despacho, la cantidad pendiente pasa a los códigos siguientes del ranking que sí llegaron, y solo se completa al azar si se agota el ranking.
_Avoid_: Ranking de VIN; leer la cantidad sugerida como una elección de VIN concretos.

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

**Preregistro**:
Registro versionado, hecho antes de leer la prueba final, de todo lo que se va a leer en ella: la alternativa elegida con sus parámetros, la configuración de cada pieza del diferencial, las semillas y el hash de la fuente. Lo que no figura en el preregistro no se lee en la prueba final.
_Avoid_: «Congelar resultados»: lo que se congela es la configuración, antes de ver resultados.

**Cupo de auditoría**:
Cantidad de vehículos que pueden seleccionarse para Auditoría Adicional dentro de una ventana operativa, expresada como fracción de la producción que aprueba Gate Release. Ford confirmó el 22/09 que hoy selecciona el 5% de forma completamente aleatoria, sin criterio específico, y que no busca ampliar ese porcentaje por costo y capacidad. El 29/09 Ford precisó que la ventana es el día: el cupo es una cantidad fija por día (ver cupo diario).

**Cupo diario**:
Cupo de auditoría de un día. En la simulación sobre la base, el 5% de los auditados con actividad QLS de ese Día del VIN, redondeado hacia abajo y con mínimo de uno. Ford informó el 29/09 que el cupo es una cantidad fija por día, definida según el programa de producción, y que Calidad de Planta lleva el control diario. El redondeo es una convención del equipo para simular sobre la base.
_Avoid_: Un único cupo sobre todo un tramo de días.

**Días de control**:
Días de la implementación inicial propuesta a Ford en que la selección se sigue haciendo al azar, alternados con días en que se usa la recomendación. Sirven para medir la recomendación frente al método actual en las mismas condiciones de producción. Terminada esa etapa, la recomendación orienta todo el cupo.
_Avoid_: Reservar una porción permanente del cupo al azar; confundirlos con la selección aleatoria actual.

**Mínimo por código**:
Cantidad mínima de auditorías que recibe, por rotación, cada código de catálogo que se produce, aunque la recomendación no lo priorice. Mantiene al día la tasa de los códigos poco elegidos sin recurrir al azar.
_Avoid_: «Exploración» a secas; confundirlo con un mínimo de VIN para estimar la tasa de un código, que se descartó porque el suavizado cubre los códigos chicos.

**Proporción auditada**:
Fracción de la producción que aprueba Gate Release y se deriva a Auditoría Adicional; hoy, el 5%.
_Avoid_: Confundirla con la proporción CALIBRADA.

**Proporción CALIBRADA**:
Fracción de VIN auditados cuyo resultado es CALIBRADA. En la base entregada, que reúne solo auditados con actividad QLS y es ficticia, es 10,1858%; no es una tasa acreditada de planta.
_Avoid_: Prevalencia de planta, tasa de falla.

**Precisión en el cupo**:
Proporción CALIBRADA entre los VIN que una selección envía a Auditoría Adicional llenando el cupo completo: de cada 100 elegidos, cuántos se calibran.
_Avoid_: Precisión del modelo, sin indicar el cupo.

**Veces el azar**:
Cociente entre la precisión en el cupo de una selección y la proporción CALIBRADA del conjunto del que se eligió, que es lo que lograría en promedio la selección aleatoria. Mide cuánta dirección tiene la selección; en términos técnicos, lift.
_Avoid_: Mejora, sin indicar la referencia.

**Resultado inconcluso**:
Lectura de una evaluación cuyo rango de incertidumbre incluye la referencia del azar: la dirección observada no se distingue de la suerte. Con la base ficticia no permite separar falta de señal en el código de catálogo de etiquetas sin relación con él.
