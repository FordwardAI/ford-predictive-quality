# Consultas a Ford y alternativas si no llegan respuestas

Investigación del 18 de septiembre de 2026 para preparar [¿Qué aclaraciones pedir a Ford y cómo avanzar si no llegan?](https://github.com/FordwardAI/ford-predictive-quality/issues/5). Evidencia revalidada sobre el CSV recibido ese día. Actualizado el 21 de septiembre con una respuesta parcial de Ford y con el vencimiento del plazo de espera acordado; el ticket permanece abierto.

## Estado del contacto y objetivo acordado

El equipo confirmó el 18 de septiembre que **ya envió un correo** solicitando una reunión la semana siguiente para revisar el dataset. Adelantó dos preguntas urgentes: disponibilidad de datos operativos numéricos (tiempos de ciclo y parámetros de ajuste) y diccionarios de CCC, VFG, VRT, catálogo y PUL. El 21 de septiembre se registró una respuesta parcial, detallada abajo; la reunión todavía no tiene fecha confirmada. Fuente: correo reproducido por el usuario en esta sesión, no verificado en una bandeja de correo.

El objetivo acordado es llegar con conclusiones preliminares y dudas concretas. Las consultas siguientes sirven como agenda de reunión y, desde el acuerdo del 18 de septiembre, también como contenido de un mensaje de seguimiento por escrito; el plazo de espera y el responsable quedaron fijados en [Acuerdos del equipo y qué sigue pendiente](#acuerdos-del-equipo-y-qué-sigue-pendiente).

## Respuesta parcial registrada el 21 de septiembre de 2026

El [correo completo y su alcance](https://github.com/FordwardAI/ford-predictive-quality/issues/5#issuecomment-5762760463) se conservan en el ticket. Fuente: texto atribuido a Ford aportado por el usuario, sin verificación en una bandeja ni fecha exacta de recepción conocida. El 21/09 es la fecha de registro, no necesariamente la de recepción.

**Observaciones de la respuesta:**

| Consulta | Aclaración de Ford | Pendiente o no verificado |
| --- | --- | --- |
| 5 — Diccionario y significado | Los códigos son confidenciales y estandarizan información ya presente. VRT (Variable Reduction Team) identifica el equipo funcional; VFG (Vehicle Function Group) es un subconjunto; CCC (Customer Concern Code) aporta el máximo detalle. Ford orienta a detectar componente y área. Catálogo combina versión y mercado; PUL es el equipo de reparación. | No se entregó un diccionario de valores. Siguen sin aclararse cabecera, CP, nulos, identidad de evento, repeticiones y reparaciones sin fecha. |
| 6 — Fuentes | Ford indica que los datos ya fueron enviados y que el dataset del Drive contiene los parámetros necesarios para el desafío. | No se verificó equivalencia Excel/CSV ni se identificaron mediciones adicionales, claves o disponibilidad temporal. |
| 1–4 y 7–8 | No hay respuesta a estas consultas en el correo aportado. | Población/etiquetas, disponibilidad temporal, DIA_260, ventana/cupo, formatos y costo relativo de errores. |

**Límites e hipótesis:** la explicación de los códigos no prueba disponibilidad previa de campos ni habilita usar el resultado o componente de Auditoría Adicional como predictor. No se adoptan hipótesis nuevas ni se incorpora otra entrega. Tampoco hay confirmación de reunión o del envío del borrador de seguimiento.

**Decisión acordada el 21/09:** registrar y sincronizar esta respuesta parcial, manteniendo el ticket abierto y **In progress**, sus responsables y dependencias. Los acuerdos previos de alternativas y plazos se conservan; esta actualización no cierra decisiones sobre datos, modelos o evaluación.

## Conclusiones preliminares para llevar a la reunión

| Qué podemos sostener | Evidencia | Qué todavía no significa |
| --- | --- | --- |
| La unidad a priorizar es el VIN; las filas describen su historial. | 195.808 eventos para 59.681 VIN; entre 1 y 63 eventos por VIN. [Auditoría](poblacion-etiquetas.md#unidad-de-observación-y-etiquetas). | Que cada evento sea único: hay 477 repeticiones exactas cuya causa se desconoce. |
| El resultado es consistente dentro de cada VIN de la entrega. | 53.602 VIN OK y 6.079 CALIBRADA, sin etiquetas contradictorias ni faltantes. [Auditoría](poblacion-etiquetas.md#unidad-de-observación-y-etiquetas). | Que OK certifique una auditoría realizada ni que el 10,1858% sea prevalencia en planta. |
| El componente de Auditoría Adicional revela el resultado. | Está presente en todas las filas CALIBRADA y ausente en todas las OK. [Auditoría](poblacion-etiquetas.md#faltantes-y-componente-de-auditoría). | Que sirva como predictor previo: describe el resultado que se quiere anticipar. |
| Hay una discontinuidad temporal concreta que Ford debe explicar. | 4.910 VIN empiezan después de DIA_260 y todos son OK; sí hay eventos posteriores de VIN CALIBRADA anteriores. [Auditoría](poblacion-etiquetas.md#cobertura-temporal-eventos-y-cohortes-de-vin). | Que la calidad haya mejorado, que no existan positivos después del día 260 o que debamos borrar esa cohorte. |
| Todavía no podemos reconstruir con certeza el historial disponible al recomendar. | No hay marcas explícitas de Gate Release, selección o auditoría. [Cabecera y auditoría](poblacion-etiquetas.md#lo-que-el-archivo-no-resuelve-y-debe-consultarse-a-ford). | Que toda inspección o reparación del archivo pueda usarse sin fuga temporal. |

Para revisar con Ford, llevar la tabla de cohortes de la auditoría, la correspondencia de las columnas 38–40 y pedir que recorran un VIN de ejemplo indicando qué eventos ya existían al aprobar Gate Release y cuándo se conoció su resultado. Ese recorrido es una propuesta para aclarar el dato, no evidencia obtenida aún.

## Fuentes y alcance

- **Fuente primaria del proceso:** [consigna oficial](../docs/fuentes/documentation.md), especialmente «Descripción del Proceso Actual», «Desafío Específico», «Parámetros Operativos» y «Base de Datos».
- **Fuente de estructura y conteos:** CSV vigente identificado en [datos locales](../docs/datos-locales.md), auditado completo y comparado celda a celda con el Markdown anterior. [Población y etiquetas](poblacion-etiquetas.md) y [salida agregada](audit-csv.json) confirman los conteos citados. Cambian precisión de horas, espacios y representación de faltantes; no se verificó equivalencia con `table.xlsx`.
- **Contraste de autoridad:** [Consigna y fuentes](consigna-fuentes.md) separa requisitos de Ford de propuestas del equipo. [CONTEXT.md](../CONTEXT.md) recoge el vocabulario y el uso previsto; [documento inicial](../docs/fuentes/ford_predictive_quality_wayfinder.md) aporta preguntas e hipótesis, no confirmaciones adicionales de Ford.

La consigna declara ficticia la base. La evidencia local permite describirla, pero no determinar por qué Ford la construyó así ni certificar disponibilidad operativa de los campos. Estas preguntas requieren a quien conoce el proceso y la generación de la entrega; una búsqueda web no resolvería esa semántica propietaria.

## Hechos que delimitan las preguntas

1. Ford ubica la Inspección Adicional **después de Gate Release** y describe muestreo del **5%**, sin declarar aleatoriedad ni ventana. El contexto del equipo agrega la selección aleatoria como descripción del proceso, pendiente de confirmación operativa. [Consigna](../docs/fuentes/documentation.md), «Desafío Específico»; [contexto](../CONTEXT.md), «Cupo de auditoría».
2. El uso previsto es recomendar sobre un VIN que acaba de aprobar Gate Release, todavía disponible y no auditado. Por lo tanto, el corte relevante es el **instante de scoring/recomendación**, que antecede a la auditoría; no basta con saber que un evento ocurrió antes de la auditoría. Esta última conclusión se deriva del uso previsto, no de una garantía sobre el dataset. [Contexto](../CONTEXT.md), «Recomendación de auditoría» y «VIN elegible para Auditoría Adicional».
3. La base tiene 59.681 VIN, con una etiqueta coherente por VIN: 53.602 OK y 6.079 CALIBRADA. No permite distinguir explícitamente no auditados de auditados sin calibración ni probar que incluye toda la producción. La definición operativa de OK en el contexto no demuestra cómo se codificó cada negativo de la base ficticia. [Población y etiquetas](poblacion-etiquetas.md#unidad-de-observación-y-etiquetas).
4. No hay VIN CALIBRADA cuya **primera inspección observada** sea posterior a DIA_260; hay 4.910 VIN OK en esa cohorte. Sí hay 50 eventos de inspección CALIBRADA posteriores a 260, correspondientes a tres VIN que cruzan el límite, y eventos CALIBRADA hasta DIA_282. Son fechas de eventos, no fechas conocidas de auditoría. [Población y etiquetas](poblacion-etiquetas.md#cobertura-temporal-eventos-y-cohortes-de-vin).
5. La cabecera contiene fechas y horas de inspección/reparación, pero ningún timestamp explícito de Gate Release, selección o resultado de auditoría. Las descripciones de las columnas 38–40 están desalineadas. La presencia de `Componente Auditoría Adicional` coincide exactamente con CALIBRADA en la entrega auditada y su descripción lo vincula al resultado de la auditoría. Esto no certifica que todas las otras columnas sean anteriores al scoring. [Cabecera del dataset](../docs/datos-locales.md); [Población y etiquetas](poblacion-etiquetas.md#riesgo-de-interpretar-el-encabezado-incorrecto) y [componente de auditoría](poblacion-etiquetas.md#faltantes-y-componente-de-auditoría).
6. Ford menciona parámetros operativos por separado y registros de instrumentales posteriores a la ficha, aproximadamente «190.000 valores». No especifica que sean VIN ni filas; no está verificado si `table.xlsx` satisface esos anuncios. [Consigna](../docs/fuentes/documentation.md), «Parámetros Operativos» y «Base de Datos»; [Consigna y fuentes](consigna-fuentes.md#fuentes-presentes-prometidas-y-límites).

## Consultas priorizadas y alternativas propuestas

El orden siguiente es una recomendación por impacto sobre la interpretación y el uso del dato, no una prioridad acordada con Ford. Se conserva la formulación original de las ocho consultas como historial; para el contacto actual, usar el mensaje de seguimiento actualizado y los pendientes de la respuesta parcial. Las alternativas fueron aceptadas por el equipo el 18/09 con los plazos documentados al final; no convierten silencio en confirmación.

Las consultas 1 a 6 son las de la investigación original. Las **7 y 8** se agregaron el 18 de septiembre al acordar el seguimiento: la 7 recupera una pregunta que [Consigna y fuentes](consigna-fuentes.md#preguntas-críticas-para-ford-preparadas-pero-no-enviadas) ya había preparado y esta lista había perdido; la 8 cubre un hueco señalado en la revisión del ticket. Esta lista conserva las preguntas originales; su estado actual figura en la tabla de respuesta parcial.

### 1. Población, etiquetas y mecanismo de inclusión — crítica

**Evidencia:** hecho 3 y carácter ficticio declarado en la consigna. El 10,1858% CALIBRADA es una proporción dentro de la entrega, no una tasa acreditada de toda la planta.

**Pregunta concreta:** ¿Qué representan los 59.681 VIN: solo auditados, toda la producción o una población sintética distinta? ¿OK significa siempre auditado sin calibración o también incluye unidades no auditadas o pendientes? ¿Cómo se generaron las etiquetas y se seleccionaron los VIN incluidos? ¿Hay una marca de selección, realización y estado final de auditoría que permita distinguir esos casos?

**Decisión que bloquea:** definir la población objetivo y la interpretación del resultado que se evaluará; justificar si los negativos son resultados observados y a qué población se podrían extender las conclusiones.

**Sin respuesta:** proponer una demostración limitada a los VIN y a las etiquetas **tal como fueron entregados**, declarando desconocido el mecanismo de inclusión. No presentar OK como comprobación universal de auditoría realizada ni extrapolar tasa, detección o ahorro a toda la producción. Si la especificación exige demostrar eficacia real en planta, esta incertidumbre sigue abierta: la demo no la resuelve.

**Respuesta que invalidaría el supuesto:** si Ford indica que las etiquetas sintéticas se asignaron sin relación con el historial registrado, ninguna alternativa predictiva podría superar al azar y el resultado sería inconcluso **por construcción de la base**, no por la metodología. Esa distinción debe poder sostenerse en la presentación. El criterio operativo que declara un resultado inconcluso corresponde a [¿Qué cuenta como una mejora útil frente al muestreo aleatorio?](https://github.com/FordwardAI/ford-predictive-quality/issues/8) y no se fija aquí.

### 2. Disponibilidad temporal en el instante de recomendación — crítica

**Evidencia:** hechos 2 y 5. Tener fecha de inspección/reparación no prueba cuándo quedó disponible el registro ni si hubo actualizaciones posteriores.

**Pregunta concreta:** Para recomendar inmediatamente después de aprobar Gate Release, ¿qué campos y eventos del export ya existen y pueden consultarse en ese instante? ¿Se incorporan reparaciones, inspecciones o correcciones después del scoring o de la Auditoría Adicional? ¿Pueden proporcionar timestamps de Gate Release, selección, auditoría y disponibilidad/actualización del registro, o una regla documentada que permita distinguirlos? ¿Qué orden tienen los eventos con la misma fecha/hora?

**Decisión que bloquea:** determinar qué historial puede utilizar legítimamente la recomendación y cómo reconstruir una vista del VIN en ese instante.

**Sin respuesta:** documentar disponibilidad como **no verificada** y mantener la reconstrucción operativa pendiente. Una simulación retrospectiva puede ilustrar el flujo, pero debe declarar el supuesto sobre el historial disponible; no demostraría anticipación real. El ticket de datos admisibles deberá resolver el alcance del experimento. Este research no aprueba todos los campos de inspección, ni toda reparación, por estar en QLS o ser anterior a la auditoría.

### 3. Patrón de primeras fechas alrededor de DIA_260 — crítica para validación

**Evidencia:** hecho 4. El patrón no equivale a ausencia de eventos CALIBRADA después de ese día.

**Pregunta concreta:** ¿Qué explica que ningún VIN con primera inspección observada posterior a DIA_260 sea CALIBRADA, aunque sí haya eventos CALIBRADA posteriores de VIN iniciados antes? ¿Hay cierre incompleto de etiquetas, fecha de extracción, cambio en generación del dato ficticio o cambio de proceso? ¿Qué período tiene resultados completos y qué representa DIA_n: conserva orden, distancia y referencia común entre inspección y reparación?

**Decisión que bloquea:** interpretar la cobertura y madurez del resultado y fundamentar posteriormente una validación temporal.

**Sin respuesta:** conservar el patrón y su causa desconocida como evidencia para el ticket de validación. No atribuirlo a mejora de calidad ni afirmar generalización temporal. Cualquier evaluación futura deberá explicitar cómo trata esa incertidumbre; este informe no fija un corte, no excluye registros y no decide particiones.

### 4. Ventana, cupo y selección actual — necesaria para comparación operativa

**Evidencia:** hecho 1. El 5% documentado no determina una política de selección implementable ni el conjunto de VIN simultáneamente disponibles.

**Pregunta concreta:** ¿El 5% se calcula por turno, día, lote u otra ventana, y sobre qué denominador? ¿Es un límite de capacidad, una meta aproximada o una regla fija? ¿La selección actual es aleatoria y hay excepciones o prioridades obligatorias? ¿Cuánto permanece elegible cada VIN y cuándo Calidad confirma la selección? ¿La capacidad de auditoría puede ampliarse por encima del 5%, o ese porcentaje es el techo disponible? Esta última pregunta es distinta de si el 5% es límite, meta o regla: cambia si la propuesta de valor puede ser auditar más y mejor, o solo acertar más a cupo constante.

**Decisión que bloquea:** definir candidatos, oportunidad de selección y capacidad comparable para elegir después la métrica y el benchmark.

**Sin respuesta:** proponer solo escenarios ilustrativos con cupo del 5% sobre un conjunto declarado de candidatos sintéticos. La selección aleatoria sería una referencia simulada bajo un supuesto del equipo; la ventana y la política efectiva de planta seguirían sin confirmar. No presentar un ranking global sobre toda la base como operación por turno o día ni fijar aquí ventana o métrica.

### 5. Diccionario, cabecera y significado de eventos — necesaria para interpretación

**Actualización 21/09:** parcialmente aclarada; ver la tabla de respuesta parcial. La pregunta y alternativa siguientes conservan la formulación original del 18/09. No reiterar el pedido de códigos confidenciales ni tratar como desconocidas las definiciones ahora aportadas.

**Evidencia:** hecho 5; [semántica documentada](consigna-fuentes.md#semántica-efectivamente-documentada). La auditoría halló 477 repeticiones exactas y nueve fechas de reparación faltantes, sin establecer su causa. [Población y etiquetas](poblacion-etiquetas.md).

**Pregunta concreta:** ¿Pueden confirmar la correspondencia nombre/descripción de las columnas 38–40 y el significado de `Rep Respuesta a Pregunta Desensamblar`? ¿Existe diccionario de CCC, VFG, VRT, PUL, CP, catálogo y componente calibrado, incluyendo códigos de nulos/no aplica? ¿Una fila representa un evento único, existe ID de evento y qué significan las repeticiones exactas y reparaciones sin fecha?

**Decisión que bloquea:** interpretar códigos y ausencias, definir qué cuenta como evento y justificar futuras representaciones y explicaciones para Calidad.

**Sin respuesta:** conservar nombres técnicos y códigos como categorías sin expandir siglas, inventar gravedad ni inferir jerarquías. Registrar la incertidumbre de descripciones, ausencias y repeticiones; no equiparar repetición exacta a error ni campo vacío a ausencia del suceso. Dejar normalización, deduplicación y representación para sus decisiones específicas. El diccionario semántico tampoco sustituye la confirmación temporal de la consulta 2.

### 6. Inventario y fuentes adicionales — útil para delimitar el alcance

**Actualización 21/09:** Ford remite al dataset ya compartido. La pregunta y alternativa siguientes conservan la formulación original del 18/09; la respuesta no verifica equivalencia entre archivos.

**Evidencia:** hecho 6; [inventario recibido](consigna-fuentes.md#fuentes-presentes-prometidas-y-límites). La cabecera actual no identifica explícitamente tiempos de permanencia, mediciones instrumentales ni recorrido completo por estaciones sin incidencia.

**Pregunta concreta:** ¿`table.xlsx` y su export constituyen toda la entrega o faltan los parámetros, instrumentales y ZIP mencionados? ¿Qué archivo contiene cada fuente? Si existen tiempos de ciclo, permanencias, controles automáticos o pasos por estaciones sin defectos, ¿pueden compartir esquema, claves de vínculo con VIN/evento y fechas de captura/disponibilidad, además de aclarar si el Excel y el CSV representan la misma versión?

**Decisión que bloquea:** cerrar qué fuentes entran en el alcance y si permiten reconstruir las señales que la propuesta pretende utilizar.

**Sin respuesta:** proponer que la especificación se fundamente en la entrega identificada en [datos locales](../docs/datos-locales.md). Mantener las fuentes adicionales como no disponibles; no prometer variables que no se observan ni tratar falta de incidencias como paso exitoso por una estación. No interpretar «190.000 valores» como garantía de cobertura ni asumir equivalencia entre export y Excel. Si llega otra fuente, evaluar pertinencia, vínculo y temporalidad antes de incorporarla.

### 7. Formatos de entrega y límites del pitch — necesaria para comprometer el alcance

**Evidencia:** la lectura completa de la consigna no encontró especificación de formatos de entrega, repositorio, notebook, memoria escrita, archivo del modelo, video o demo, cantidad de diapositivas ni duración del pitch. [Consigna y fuentes](consigna-fuentes.md#exigencias-y-criterios), fila «Sin especificación encontrada». La consigna sí valora un complemento accionable —interfaz, dashboard **o** reporte— sin imponer una aplicación, y evalúa la exposición oral con soporte visual.

**Pregunta concreta:** ¿Cuál es la lista oficial de archivos y formatos que deben entregarse el 2 de octubre? ¿Hay límite de duración para la presentación y para la demostración, y en qué orden se exponen? ¿Se espera entregar código, datos procesados o modelo, y por qué canal? ¿Hay requisitos de confidencialidad sobre lo que se publique?

**Decisión que bloquea:** [¿Qué alcance de entrega y reparto de trabajo se compromete para el 2 de octubre?](https://github.com/FordwardAI/ford-predictive-quality/issues/12), cuyo enunciado registra que formatos y horario de cierre no están especificados.

**Sin respuesta:** fijar nosotros la lista de entregables y la duración, declarándolos supuesto del equipo y no requisito de Ford, y dimensionarlos para lo que la consigna sí exige: metodología, justificación frente a alternativas, preparación de datos, validación y presentación oral con soporte visual. No inventar formatos que la fuente no especifica ni comprometer una aplicación que no está exigida.

### 8. Costo relativo de los dos errores — necesaria para elegir la medida de éxito

**Evidencia:** hecho 1 y la resolución de [¿Cuándo y sobre qué conjunto de VIN se decide la auditoría?](https://github.com/FordwardAI/ford-predictive-quality/issues/4#issuecomment-5718463685), que fijó la comparación al mismo cupo del 5%. Comparar a cupo constante pondera implícitamente por igual los dos errores posibles, y ninguna fuente disponible declara esa equivalencia. La consigna evalúa capacidad predictiva junto con aplicabilidad e impacto, sin fijar métrica ni umbral.

**Pregunta concreta:** ¿Cuánto cuesta relativamente dejar pasar una unidad que requería calibración frente a auditar una que no la requería? ¿El costo del primer caso es de retrabajo, de garantía, de reputación o de reproceso en línea? ¿Existe una estimación, aunque sea un orden de magnitud o una preferencia declarada entre detectar más y molestar menos?

**Decisión que bloquea:** [¿Qué cuenta como una mejora útil frente al muestreo aleatorio?](https://github.com/FordwardAI/ford-predictive-quality/issues/8). Sin la asimetría se pueden enumerar métricas, pero no fundamentar la elección entre precisión y recupero.

**Sin respuesta:** presentar la comparación a cupo fijo declarando explícitamente que pondera por igual ambos errores, como supuesto del equipo y no como criterio de Ford, y mostrar la sensibilidad del resultado si esa ponderación cambiara. No elegir aquí métrica, umbral ni criterio de éxito: eso corresponde a su ticket.

## Guion breve para la reunión solicitada

Guion histórico del 18/09, conservado como antecedente. Para un nuevo contacto, usar el mensaje actualizado siguiente y la tabla de pendientes; no reiterar las partes respondidas de las consultas 5 y 6.

> Hola, estamos definiendo el alcance de la solución y necesitamos confirmar ocho puntos de la base ficticia, del proceso y de la entrega:
>
> 1. ¿Los 59.681 VIN representan toda la producción, solo auditados u otra población sintética? ¿OK siempre es una auditoría realizada sin calibración o incluye no auditados/pendientes? ¿Cómo se generaron las etiquetas?
> 2. Para recomendar inmediatamente después de Gate Release, ¿qué historial ya está disponible? ¿Hay registros agregados o modificados después? ¿Disponemos de marcas de Gate Release, selección y resultado de auditoría que permitan reconstruir ese instante?
> 3. No encontramos VIN CALIBRADA cuya primera inspección observada sea posterior a DIA_260; sí hay eventos CALIBRADA posteriores de VIN anteriores. ¿Qué explica el patrón, qué período tiene etiquetas completas y qué orden/distancias conserva DIA_n?
> 4. ¿Sobre qué población y ventana se calcula el 5%, qué restricciones de capacidad y elegibilidad existen, y la selección actual es aleatoria con o sin excepciones?
> 5. ¿Pueden confirmar las descripciones de las columnas finales —Desensamblar, Código de Catálogo y Auditoría Adicional— y facilitar diccionarios de códigos? ¿Existe ID de evento y qué significan filas repetidas o reparaciones sin fecha?
> 6. ¿La entrega incluye todos los parámetros e instrumentales anunciados? Si hay otras fuentes, ¿cuáles son sus claves y fechas de disponibilidad? ¿El Excel y el CSV corresponden a la misma versión?
> 7. ¿Cuál es la lista oficial de archivos y formatos a entregar el 2 de octubre, y qué límites tienen la presentación y la demostración?
> 8. ¿Cuánto cuesta relativamente dejar pasar una unidad que requería calibración frente a auditar una que no la requería?
>
> Con estas aclaraciones podremos distinguir qué se demuestra sobre la base del desafío y qué requiere validación operativa. Muchas gracias.

## Mensaje de seguimiento por escrito

Borrador actualizado el 21/09 tras la respuesta parcial a las consultas **5 y 6**. Mantiene las seis consultas aún sin respuesta, reconoce las aclaraciones y retira la reiteración del pedido de diccionarios y datos operativos. Los puntos residuales de las consultas 5 y 6 permanecen registrados arriba. No consta el envío de este borrador: el contacto lo realiza el equipo.

> Hola, gracias por la respuesta y las aclaraciones sobre el dataset, la clasificación VRT/VFG/CCC, el Código de Catálogo y PUL. Seguimos a disposición para la reunión cuando les resulte posible; mientras tanto dejamos por escrito las consultas que más condicionan el alcance, para que puedan responderlas cuando les quede cómodo.
>
> 1. ¿Los 59.681 VIN representan toda la producción, solo auditados u otra población sintética? ¿OK siempre es una auditoría realizada sin calibración o incluye no auditados/pendientes? ¿Cómo se generaron las etiquetas?
> 2. Para recomendar inmediatamente después de Gate Release, ¿qué historial ya está disponible en ese instante? ¿Hay registros agregados o modificados después? ¿Existen marcas de Gate Release, selección y resultado de auditoría que permitan reconstruir ese momento?
> 3. No encontramos VIN CALIBRADA cuya primera inspección observada sea posterior a DIA_260, aunque sí hay eventos CALIBRADA posteriores de VIN iniciados antes. ¿Qué explica el patrón, qué período tiene etiquetas completas y qué orden y distancias conserva DIA_n?
> 4. ¿Sobre qué población y ventana se calcula el 5%, qué restricciones de capacidad y elegibilidad existen, la selección actual es aleatoria, y esa capacidad puede ampliarse o es un techo?
> 5. ¿Cuál es la lista oficial de archivos y formatos a entregar el 2 de octubre, y qué límites tienen la presentación y la demostración?
> 6. ¿Cuánto cuesta relativamente dejar pasar una unidad que requería calibración frente a auditar una que no la requería? Nos sirve incluso un orden de magnitud o una preferencia declarada.
>
> Muchas gracias por la ayuda.

La numeración del mensaje es correlativa para quien lo lee; la correspondencia con esta lista es 1→1, 2→2, 3→3, 4→4, 5→7 y 6→8.

## Acuerdos del equipo y qué sigue pendiente

Acordado el 18 de septiembre de 2026 al trabajar [¿Qué aclaraciones pedir a Ford y cómo avanzar si no llegan?](https://github.com/FordwardAI/ford-predictive-quality/issues/5). Lo que sigue son decisiones del equipo, no respuestas de Ford.

- **Quién la lleva:** MaximoGeorgalos coordina las ocho consultas, la reunión si se concreta, y documenta las respuestas en el ticket. Es el frente que el [README](../README.md#reparto-sugerido) asigna a industrial. El acuerdo vale para este frente; el reparto general del trabajo corresponde a [¿Qué alcance de entrega y reparto de trabajo se compromete para el 2 de octubre?](https://github.com/FordwardAI/ford-predictive-quality/issues/12).
- **Hasta qué fecha esperamos:** **20 de septiembre de 2026** es el gatillo. Se deriva del hito propuesto en el README, que ubica la construcción entre el 21 y el 25: una respuesta posterior ya no puede cambiar la especificación. Al vencer, las alternativas de cada consulta dejan de ser propuestas y pasan a ser el supuesto vigente, sin necesidad de un acuerdo nuevo.
- **Última fecha útil:** **25 de septiembre de 2026**. Una respuesta que llegue entre el 20 y el 25 se integra; después de esa fecha se documenta como limitación en lugar de rehacer trabajo.
- **Alternativas:** las ocho se aceptan en bloque como alcance defendible si no llegan aclaraciones.
- **Canal:** además de la reunión, las consultas que no se enviaron todavía van por escrito, con el texto de la sección anterior. El envío lo hace el equipo.

**Estado al 21/09:** se registró una respuesta parcial a las consultas 5 y 6. Siguen sin respuesta las consultas 1–4 y 7–8, y los puntos residuales indicados en la tabla de respuesta parcial; no hay fecha de reunión confirmada. Por elección explícita del usuario, el ticket permanece abierto y en In progress. Se conservan los acuerdos del 18/09 y no se resuelven aquí las decisiones de otros tickets.

### Gatillo del 20 de septiembre: vencido

**Observación:** al 21 de septiembre las consultas 1–4 y 7–8 siguen sin respuesta y la reunión no tiene fecha confirmada. El plazo de espera acordado el 18/09 venció el 20 de septiembre.

**Consecuencia ya acordada, sin acuerdo nuevo:** por el acuerdo de esa fecha, las alternativas «Sin respuesta» de las consultas 1–4 y 7–8 dejan de ser propuestas y pasan a ser el **supuesto vigente**. Las consultas 5 y 6 quedan fuera de este efecto: recibieron respuesta parcial y sus puntos residuales figuran en la tabla anterior.

**Lo que esto no hace:** no resuelve ningún ticket ni elige exclusiones, deduplicación, particiones, métricas, umbrales ni modelos. Cada ticket que adopte uno de estos supuestos debe declararlo como supuesto del equipo y no como criterio de Ford, y mostrar la sensibilidad del resultado si la ponderación o la interpretación cambiara.

**Límite del supuesto:** no consta que el mensaje de seguimiento por escrito se haya enviado. Las consultas 1–4 y 7–8 se formularon en el guion de reunión y en el borrador, no en el correo del 18/09, que adelantó únicamente las consultas 5 y 6. El plazo se cumplió en los términos del acuerdo del equipo, pero la ausencia de respuesta no equivale a que Ford haya declinado responder preguntas que todavía puede no haber recibido. Enviar el borrador sigue pendiente a cargo del equipo y la ventana de integración hasta el **25 de septiembre de 2026** permanece abierta.

**Sigue fuera de este documento,** y corresponde a sus tickets: exclusiones, deduplicación, particiones, modelos, métricas, umbrales, criterio de resultado inconcluso y la lista de variables admisibles.
