---
name: ford-data-analysis
description: Auditar o explorar datos QLS de Ford, comparar entregas CSV y actualizar evidencia reproducible por evento y VIN. Usar ante cambios de dataset, preguntas de calidad, etiquetas, faltantes o cobertura temporal; no para elegir modelos ni resolver decisiones operativas sin el equipo.
---

# Análisis QLS reproducible

Trabajar desde la raíz del repo. Leer `AGENTS.md`, `CONTEXT.md`, `docs/datos-locales.md` y la pregunta del ticket. Para antecedentes, consultar `research/poblacion-etiquetas.md` y `research/audit-csv.json`; esos resultados están ligados a su hash, no a cualquier archivo con el mismo nombre.

## Identificar antes de calcular

- Usar exclusivamente entregas CSV como fuente de datos. Usar la ruta local proporcionada por el usuario; si el archivo falta, pedirlo. No buscar datos alternativos en servicios externos ni incorporar archivos crudos al repo.
- Registrar nombre de entrega, tamaño, SHA-256, codificación, delimitador y esquema. El CSV vigente tiene descripciones en el primer registro y nombres técnicos en el segundo; no usar la descripción como cabecera ni inferir por posición sin verificar nombres.
- No presuponer equivalencia entre entregas CSV. Ante una nueva versión, contrastar esquema, hash y resultados con el CSV de referencia cuando esté disponible; si no lo está, declarar el límite. No sobreescribir el archivo recibido.

## Reutilizar la auditoría

```sh
python3 research/test_audit_dataset.py
python3 research/audit_dataset.py "/ruta/al/archivo.csv"
```

Los argumentos son rutas del usuario, no ubicaciones fijas. Revisar la salida antes de guardar agregados en `research/`. Al comparar versiones CSV, preservar multiplicidades: un cambio de orden de filas no demuestra por sí solo pérdida de datos. No publicar filas individuales.

- Conservar identificadores y códigos como texto. No perder ceros iniciales ni redondear horas al cargar; el CSV usa coma decimal dentro de campos entrecomillados. Para operaciones aritméticas, hacer conversión explícita y documentar unidad/precisión; no asumir que hora numérica significa timestamp de auditoría.
- Distinguir vacíos, `NaN`, `#N/A` y códigos de negocio. La auditoría actual cuenta los tres primeros como faltantes; si aparecen otros tokens, describirlos antes de ampliar la regla. `#N/A` no debe convertirse en una fecha ni en cero.
- Los espacios finales o no separables pueden explicar diferencias entre entregas. Medirlas antes de normalizar categorías; una regla de equivalencia para comparar exports no autoriza modificar la fuente ni el experimento.
- Contar filas y VIN por separado; revisar etiquetas por VIN, repeticiones exactas, faltantes y componente de auditoría. No deduplicar por VIN: varias filas forman su historial.
- Analizar fechas de eventos y cohortes por primera fecha del VIN por separado. El corte DIA_260 es una observación histórica, no una regla para filtrar. Diferenciar ausencia de positivos en nuevas cohortes de ausencia de eventos positivos posteriores.
- Si el esquema o formato no cumple las comprobaciones del lector, explicar la discrepancia. No desactivar validaciones para obtener un resultado aparentemente válido.

## Producir evidencia, no decisiones implícitas

Guardar un informe acotado a la pregunta con fuente/hash, comando y versión del código, población/unidad, método, resultados agregados, límites y decisiones pendientes. Para tasas o gráficos, indicar denominador, período, nulos y filtros; si se muestrea, registrar método, semilla y tamaño. Un conteo completo no necesita una semilla ficticia.

Comprobar que las particiones de conteos reconcilian, que faltantes no se excluyen inadvertidamente del denominador y que los cambios frente al informe previo tienen explicación. Si se modifica el lector o cálculo, dejar una prueba sintética representativa y ejecutar la auditoría completa; no guardar registros reales como fixtures.

Separar observaciones de hipótesis sobre población, etiquetas y disponibilidad temporal. Resultado y componente de Auditoría Adicional no son predictores previos; otros campos tampoco son admisibles solo por llamarse inspección o reparación. No elegir exclusiones, imputaciones, splits, métricas ni modelos al actualizar un informe factual: llevar esas decisiones al ticket y al equipo.

Actualizar referencias afectadas y seguir la sincronización GitHub/Project de `AGENTS.md`. Una auditoría completada no cierra decisiones HITL dependientes ni acredita impacto en una planta real.
