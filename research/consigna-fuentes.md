# Consigna y fuentes: qué está exigido y qué falta confirmar

Investigación documental del 16 de septiembre de 2026. Alcance: consigna, documento inicial, inventario local y primeras líneas del dataset; no es una auditoría de sus datos ni una decisión de diseño.

## Evidencia y autoridad

- **Consigna del desafío:** [documentation.md](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/documentation.md), encabezado y fecha, líneas 1–13. Se presenta como Ford Innovation Challenge III, área Calidad, fechado **23/7/26**. Esa es la fecha de la ficha, no una fecha de entrega.
- **Documento de ideas y preguntas:** [ford_predictive_quality_wayfinder.md](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/ford_predictive_quality_wayfinder.md#L185), especialmente «Decisiones», «Innovación» y «Posible concepto de producto». Sus propuestas no equivalen a exigencias de Ford ni a decisiones ya tomadas por el equipo.
- **Datos y descripciones:** [dataset.md](../docs/datos-locales.md), líneas 2–5. La línea 2 contiene descripciones, la 4 nombres de campos y la 5 un primer registro.
- **Confirmaciones del usuario en esta conversación:** proyecto completo y todos los entregables para el **2 de octubre de 2026**; equipo de tres, dos informáticos y un industrial; pueden consultar mentores. El destino de esta planificación es una especificación lista para repartir trabajo. El día y mes fueron expresos; el año se contextualiza en la fecha actual. No hay compromiso cuantificado de horas semanales.

## Exigencias y criterios

| Categoría | Qué sostiene la fuente | Referencia |
|---|---|---|
| Objetivo explícito | Desarrollar una solución de IA y analítica predictiva que procese el historial QLS y anticipe qué unidades requieren ajustes finos en Inspección Adicional. | [Base de Datos](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/documentation.md#L78) |
| Contenido explícito de la propuesta | Detallar metodología y lógica conceptual; justificar el modelo frente a alternativas; describir preparación de datos y esquema de validación que demuestre efectividad. | [Base de Datos](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/documentation.md#L80) |
| Complemento valorado | Interfaz, dashboard **o reporte accionable** con predicciones claras, unidades priorizadas y variables de mayor impacto. No impone desarrollar una aplicación. | [Base de Datos](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/documentation.md#L80) |
| Evaluación | Rigor técnico y validación; justificación; capacidad predictiva; aplicabilidad e impacto; innovación; presentación y speech. Se evalúa exposición oral respaldada por soporte visual claro y profesional. | [Criterios de Evaluación](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/documentation.md#L82), líneas 84–91 |
| Sin especificación encontrada | Formatos de entrega, repositorio obligatorio, notebook, memoria escrita, archivo del modelo, video/demo, cantidad de diapositivas, duración del pitch, umbrales de métricas y ponderaciones de evaluación. | Lectura completa de [consigna](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/documentation.md) |

La consigna habla de muestreo del **5%** posterior a Gate Release; no explicita que sea aleatorio. La aleatoriedad y el benchmark al mismo cupo están en el documento inicial y requieren confirmar su fundamento con Ford. Tampoco define una métrica técnica específica: «precisión» allí no debe interpretarse automáticamente como la métrica `precision`. Fuentes: [Desafío Específico](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/documentation.md#L62), [benchmark propuesto](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/ford_predictive_quality_wayfinder.md#L35) y [métricas propuestas](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/ford_predictive_quality_wayfinder.md#L277).

## Fuentes presentes, prometidas y límites

Inventario observado en la carpeta de datos recibida: `documentation.md`, `documentation.docx`, `dataset.md`, `table.xlsx` y `ford_predictive_quality_wayfinder.md`. No se verificó equivalencia entre cada archivo original y su conversión Markdown. No aparece un ZIP ni un archivo adicional identificado como parámetros operativos, mediciones o diccionario.

La ficha promete parámetros operativos por separado y registros de instrumentales después de la ficha, con aproximadamente «190.000 valores»; esta expresión no certifica cantidad de filas ni VIN. También menciona documentación adjunta en ZIP. No puede concluirse solo con el inventario si `table.xlsx` satisface total o parcialmente esos anuncios. Fuentes: [Parámetros Operativos y Base de Datos](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/documentation.md#L68), líneas 70–76; [Documentación Disponible](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/documentation.md#L93).

**La base se declara ficticia, generada para el desafío.** Sus resultados permiten evaluar la demostración sobre esa base; por sí solos no prueban desempeño o ahorro real en planta. Esta última frase es una implicación metodológica, no una restricción adicional de Ford. Fuente: [disclaimer](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/documentation.md#L74).

Los conteos y la anomalía `DIA_260` están reportados en el documento inicial; esta investigación no los revalida. Fuentes: [Dataset disponible](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/ford_predictive_quality_wayfinder.md#L47) y [Anomalía temporal](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/ford_predictive_quality_wayfinder.md#L169).

## Semántica efectivamente documentada

Al alinear las descripciones de la línea 2 con los nombres de la línea 4 de [dataset.md](../docs/datos-locales.md):

- `CCC`: código funcional específico del defecto.
- `VFG`: código funcional del defecto por componente.
- `VRT`: código funcional del defecto por área.
- `UC Nombre PUL a Reparar`: grupo que reparó el defecto; `Rep PUL`: subgrupo que reparó el defecto. Esto describe su uso, pero no expande la sigla PUL ni identifica sus valores.
- `Rep Respuesta a Pregunta Remplazar`: Y/N para reemplazo del componente durante reparación.
- `Componente Auditoría Adicional`: componente calibrado en esa auditoría.

No se observó un diccionario de valores de CCC/VFG/VRT ni de catálogo. No corresponde inventar expansiones de siglas, órdenes de gravedad o relaciones jerárquicas adicionales.

**Advertencia de cabecera:** hacia el final, la descripción «Resultado OK… y CALIBRADA…» está alineada con el nombre `Rep Respuesta a Pregunta Desensamblar`; `Unnamed: 38` con `Código de Catálogo`; y «Código de Catálogo del vehículo» con `Auditoría Adicional`. El primer registro tiene respectivamente `N`, `AFD5` y `OK`, compatible con los nombres de campos y con una desalineación de las descripciones. Es evidencia de cabecera y un único registro, no una validación general. No usar esa descripción para convertir Desensamblar en el target. Fuente: [dataset.md](../docs/datos-locales.md), líneas 2–5.

## Preguntas críticas para Ford, preparadas pero no enviadas

1. ¿Cuál es la lista oficial de archivos y formatos que deben entregarse el 2 de octubre, y cuáles son los límites del pitch y la demostración?
2. ¿La base contiene todas las unidades producidas, solo auditadas o otra población? ¿Qué significa `OK` para una unidad no auditada? ¿El muestreo del 5% es aleatorio y cuál es su ventana operativa?
3. ¿En qué instante se decide la Inspección Adicional y qué registros de inspección y reparación están disponibles entonces? ¿Cómo identificar eventos posteriores?
4. ¿Qué información ya entregada corresponde a los parámetros e instrumentales prometidos? ¿Quedan fuentes pendientes y para cuándo?
5. ¿Pueden confirmar la alineación de las últimas columnas y compartir diccionarios de CCC/VFG/VRT/PUL, catálogo y componente calibrado, y el significado de Desensamblar?
6. ¿Cómo se construyó la base ficticia y qué explica la anomalía temporal reportada después de `DIA_260`? ¿Qué afirmaciones de impacto esperan que se demuestren con datos sintéticos?

El Predictive Quality Passport, la predicción de componente, anomalías y aprendizaje continuo permanecen como alternativas por evaluar, no entregables exigidos. Fuente: [Innovación y posible concepto de producto](https://github.com/FordwardAI/ford-predictive-quality/blob/main/docs/fuentes/ford_predictive_quality_wayfinder.md#L332), líneas 332–455.
