# Datos de proceso para ampliar la priorización de Auditoría Adicional

Evaluación solicitada por Facundo después de integrar la [PR #48](https://github.com/FordwardAI/ford-predictive-quality/pull/48), merge `43d703d`, el 30/09/2026 a las 21:06 de Argentina. Seguimiento en [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33). Es una propuesta de investigación y captura; no adopta un modelo ni modifica el preregistro.

## Conclusión

**Tiene sentido investigar datos cuantitativos de proceso: podrían diferenciar unidades del mismo catálogo que hoy reciben la misma recomendación. No se puede calcular cuánto mejoraría la selección sin esas mediciones y sus resultados de auditoría vinculados.** La PR #48 no ensayó torque, metrología, soldadura, lotes o ambiente: ensayó las columnas de la entrega QLS y sus representaciones.

La primera necesidad es definir qué ajuste físico representa cada resultado `CALIBRADA` y recuperar todas las auditorías, incluidas las de VIN sin actividad QLS, con sus fechas reales. Después, solicitar exportaciones existentes de una operación relevante, antes de proponer sensores nuevos. Torque/ángulo y geometría tienen prioridad técnica condicionada al componente; trazabilidad de lotes y estación tiene prioridad práctica si ya existe. Ambiente y soldadura se incorporarían cuando ingeniería fundamente su vínculo con ese ajuste.

## Observaciones y método

La fuente actual es el CSV ficticio identificado en [datos locales](../docs/datos-locales.md), SHA-256 `a24860d86afdd841d1c9c4ac12155a861299b80dbc161bcd17d2aaff43c5a82b`; catálogo `89e5a9d9c4312a408f996bea3e170e44428827a458fa62d76936648e1733e047`. La auditoría publicada contiene 195.808 eventos y 59.681 VIN auditados con actividad QLS. No representa toda la producción ni todos los auditados. No se recibió una nueva entrega de proceso.

Método de este informe: lectura del [estudio integrado](busqueda-amplia.md), sus límites y el estado de #33, contraste documental con cinco fuentes primarias y diseño de una comparación futura. No se reprocesó el CSV, entrenó un modelo, generó telemetría sintética ni leyó la prueba final. La unidad de evaluación propuesta sigue siendo VIN; las mediciones pueden tener unidades de captura distintas y múltiples registros por VIN.

En #48, entre auditados con actividad QLS de la base ficticia:

- Selección exploratoria Día 100–174: 15.279 VIN, 740 inspecciones. RF con atributos promedió 133,8 aciertos en cinco semillas, frente a 131,8 del ensemble seleccionado.
- Comprobación Día 175–194: 4.626 VIN, 225 inspecciones. RF obtuvo 46/225 en cada semilla; la tasa fija también obtuvo 46/225. No demuestra superioridad independiente de RF.
- Agregar todas las columnas QLS empeoró la selección de los controles ensayados. `Rep.PosA` conservó una señal candidata, con disponibilidad previa sin acreditar. No se concluye que ninguna variable adicional pueda ayudar.
- Ambos tramos ya se habían explorado. Más búsqueda sobre ellos no sustituye una evaluación nueva.

La expresión «solo registros cualitativos de fallas/reparaciones» requiere precisión: QLS también contiene identificadores y campos temporales. Lo que falta en la entrega es evidencia de las mediciones físicas propuestas, su contexto y su disponibilidad. El resultado `CALIBRADA` indica ajuste adicional tras Gate Release; no identifica por sí solo un mecanismo físico único.

## Qué respaldan las fuentes

Atlas Copco documenta torque/ángulo, asociación al identificador leído y almacenamiento de resultados en ToolsNet [S1]. Hexagon documenta medición automotriz de holgura y enrase en puertas, capot, portón y paneles [S2]. Bosch Rexroth documenta monitoreo de corriente, tensión, resistencia, potencia, energía y tiempo de soldadura [S3]. Son capacidades de captura: no prueban que esos sistemas estén instalados o accesibles en Pacheco ni que expliquen `CALIBRADA`.

NIST describe la importancia del contexto de máquina, acceso e integración y sincronización temporal en datos de manufactura [S4]. Su documento trata CNC aditivo/sustractivo; aquí se transfiere una condición metodológica, no un resultado empírico automotriz. NIST distingue asociación de causalidad y presenta el diseño experimental como herramienta para investigar causas [S5].

## Hipótesis: matriz de captura priorizada

Las prioridades son recomendaciones de esta evaluación, pendientes de Ford. P0 es condición de evaluación; P1 es primera solicitud; P2 es una segunda incorporación condicionada al mecanismo y acceso. Los costos son relativos de integración, no presupuestos: ninguna fuente permite estimar costo local. En todas las filas, cobertura y faltantes reales son desconocidos y deben medirse.

| Prioridad y datos | Mecanismo hipotético / utilidad | Fuente y granularidad solicitadas | Unión y disponibilidad previa | Riesgo y esfuerzo condicionado |
| --- | --- | --- | --- | --- |
| P0 · Población y auditoría | Corregir la cobertura de evaluación y definir el objetivo | Todos los VIN elegibles, catálogo, Gate Release, selección, auditoría, resultado y componente; medición física antes/después del ajuste y tolerancia, si existe | VIN; tiempos reales de evento y de publicación. Resultados solo como etiquetas cuando ya estén disponibles | No auditado no es OK. Excluir auditados sin incidencias sesga la población. Exportar históricos podría ser más simple que integrar sensores; acceso por confirmar |
| P1 · Torque y ángulo de uniones pertinentes | Señal de variación del ensamble y posibles diferencias entre unidades del mismo código | Controlador/herramienta; por operación e intento: N·m, grados, nominal, tolerancias, resultado y curva si se conserva [S1] | VIN o ID de carrocería trazable + operación + estación + instante; exportación accesible antes de seleccionar | Un apriete reparado no equivale al inicial. Conservar secuencia/reintentos. Primero exportación de resúmenes existentes; curvas completas elevan volumen e integración |
| P1 · Metrología del mecanismo objetivo | Desviación geométrica respecto de especificación | Sistema dimensional: mm y referencia nominal por punto; gap/flush solo si se relaciona con el ajuste [S2]. Para suspensión/dirección, pedir a ingeniería su medición pertinente | VIN/ID de carrocería + punto + estación + instante; anterior a selección | Medida tomada durante Auditoría Adicional sería fuga como predictor. Incertidumbre del instrumento y versión de referencias. No asumir gap/flush exterior como sustituto de geometría de suspensión |
| P1 · Lote de componentes críticos | Variación compartida por lote/proveedor | Genealogía de piezas: ID de pieza, lote, proveedor, revisión, instalación/sustitución; por componente instalado | VIN + pieza/lote + tiempo de instalación; lote realmente montado conocido al decidir | Separar componente original de reparación. Lotes pequeños o nuevos dificultan generalización. Extracción de genealogía existente antes que inferencia desde órdenes generales |
| P1 · Paso por estaciones, ciclos y paradas | Contexto operativo y exposición a interrupciones | MES/PLC: entrada/salida, estación, estado activo/espera/buffer/reproceso, paradas con inicio/fin; segundos/minutos por paso | VIN + estación + intervalo; superponer paradas al paso real, con relojes sincronizados | No usar horas de reparación como dwell. Una espera larga no prueba avería. Takt es ritmo objetivo, distinto del ciclo medido. Esfuerzo depende de si existe seguimiento individual |
| P1 · Turno y secuencia | Contexto temporal; posible variación por arranque/cambio | MES: turno efectivo, posición en secuencia y tiempo desde inicio/cambio; por paso o VIN | VIN + estación + instante; conocido antes de selección | Confunde mezcla de catálogo, lotes y cambios de proceso. Turno nocturno no prueba fatiga. Bajo esfuerzo solo si las marcas ya existen |
| P2 · Herramental y mantenimiento | Variación por uso o estado del equipo | Contador de ciclos/piezas y mantenimiento, cambio de puntas, herramienta/programa; por operación | Equipo/herramienta + intervalo de vigencia + paso del VIN | No unir al mantenimiento más próximo si ocurre después. Cambios pueden coincidir con producto/lote. Requiere historial versionado, no solo estado actual |
| P2 · Soldadura y adhesivos | Hipótesis de unión/estructura o curado vinculada al ajuste | Soldadura por punto/celda/programa: corriente, tensión, energía y tiempo [S3]; presión, temperatura y volumen de adhesivo solo si se miden y exportan. Unidades y nominales del sistema | ID de carrocería trazable a VIN + punto/celda + instante; antes de selección | Medir energía no demuestra rigidez torsional. Diagnósticos posteriores no son predictores. Mayor volumen y complejidad; priorizar puntos justificados por ingeniería |
| P2 · Ambiente | Posible exposición térmica o de curado | Sensores por zona/estación: °C y %HR, calibración e intervalo de muestreo; frecuencia definida según dinámica del proceso | Estación + intervalo de exposición del VIN; dato publicado antes de seleccionar | Sensor general de nave puede no representar la pieza. Confusión con estación, turno y estacionalidad. Empezar con sensores existentes; sin cobertura espacial el agregado es débil |

Para todas las fuentes solicitar también: tiempo de medición, tiempo de ingreso/publicación, unidades, nominal/tolerancia vigente, programa/versión y calidad del registro. Que una medición ocurra antes de la selección no garantiza que el sistema la entregue a tiempo.

Preservar multiplicidades: un VIN puede pasar varias veces por una estación o tener varios intentos. No unir tablas de eventos solo por VIN produciendo un producto cartesiano; representar operaciones primero y resumir por VIN con reglas explícitas. No completar una ausencia de sensor con cero ni confundir operación no aplicable con registro perdido. Reportar porcentaje unido y faltante por día, catálogo, estación y resultado observado; conservar el denominador completo de elegibles.

## Qué corregir en los argumentos físicos

- Torque final diferente no demuestra por sí solo tensión residual ni descalibración: nominal, unión, estrategia, herramienta y tolerancia importan. Pedir evidencia para la unión concreta.
- Gap/flush mide ajuste entre superficies; no equivale a alineación de ruedas ni a geometría de suspensión. Su prioridad cambia según el componente que recibe calibración.
- Ni «la mayoría viene de un lote de proveedor» ni «45 minutos prueban un problema no documentado» están acreditados. Lote y permanencia son hipótesis, y la segunda puede incluir esperas normales.
- Secuencia/turno puede representar mezcla de producto, arranques o cambios de equipo; no es una medida de fatiga humana.
- Temperatura ambiente puede aportar contexto, pero no sustituye temperatura de pieza o adhesivo ni demuestra cuánto cambia el resultado físico. Ese mecanismo necesita especificación de materiales/proceso.

## Piloto mínimo propuesto

1. **Definir el fenómeno con ingeniería.** Separar los ajustes físicos relevantes por componente; pedir qué se mide, tolerancia y motivo de calibración. El resultado/componente y mediciones realizadas durante auditoría permanecen como objetivos o evidencia posterior.
2. **Inventariar exportaciones existentes.** Pedir una muestra de esquema y agregados de cobertura, además de acceso a registros internos protegidos. No comprar sensores antes de verificar ID trazable, tiempo, nominal y disponibilidad de una operación.
3. **Capturar un paquete acotado.** Registro de elegibles/auditorías con y sin actividad QLS, una operación física ligada al objetivo, catálogo, lote y paso por estación si existen. Resúmenes de apriete o dimensiones antes que todas las curvas y toda la planta. Guardar reintentos y correcciones anteriores a selección.
4. **Hacer una corrida en sombra.** Medir joins, latencia y faltantes sin cambiar la selección. Mantener separados no auditados, auditados OK y CALIBRADA; no fabricar etiquetas para los primeros. Determinar con datos reales tamaño/duración y cambios relevantes para ingeniería; aquí no se fija un plazo ni potencia inventados.
5. **Comparar aporte incremental.** En una nueva investigación, congelar tasa fija como control y RF con catálogo como candidato de #48; comparar el mismo modelo con catálogo solo, catálogo + paquete físico, y después + contexto. Mismos VIN, información disponible, días y cupos; sin elegir filas completas silenciosamente. Esto separa aporte de datos de cambio de algoritmo. No hace falta un ensemble nuevo para empezar.

La comparación exige períodos realmente nuevos, separación temporal y por VIN, y transformaciones aprendidas solo en entrenamiento. Conservar disponibilidad temporal de etiquetas y señales; los cinco días actuales son una aproximación de la entrega, no una licencia para ignorar latencias reales de nuevas fuentes. Congelar representación, candidatos y regla de elección antes del tramo de evaluación independiente. No reabrir el preregistro ni la prueba final existentes.

Medir precisión y aciertos en el cupo diario, diferencia pareada frente a control, incertidumbre por días, cobertura de captura y latencia. Mantener denominadores/períodos y separar VIN con/sin actividad QLS. Si lote o estación crean grupos compartidos, examinar dependencia entre días y rendimiento en lotes nuevos; no fijar automáticamente una partición por lote que cambie la pregunta de despliegue.

Con resultados solo de lo auditado, no se conoce qué habría ocurrido en una selección alternativa completa: un retrospectivo sobre auditados no acredita rendimiento para todos los elegibles. Reutilizar la propuesta acordada de días de control y medir las políticas en planta con selección y resultados registrados, bajo acuerdo de Ford. Registrar probabilidades de inclusión cuando proceda; no asumir selección aleatoria porque un archivo solo diga «auditado». Preservar el cupo, sin proponer auditar toda la producción.

**Causalidad es otra pregunta.** Una asociación prospectiva puede ser útil para priorizar sin demostrar una causa. Para investigar una causa específica, describir el mecanismo, sus factores de confusión y una intervención segura dentro de especificación, acordada con ingeniería, o un diseño cuasiexperimental con supuestos explícitos [S5]. Randomizar días de selección evalúa la política de auditoría; no demuestra que cambiar torque o humedad cambie la calibración.

Una priorización individual también cambia la operación: la hoja vigente ordena códigos y considera equivalentes los VIN de un código. Si los nuevos datos permiten distinguirlos, harán falta identificación de VIN en playa, consulta disponible por ronda y una propuesta operativa acordada. No alcanza con mejorar una métrica offline.

## Preguntas concretas para Ford

1. ¿Qué ajuste y medición física corresponden a cada componente `CALIBRADA`? ¿Se conserva valor previo, posterior, tolerancia y fecha real?
2. ¿Pueden exportarse todos los auditados, también sin QLS, y la población elegible con selección, fechas y política de muestreo?
3. ¿Qué resultados de apriete/metrología están ya registrados y vinculados a VIN o carrocería? ¿Qué operaciones se relacionan técnicamente con esos ajustes?
4. ¿Existe genealogía del componente instalado, seguimiento por estación y registro de reintentos/reparaciones?
5. ¿Qué fuentes se publican y pueden consultarse antes de cada ronda en playa? ¿Qué cobertura, relojes, latencia y calidad de medición tienen?
6. ¿Cuál es el costo de exportar una operación y quién valida un piloto en sombra y sus días de control?

## Decisiones y límites

Decisión de alcance: el usuario pidió evaluar estas cuatro dimensiones tras el merge. No hay acuerdo nuevo de adquisición, entrenamiento, cambio de predictor, adopción de RF o investigación causal en planta. La tasa fija y el protocolo vigente se conservan. El próximo paso recomendado es validar las preguntas anteriores y recibir una entrega trazable; el próximo paso no es seguir buscando modelos sobre los mismos VIN ficticios.

Esta evaluación no demuestra causas de descalibración ni estima ganancia/costo real. Los fabricantes documentan capacidades generales y las prioridades son inferencias condicionadas a esta pregunta. Los registros de producción y VIN permanecen fuera del repo y de servicios externos; publicar solo agregados revisados.

## Fuentes primarias

- [S1 · Atlas Copco, MWR Mechatronic: torque/ángulo, identificador y ToolsNet](https://www.atlascopco.com/en-uk/itba/local-uk/mechatronic).
- [S2 · Hexagon, Automotive flush and gap measurement](https://hexagon.com/products/product-groups/measurement-inspection-hardware/2d-laser-profilers/automotive-flush-and-gap-measurement).
- [S3 · Bosch Rexroth, Resistance Welding](https://www.boschrexroth.com/en/us/c/resistance-welding/).
- [S4 · NIST AMS 300-11, contexto e integración de datos, pp. 2–5](https://nvlpubs.nist.gov/nistpubs/ams/NIST.AMS.300-11.pdf).
- [S5 · NIST, Experiments and Experimental Design](https://www.itl.nist.gov/div898/handbook/ppc/section1/ppc136.htm).

Consultadas el 30/09/2026. Evidencia del proyecto: [búsqueda integrada](busqueda-amplia.md), [fuente y hashes](../docs/datos-locales.md), [vocabulario](../CONTEXT.md) y [propuesta vigente de implementación](../docs/entrega/05-trabajo-futuro.md).
