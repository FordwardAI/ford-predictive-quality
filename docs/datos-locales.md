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

## Correspondencia con el Markdown anterior

El Markdown histórico `dataset.md` tiene 78.164.273 bytes y SHA-256 `5f0e6dc11262fb4ff675797ebfe51c1d43feafc0029c5dcc3f2bd4574c56c3e2`. Sus descripciones están en la línea 2, el separador en la 3 y los nombres técnicos en la 4.

```sh
python3 research/audit_dataset.py "/ruta/al/Dataset QLS Inspección Adicional.csv" --compare-markdown /ruta/al/dataset.md
```

Se compararon las 195.808 filas en su orden y sus 41 campos: coinciden los nombres técnicos, VIN, etiquetas y todos los agregados publicados. Las diferencias en celdas de datos se explican por representación de faltantes, espacios o precisión de horas; no se detectaron diferencias sin explicar bajo esas reglas. Esto no significa igualdad textual ni igualdad exacta de las horas.

Las 391.616 celdas de horas difieren y son compatibles con el redondeo del Markdown a seis posiciones decimales (tolerancia absoluta de 0,0000005). La diferencia máxima es 0,0000005 en la escala numérica almacenada. Si esa escala es fracción de día, equivale a 0,0432 segundos; la interpretación operativa sigue pendiente de confirmación. El CSV conserva más precisión de representación, no demuestra mayor exactitud del dato de origen.

El CSV conserva espacios finales en algunos campos; también hay diferencias entre espacios comunes y no separables del Markdown. La comparación identifica esas diferencias, pero no limpia ni sobrescribe el CSV. Las descripciones finales continúan desalineadas: posición 38 describe el resultado y nombra Desensamblar; 39 tiene descripción vacía y nombra Código de Catálogo; 40 describe catálogo y nombra Auditoría Adicional.

No se verificó equivalencia con `table.xlsx`. Las dudas sobre población, disponibilidad temporal y DIA_260 siguen abiertas. Cualquier nueva entrega debe auditarse y compararse antes de trasladar estos resultados.
