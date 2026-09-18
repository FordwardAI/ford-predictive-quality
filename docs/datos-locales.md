# Fuente de datos de la investigación

Los conteos del informe se calcularon sobre el archivo `dataset.md` entregado al equipo. La base no forma parte de este repositorio de planificación; cada integrante debe disponer de su copia para reproducir la auditoría.

- Tamaño analizado: 78.164.273 bytes.
- SHA-256: `5f0e6dc11262fb4ff675797ebfe51c1d43feafc0029c5dcc3f2bd4574c56c3e2`.
- Línea 2: descripciones de columnas; línea 3: separadores Markdown; línea 4: nombres técnicos; línea 5: primer registro.
- Existe también un `table.xlsx` de origen; no se verificó equivalencia entre ambos archivos.

Desde la raíz del repositorio:

```sh
python3 research/audit_dataset.py /ruta/al/dataset.md
```

La salida contiene solo conteos agregados y comprobaciones de integridad. La investigación no elimina registros ni entrena modelos.

Para el próximo análisis, el usuario proporcionará un CSV: avisarle cuando sea necesario. Los conteos y el hash anteriores identifican exclusivamente el Markdown ya auditado; verificar esquema y correspondencia antes de reutilizarlos para el CSV.
