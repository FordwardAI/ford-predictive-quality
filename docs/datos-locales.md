# Fuente de datos de la investigación

Desde el 18 de septiembre de 2026, la fuente vigente es **Dataset QLS Inspección Adicional.csv**, proporcionado por el usuario. El archivo permanece fuera del repositorio; se versionan solamente el código, los informes y los resultados agregados.

- Tamaño: 54.586.528 bytes.
- SHA-256: `a24860d86afdd841d1c9c4ac12155a861299b80dbc161bcd17d2aaff43c5a82b`.
- UTF-8, delimitador coma y comillas dobles; finales de línea CRLF.
- Primer registro CSV: descripciones. Segundo: 41 nombres técnicos únicos. Tercero: primer evento. No usar las descripciones como encabezados.
- Las horas usan coma decimal dentro de campos entrecomillados; se conservan como texto exacto durante la auditoría, sin redondearlas.
- Faltantes observados: campos vacíos y nueve `#N/A` en Fecha Reparación. El lector también reconoce `NaN` para reproducir el Markdown histórico.

Desde la raíz del repositorio, usando Python 3:

```sh
python3 research/audit_dataset.py "/ruta/al/Dataset QLS Inspección Adicional.csv"
python3 research/test_audit_dataset.py
```

Usar el nombre exacto del archivo local: las tildes pueden tener distinta normalización Unicode. El hash identifica el contenido independientemente del nombre o ubicación.

La [salida agregada versionada](../research/audit-csv.json) incluye la auditoría completa y la comparación con la entrega anterior. No contiene VIN individuales ni filas de datos. La auditoría no elimina registros, elige variables ni entrena modelos.

Los conteos de las particiones de validación acordadas en [¿Qué validación permite evaluar el uso propuesto sin fuga de información?](https://github.com/FordwardAI/ford-predictive-quality/issues/7) se reproducen así:

```sh
python3 research/validation_partitions.py "/ruta/al/Dataset QLS Inspección Adicional.csv" > research/validation-partitions.json
python3 research/test_validation_partitions.py
```

La [salida](../research/validation-partitions.json) contiene solo agregados por partición (VIN, CALIBRADA, porcentaje y cupo del 5%). No entrena ni evalúa modelos.

## Agrupación de códigos de catálogo

Desde el 29 de septiembre de 2026 se cuenta también con **Códigos de catálogo.csv**, proporcionado por el usuario y guardado fuera del repositorio, junto a la base.

- Tamaño: 7.079 bytes.
- SHA-256: `89e5a9d9c4312a408f996bea3e170e44428827a458fa62d76936648e1733e047`.
- UTF-8 y delimitador coma. La fila 1 es el título y la 3 los encabezados. Contiene tres tablas lado a lado que no comparten filas: motor, tracción y mercado, cada una con sus 98 códigos.

```sh
python3 research/catalog_groups.py "/ruta/al/Dataset QLS Inspección Adicional.csv" "/ruta/a/Códigos de catálogo.csv" > research/catalog-groups.json
python3 research/test_catalog_groups.py
```

La [salida](../research/catalog-groups.json) publica solo agregados por grupo, sin el diccionario por código. Los hallazgos están en el [registro de la agrupación](../research/catalogo-agrupacion.md).

## Prueba de concepto

El código de [Construir la prueba de concepto y los entregables para el Trials Day](https://github.com/FordwardAI/ford-predictive-quality/issues/33) vive en `solucion/` y verifica los dos hashes de arriba antes de calcular. Las etiquetas de Día ≥200 quedan enmascaradas al cargar; solo las desbloquea el preregistro acordado. Entorno y detalle en [solucion/README.md](../solucion/README.md).

```sh
.venv/bin/python -m solucion.run --csv "/ruta/al/Dataset QLS Inspección Adicional.csv" --catalogo "/ruta/a/Códigos de catálogo.csv"
.venv/bin/python -m solucion.pruebas
```

Los resultados versionados (`solucion/resultados/`) son agregados por alternativa y por día, sin VIN ni tasas por código. La hoja de códigos prioritarios se genera fuera del repo (`--salida`).

## Planilla original

`QLTY Download Sept 24/table.xlsx` (30,4 MB, en la carpeta de Ford del 24/09, fuera del repo) es la planilla Excel de la que se exportó el CSV vigente: una hoja con la tabla A2:AO195810, las mismas descripciones y los mismos 41 nombres técnicos, y 195.808 filas con las mismas claves (VIN, fechas, código, resultado y componente). Las horas están como números y hay 9 errores en Fecha Reparación, que son los `#N/A` del CSV. No trae diccionario ni otras hojas. No es una fuente nueva: se sigue usando el CSV. Revisión del 29/09/2026 en [¿La especificación permite repartir el trabajo sin decisiones críticas pendientes?](https://github.com/FordwardAI/ford-predictive-quality/issues/13); no se compararon celda por celda las horas ni el texto libre.

## Correspondencia con el Markdown anterior

El Markdown histórico `dataset.md` tiene 78.164.273 bytes y SHA-256 `5f0e6dc11262fb4ff675797ebfe51c1d43feafc0029c5dcc3f2bd4574c56c3e2`. Sus descripciones están en la línea 2, el separador en la 3 y los nombres técnicos en la 4.

```sh
python3 research/audit_dataset.py "/ruta/al/Dataset QLS Inspección Adicional.csv" --compare-markdown /ruta/al/dataset.md
```

Se compararon las 195.808 filas en su orden y sus 41 campos: coinciden los nombres técnicos, VIN, etiquetas y todos los agregados publicados. Las diferencias en celdas de datos se explican por representación de faltantes, espacios o precisión de horas; no se detectaron diferencias sin explicar bajo esas reglas. Esto no significa igualdad textual ni igualdad exacta de las horas.

Las 391.616 celdas de horas difieren y son compatibles con el redondeo del Markdown a seis posiciones decimales (tolerancia absoluta de 0,0000005). La diferencia máxima es 0,0000005 en la escala numérica almacenada. Si esa escala es fracción de día, equivale a 0,0432 segundos; la interpretación operativa sigue pendiente de confirmación. El CSV conserva más precisión de representación, no demuestra mayor exactitud del dato de origen.

El CSV conserva espacios finales en algunos campos; también hay diferencias entre espacios comunes y no separables del Markdown. La comparación identifica esas diferencias, pero no limpia ni sobrescribe el CSV. Las descripciones finales continúan desalineadas: posición 38 describe el resultado y nombra Desensamblar; 39 tiene descripción vacía y nombra Código de Catálogo; 40 describe catálogo y nombra Auditoría Adicional.

No se verificó equivalencia con `table.xlsx`. Ford respondió sobre la población el 29/09: la base reúne solo auditados con actividad QLS ([#29](https://github.com/FordwardAI/ford-predictive-quality/issues/29)). La disponibilidad temporal del historial y la causa del patrón posterior a DIA_260 siguen abiertas. Cualquier nueva entrega debe auditarse y compararse antes de trasladar estos resultados.
