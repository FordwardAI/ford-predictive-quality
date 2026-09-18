# Consultas a Ford y alternativas si no llegan respuestas

Investigación del 18 de septiembre de 2026 para preparar [¿Qué aclaraciones pedir a Ford y cómo avanzar si no llegan?](https://github.com/FordwardAI/ford-predictive-quality/issues/5). Es preparación para una reunión: no registra una respuesta de Ford ni la resolución del ticket.

## Estado del contacto y objetivo acordado

El equipo confirmó el 18 de septiembre que **ya envió un correo** solicitando una reunión la semana siguiente para revisar el dataset. Adelantó dos preguntas urgentes: disponibilidad de datos operativos numéricos (tiempos de ciclo y parámetros de ajuste) y diccionarios de CCC, VFG, VRT, catálogo y PUL. Está esperando respuesta; la reunión todavía no tiene fecha confirmada. Fuente: correo reproducido por el usuario en esta sesión, no verificado en una bandeja de correo.

El objetivo acordado es llegar con conclusiones preliminares y dudas concretas. No se acordó una fecha límite de espera ni una alternativa definitiva si Ford no responde. Las seis consultas siguientes sirven como agenda de reunión; no implican enviar otro correo.

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
- **Fuente de estructura:** cabecera del `dataset.md` documentada en la [auditoría previa](poblacion-etiquetas.md#riesgo-de-interpretar-el-encabezado-incorrecto). Su identificación y reproducción están en [datos locales](../docs/datos-locales.md). No se repitió la auditoría completa ni se verificó equivalencia con `table.xlsx`.
- **Evidencia cuantitativa ya obtenida:** [Población y etiquetas](poblacion-etiquetas.md), con conteos y auditoría reproducible de esa entrega. Los números citados abajo provienen de ese informe; no son nuevos conteos.
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

El orden siguiente es una recomendación por impacto sobre la interpretación y el uso del dato, no una prioridad acordada con Ford. Se pueden enviar las seis consultas juntas. Las alternativas son propuestas para seguir planificando sin convertir silencio en confirmación; su aceptación corresponde al equipo.

### 1. Población, etiquetas y mecanismo de inclusión — crítica

**Evidencia:** hecho 3 y carácter ficticio declarado en la consigna. El 10,1858% CALIBRADA es una proporción dentro de la entrega, no una tasa acreditada de toda la planta.

**Pregunta concreta:** ¿Qué representan los 59.681 VIN: solo auditados, toda la producción o una población sintética distinta? ¿OK significa siempre auditado sin calibración o también incluye unidades no auditadas o pendientes? ¿Cómo se generaron las etiquetas y se seleccionaron los VIN incluidos? ¿Hay una marca de selección, realización y estado final de auditoría que permita distinguir esos casos?

**Decisión que bloquea:** definir la población objetivo y la interpretación del resultado que se evaluará; justificar si los negativos son resultados observados y a qué población se podrían extender las conclusiones.

**Sin respuesta:** proponer una demostración limitada a los VIN y a las etiquetas **tal como fueron entregados**, declarando desconocido el mecanismo de inclusión. No presentar OK como comprobación universal de auditoría realizada ni extrapolar tasa, detección o ahorro a toda la producción. Si la especificación exige demostrar eficacia real en planta, esta incertidumbre sigue abierta: la demo no la resuelve.

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

**Pregunta concreta:** ¿El 5% se calcula por turno, día, lote u otra ventana, y sobre qué denominador? ¿Es un límite de capacidad, una meta aproximada o una regla fija? ¿La selección actual es aleatoria y hay excepciones o prioridades obligatorias? ¿Cuánto permanece elegible cada VIN y cuándo Calidad confirma la selección?

**Decisión que bloquea:** definir candidatos, oportunidad de selección y capacidad comparable para elegir después la métrica y el benchmark.

**Sin respuesta:** proponer solo escenarios ilustrativos con cupo del 5% sobre un conjunto declarado de candidatos sintéticos. La selección aleatoria sería una referencia simulada bajo un supuesto del equipo; la ventana y la política efectiva de planta seguirían sin confirmar. No presentar un ranking global sobre toda la base como operación por turno o día ni fijar aquí ventana o métrica.

### 5. Diccionario, cabecera y significado de eventos — necesaria para interpretación

**Evidencia:** hecho 5; [semántica documentada](consigna-fuentes.md#semántica-efectivamente-documentada). La auditoría halló 477 repeticiones exactas y nueve fechas de reparación faltantes, sin establecer su causa. [Población y etiquetas](poblacion-etiquetas.md).

**Pregunta concreta:** ¿Pueden confirmar la correspondencia nombre/descripción de las columnas 38–40 y el significado de `Rep Respuesta a Pregunta Desensamblar`? ¿Existe diccionario de CCC, VFG, VRT, PUL, CP, catálogo y componente calibrado, incluyendo códigos de nulos/no aplica? ¿Una fila representa un evento único, existe ID de evento y qué significan las repeticiones exactas y reparaciones sin fecha?

**Decisión que bloquea:** interpretar códigos y ausencias, definir qué cuenta como evento y justificar futuras representaciones y explicaciones para Calidad.

**Sin respuesta:** conservar nombres técnicos y códigos como categorías sin expandir siglas, inventar gravedad ni inferir jerarquías. Registrar la incertidumbre de descripciones, ausencias y repeticiones; no equiparar repetición exacta a error ni campo vacío a ausencia del suceso. Dejar normalización, deduplicación y representación para sus decisiones específicas. El diccionario semántico tampoco sustituye la confirmación temporal de la consulta 2.

### 6. Inventario y fuentes adicionales — útil para delimitar el alcance

**Evidencia:** hecho 6; [inventario recibido](consigna-fuentes.md#fuentes-presentes-prometidas-y-límites). La cabecera actual no identifica explícitamente tiempos de permanencia, mediciones instrumentales ni recorrido completo por estaciones sin incidencia.

**Pregunta concreta:** ¿`table.xlsx` y su export constituyen toda la entrega o faltan los parámetros, instrumentales y ZIP mencionados? ¿Qué archivo contiene cada fuente? Si existen tiempos de ciclo, permanencias, controles automáticos o pasos por estaciones sin defectos, ¿pueden compartir esquema, claves de vínculo con VIN/evento y fechas de captura/disponibilidad, además de aclarar si el Excel y el Markdown representan la misma versión?

**Decisión que bloquea:** cerrar qué fuentes entran en el alcance y si permiten reconstruir las señales que la propuesta pretende utilizar.

**Sin respuesta:** proponer que la especificación se fundamente en la entrega identificada en [datos locales](../docs/datos-locales.md). Mantener las fuentes adicionales como no disponibles; no prometer variables que no se observan ni tratar falta de incidencias como paso exitoso por una estación. No interpretar «190.000 valores» como garantía de cobertura ni asumir equivalencia entre export y Excel. Si llega otra fuente, evaluar pertinencia, vínculo y temporalidad antes de incorporarla.

## Guion breve para la reunión solicitada

> Hola, estamos definiendo el alcance de la solución y necesitamos confirmar seis puntos de la base ficticia y del proceso:
>
> 1. ¿Los 59.681 VIN representan toda la producción, solo auditados u otra población sintética? ¿OK siempre es una auditoría realizada sin calibración o incluye no auditados/pendientes? ¿Cómo se generaron las etiquetas?
> 2. Para recomendar inmediatamente después de Gate Release, ¿qué historial ya está disponible? ¿Hay registros agregados o modificados después? ¿Disponemos de marcas de Gate Release, selección y resultado de auditoría que permitan reconstruir ese instante?
> 3. No encontramos VIN CALIBRADA cuya primera inspección observada sea posterior a DIA_260; sí hay eventos CALIBRADA posteriores de VIN anteriores. ¿Qué explica el patrón, qué período tiene etiquetas completas y qué orden/distancias conserva DIA_n?
> 4. ¿Sobre qué población y ventana se calcula el 5%, qué restricciones de capacidad y elegibilidad existen, y la selección actual es aleatoria con o sin excepciones?
> 5. ¿Pueden confirmar las descripciones de las columnas finales —Desensamblar, Código de Catálogo y Auditoría Adicional— y facilitar diccionarios de códigos? ¿Existe ID de evento y qué significan filas repetidas o reparaciones sin fecha?
> 6. ¿La entrega incluye todos los parámetros e instrumentales anunciados? Si hay otras fuentes, ¿cuáles son sus claves y fechas de disponibilidad? ¿El Excel y el export Markdown corresponden a la misma versión?
>
> Con estas aclaraciones podremos distinguir qué se demuestra sobre la base del desafío y qué requiere validación operativa. Muchas gracias.

## Pendiente de acuerdo del equipo

El correo ya fue enviado por el equipo; queda confirmar quién coordinará la reunión y documentará las respuestas, el plazo de espera y cuáles de estas alternativas acepta el equipo si no hay aclaraciones. No se asignan responsable individual ni fecha en esta investigación. Tampoco se eligen exclusiones, splits, modelos, métricas o una lista de variables admisibles. El ticket de conversación permanece pendiente de ese acuerdo; recibir una respuesta de Ford puede modificar las alternativas propuestas.
