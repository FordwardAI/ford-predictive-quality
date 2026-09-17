# Población y etiquetas de la base Ford

Investigación AFK resuelta el 16 de septiembre de 2026. Alcance: describir la base entregada y precisar qué sigue requiriendo aclaración de Ford; no elegir exclusiones, particiones ni modelos.

## Fuentes y reproducción

- [Exportación Markdown del dataset](../docs/datos-locales.md), fuente de todos los conteos siguientes; se procesó el archivo completo por streaming, sin muestreo.
- [Consigna oficial](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/documentation.md), secciones «Base de Datos», «Desafío Específico» y «Descripción del Proceso Actual»: base ficticia creada para el desafío; inspección adicional posterior a Gate Release por muestreo del 5%.
- El documento de propuesta `ford_predictive_quality_wayfinder.md` es contexto de planificación; sus interpretaciones no sustituyen a la consigna ni a la confirmación del responsable del dato.

Archivo analizado: 78.164.273 bytes. SHA-256: `5f0e6dc11262fb4ff675797ebfe51c1d43feafc0029c5dcc3f2bd4574c56c3e2`.

Comando reproducible desde la raíz del repositorio:

```sh
python3 research/audit_dataset.py /ruta/al/dataset.md
```

El script usa solo la biblioteca estándar de Python y deja verificaciones ejecutables: parsing de separadores escapados; 41 encabezados únicos; 41 celdas en cada fila; formato DIA_n de toda fecha no faltante; VIN no faltante; reconciliación de filas, etiquetas y grupos temporales de VIN. Resultado: PASS. Solo se imprimen agregados; ningún VIN individual.

## Unidad de observación y etiquetas

Hay **195.808 filas de eventos**, **59.681 VIN únicos** y **41 columnas**. Cada VIN tiene entre 1 y 63 filas. No hay VIN ni resultados de auditoría faltantes. Todos los VIN tienen una sola etiqueta coherente a través de sus filas; no hay contradicciones OK/CALIBRADA. [Fuente: dataset completo y auditoría reproducible anterior.]

| Unidad de conteo | OK | CALIBRADA | Total |
|---|---:|---:|---:|
| Filas/eventos | 174.991 | 20.817 | 195.808 |
| VIN únicos | 53.602 | 6.079 | 59.681 |

La fracción CALIBRADA por VIN es **10,1858%**. Es la proporción dentro de la base entregada, no una estimación validada sobre toda la producción ni una prueba de que todos esos VIN fueron realmente auditados. La tabla por sí sola no identifica el mecanismo de inclusión ni diferencia explícitamente «no auditado» de «auditado y OK». [Fuentes: dataset y consigna, que declara ficticia la base.]

Hay **477 repeticiones exactas de fila** después de la primera ocurrencia: 195.331 filas textualmente distintas. Esto no permite decidir si son duplicados espurios o eventos legítimos indistinguibles; no se eliminaron. [Fuente: hash de cada fila de datos del export.]

## Riesgo de interpretar el encabezado incorrecto

El export tiene una fila de descripciones, una fila separadora y luego los nombres técnicos. Los registros comienzan después de esos tres renglones de tabla. Las descripciones de las posiciones 38–40 están desalineadas o incompletas:

| Posición (base 1) | Descripción superior | Nombre técnico utilizado |
|---|---|---|
| 38 | Resultado OK / CALIBRADA | Rep Respuesta a Pregunta Desensamblar |
| 39 | Unnamed: 38 | Código de Catálogo |
| 40 | Código de Catálogo del vehículo | Auditoría Adicional |

Por eso el resultado se contó en **Auditoría Adicional, columna 40**, usando los nombres técnicos. La columna 41 es **Componente Auditoría Adicional**. No se desplazaron los datos para forzarlos a coincidir con la descripción superior. [Fuente: primeras tres filas de la tabla del dataset.]

## Cobertura temporal: eventos y cohortes de VIN

«Día» significa el identificador numérico DIA_n del export. No se conoce su correspondencia con fechas de calendario ni se infiere que sea la fecha de auditoría.

| Fecha de evento | Primer día | Último día | Días distintos | Último evento de VIN CALIBRADA | Fechas faltantes |
|---|---:|---:|---:|---:|---:|
| Inspección | 1 | 284 | 283 | 282 | 0 |
| Reparación | 1 | 284 | 255 | 282 | 9 |

En inspección falta DIA_2 dentro del rango. En reparación faltan estos identificadores de día: 2, 6, 7, 18, 24, 35, 40, 41, 54, 60, 61, 72, 77, 94, 139, 146, 152, 161, 165, 169, 176, 215, 225, 226, 233, 239, 242, 251, 269. Son días sin registros de ese tipo; no prueban interrupciones de producción.

### Distribución por fecha de cada evento

| Tipo de fecha | Período | Filas OK | Filas CALIBRADA |
|---|---|---:|---:|
| Fecha Inspección | antes_260 | 159.765 | 20.731 |
| Fecha Inspección | dia_260 | 675 | 36 |
| Fecha Inspección | despues_260 | 14.551 | 50 |
| Fecha Reparación | antes_260 | 159.684 | 20.727 |
| Fecha Reparación | dia_260 | 702 | 36 |
| Fecha Reparación | despues_260 | 14.596 | 54 |

Las 9 fechas de reparación faltantes corresponden a filas OK y no entran en los tres períodos de reparación. **Sí existen filas CALIBRADA posteriores a DIA_260**, hasta DIA_282 en ambas fechas. La etiqueta pertenece al VIN; la fecha pertenece al evento. [Fuente: auditoría del dataset.]

### Cohortes por primera fecha observada de cada VIN

