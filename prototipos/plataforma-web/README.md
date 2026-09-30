# Plataforma web · prototipo de pantallas

Galería de pantallas clickeables de la plataforma web que se **propone** para la implementación y el escalado ([#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33)). No es un entregable del 2/10: la E3 sigue siendo la hoja de códigos prioritarios (planilla e imprimible). Nada está construido como aplicación.

- `index.html`: galería (una sección por grupo de funciones, cada pantalla en un marco de laptop 1440 × 994).
- `d-*.html`: una pantalla por archivo; los estados van en la URL (`?estado=…`, `?vista=ml`, `?c=<código>`, `?mercado=<mercado>`).
- `tokens.css`, `ui.css`, `app.js`: tokens de la guía de marca de Ford (sin logo), componentes, íconos inline, gráficos SVG.
- `exportar_datos.py`: genera `data.js` (`window.B = {...}`) con el paquete `solucion` del repo. **Toda cifra sale de `data.js`**: el HTML, el CSS y el JS no tienen datos incrustados.

## Regenerar

Desde esta carpeta, con el entorno del repo (Python 3.13, ver `solucion/README.md`):

```sh
../../.venv/bin/python exportar_datos.py \
  --csv "/ruta/a/Dataset QLS Inspección Adicional.csv" \
  --catalogo "/ruta/a/Códigos de catálogo.csv"
./shoot.sh v1
```

- `exportar_datos.py` verifica las huellas SHA-256 de las fuentes, usa la tabla enmascarada (sin etiquetas de Día ≥ 200) y arma la hoja del Día 190 con un programa simulado de ids ficticios (`U-0001…`). Opciones: `--repo` (por defecto, dos niveles arriba de esta carpeta), `--p6-detalle` (contrasta el componente y las alarmas con `p6-detalle.json` de la corrida), `--cache`, `--salida`. Al terminar busca en toda la carpeta cualquier VIN de la tabla y falla si encuentra uno.
- `shoot.sh` (Google Chrome sin interfaz; otra ruta con `CHROME=…`) escribe `shots/v1/`: una captura por sección, `0-galeria.png` y cada pantalla sola en `pantallas/`.
- Para verla: abrir `index.html` (file://) o `python3 -m http.server` desde esta carpeta.

## Reglas

- **`data.js` y `shots/` quedan fuera de Git**: tienen tasas reales por código de la base ficticia (igual que la hoja, que no se versiona).
- Cifras solo de validación (155–194), con el calificador «entre auditados con actividad QLS, [tramo], base ficticia, n = …». La prueba final figura como «pendiente de la sesión conjunta».
- Nunca un VIN: las unidades usan ids ficticios del programa simulado.
- Sin Ford Oval ni Signature; la tipografía FORD F-1 se usa solo si está instalada (no se descarga).

## Supuestos del prototipo (para revisar en equipo)

No salen de ninguna fuente; son propuestas de diseño:

- **Sin resultados de QLS:** la plataforma no arma la hoja (no puede verificar la huella de la fuente ni qué códigos vencen el mínimo por código). Propone un sorteo al azar con semilla registrada y marca el día como «sin hoja».
- **Rondas:** cinco rondas «cada 2 h aprox.»; el estado de la ronda 2 (unidades tomadas) es de ejemplo.
- **Importación del programa:** además de las validaciones que ya hace `solucion/hoja.leer_programa` (columnas y unidad repetida), se muestran código desconocido y fila vacía.
- **Roles:** Calidad de Planta, equipo de analistas y responsable técnico.
- **Días de control:** «alternar hoja y azar» u «otro patrón, a acordar con Ford»; el seguimiento reproduce la simulación de P5 en validación.
- **Detector el Día 190:** se muestran las alarmas conocidas ese día; las posteriores de la validación van aparte, como evidencia.
- **Selector de día:** solo el Día 190.