| Tipo de fecha | Primera fecha del VIN | VIN OK | VIN CALIBRADA |
|---|---|---:|---:|
| Fecha Inspección | antes_260 | 48.439 | 6.070 |
| Fecha Inspección | dia_260 | 253 | 9 |
| Fecha Inspección | despues_260 | 4.910 | 0 |
| Fecha Reparación | antes_260 | 48.429 | 6.070 |
| Fecha Reparación | dia_260 | 258 | 9 |
| Fecha Reparación | despues_260 | 4.914 | 0 |
| Fecha Reparación | sin_fecha | 1 | 0 |

El último día de inicio observado de un VIN CALIBRADA es DIA_260 para ambos tipos de fecha. Todos los VIN cuya primera inspección observada es posterior a 260 son OK. «Primera fecha observada» no equivale a fabricación, egreso ni auditoría. [Fuente: mínimo de fecha de evento agrupado por VIN.]

### VIN que cruzan la frontera ≤260 / >260

| Tipo de fecha | Grupo | VIN OK | VIN CALIBRADA |
|---|---|---:|---:|
| Fecha Inspección | solo_hasta_260 | 48.530 | 6.076 |
| Fecha Inspección | cruza_260 | 162 | 3 |
| Fecha Inspección | solo_despues_260 | 4.910 | 0 |
| Fecha Reparación | solo_hasta_260 | 48.519 | 6.075 |
| Fecha Reparación | cruza_260 | 168 | 4 |
| Fecha Reparación | solo_despues_260 | 4.914 | 0 |
| Fecha Reparación | sin_fecha | 1 | 0 |

Cruzar significa tener al menos un evento fechado hasta DIA_260 inclusive y otro posterior a DIA_260. Las 50 filas CALIBRADA de inspección posteriores al corte pertenecen a 3 VIN que cruzan; las 54 filas de reparación pertenecen a 4 VIN que cruzan. Los conjuntos dependen del tipo de evento, por eso sus tamaños difieren. No son dos cohortes de auditorías distintas. [Fuente: mínimos y máximos por VIN del dataset.]

## Faltantes y componente de auditoría

Se consideran faltantes las celdas vacías o `NaN`; el conteo se hace por fila, no por VIN. No se interpretaron otros códigos como nulos.

| Columna con faltantes | Filas faltantes |
|---|---:|
| Sec.CP | 117.310 |
| UC Nombre Tipo Incidencia | 188.248 |
| UC Nombre Posicion A | 108.553 |
| UC Nombre Posicion B | 140.614 |
| UC Nombre Posicion C | 156.681 |
| UC Nombre Grupo Posicion C | 172.646 |
| UC Nombre Posición D | 122.694 |
| UC Nombre Grupo Posición D | 137.492 |
| UC Posición Arbitraria | 190.898 |
| Fecha Reparación | 9 |
| Rep PUL | 76.698 |
| Rep Parte Causal | 21.593 |
| Rep.incid. | 22.874 |
| Rep.Tipo Incid. | 186.588 |
| Rep.PosA | 109.250 |
| Rep.PosB | 142.095 |
| Rep.PosC | 158.304 |
| Rep.Grp.PosC | 171.001 |
| Rep Nombre Posición D | 122.945 |
| Rep Nombre Grupo Posición D | 132.586 |
| Rep.Pos.arbit | 191.183 |
| Rep Respuesta a Pregunta Remplazar | 21.593 |
| Rep Respuesta a Pregunta Desensamblar | 21.593 |
| Componente Auditoría Adicional | 174.991 |

Todas las columnas no listadas tienen 0 celdas vacías/NaN. De los VIN, uno no tiene ninguna fecha de reparación registrada; los restantes tienen al menos una. [Fuente: conteos completos.]

**Componente Auditoría Adicional** está ausente en todas las 174.991 filas OK y presente en todas las 20.817 filas CALIBRADA; dentro de cada VIN su valor es constante. Su presencia revela exactamente el resultado en esta base, además de describir el componente calibrado según el encabezado; no es evidencia predictiva previa a la auditoría. [Fuente: dataset y nombre/descripción de la columna 41.]

## Lo que el archivo no resuelve y debe consultarse a Ford

1. **Población y negativos:** ¿los 59.681 VIN representan solo auditados, toda la producción o una muestra sintética distinta? ¿OK siempre significa auditoría efectuada sin calibración, o incluye unidades no auditadas? ¿Cómo se generaron y asignaron las etiquetas ficticias?
2. **Corte temporal:** ¿por qué no hay VIN CALIBRADA con primera fecha observada posterior a DIA_260? ¿Corte de extracción, etiquetas pendientes, cambio de generación/proceso u otra causa? Los datos demuestran el patrón, no su causa.
3. **Instante de decisión y auditoría:** ¿existen timestamps de Gate Release, selección para auditoría y resultado? Las columnas actuales identifican inspección/reparación y no aportan un timestamp explícito de auditoría; no permiten certificar que cada evento anteceda al momento de predicción.
4. **Definición de fechas y repetidos:** ¿DIA_n conserva orden/distancias temporales reales? ¿Qué significan fechas de reparación ausentes y filas exactas repetidas? ¿Existe un ID único de evento para distinguir repetición de exportación de múltiples eventos iguales?
5. **Diccionario correcto:** confirmar la correspondencia de las columnas 38–40 y significado de Desensamblar, dado el desacople entre descripción y nombre técnico.

La investigación queda resuelta como caracterización factual de la entrega. La definición operativa de población, la causa del patrón temporal y la disponibilidad previa a auditoría permanecen abiertas para aclaración de Ford. Este informe no decide excluir DIA_260, tratar OK como no auditado, eliminar duplicados ni extrapolar la tasa sintética a planta.
