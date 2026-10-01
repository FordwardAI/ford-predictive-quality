# Plataforma FordwardAI (MVP)

Propuesta de plataforma para la implementación, que funciona en la notebook. No es un sistema de Ford ni reemplaza a la E3: la hoja de códigos prioritarios sigue siendo el entregable y la plataforma la descarga igual (CSV, Excel e imprimible). Seguimiento en [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33).

## Para quién y qué decide

Es el MVP de cómo se usaría la solución en planta. El usuario principal es el **responsable de la selección**: el equipo de analistas que, cada ~2 h, elige en la playa de despacho qué unidades pasan a Auditoría Adicional. La decisión ocurre después de Gate Release, mientras las unidades esperan el despacho. Esa espera va de 0 a 5 días, así que en la playa conviven unidades de varios días. Se decide **por código** (etiqueta del parabrisas), y por eso una unidad de un día anterior se decide igual.

Cada dispositivo elige su rol en la primera pantalla (o con un acceso directo `?rol=seleccion` / `?rol=calidad`). Se puede cambiar desde el menú.

| Rol | Dónde | Pantallas |
| --- | --- | --- |
| **Selección en la playa** | Tablet o celular | **Selección**: qué buscar, «¿la envío?», enviadas con su resultado y deshacer, y terminar ronda. **Prioridades del día**: la hoja en solo lectura. |
| **Calidad de Planta** | Escritorio | **Día de planta**: entradas, cupo, modelo y armar la hoja. **Hoja del día**. **Seguimiento**. **Resultados**: acierto por unidad. **Modelo**: calendario de actualización automática, último cambio e historial. **Reporte para la línea**. **Evaluación**: la simulación frente al azar. |

### El ciclo en planta

1. **Entran las unidades de Gate Release.** Cada unidad llega con su código y su día (`POST /api/ingreso`). Espera en la playa de despacho de 0 a 5 días, así que la playa del día reúne las unidades de los últimos 5 días que no se enviaron ni despacharon.
2. **Calidad de Planta arma la hoja** con la playa, el cupo y la versión vigente del modelo. El cupo por defecto es el 5 % de lo que pasó Gate Release ese día. Hasta que la arma, la tablet muestra «Esperando la hoja» y la selección sigue al azar, como hoy.
3. **El responsable de la selección decide en la playa, cada ~2 h.**
   - Por cada vehículo escribe el código de la etiqueta y la app responde **Enviar a auditoría** o **No enviar**, con el motivo.
   - «Enviar» registra una unidad de ese código que está en la playa, la más antigua primero, y guarda la tasa y el puesto que tenía al decidir.
   - **Terminar ronda** pregunta qué faltó de lo buscado; lo que faltó baja al siguiente del ranking.
4. **Vuelve el resultado de la auditoría** (`POST /api/resultados`, la exportación de QLS con el resultado y el componente). Solo se aceptan resultados de unidades enviadas. **Resultados** muestra el acierto por unidad: CALIBRADA = acierto. La tablet lo muestra en su lista.
5. **El modelo se actualiza solo, con calendario fijo.** Cada versión es «el modelo con los resultados hasta el Día X»; entre versiones, el orden no cambia aunque lleguen resultados. La plataforma crea la versión nueva **cada 5 días desde el 155** (160, 165, 170…) al empezar el día, con los resultados de Día ≤ t − 5. Es el mismo esquema que se evaluó en validación para los modelos reentrenados (`solucion/ml.py`: `REENTRENO_DESDE`, `CADA`). Nadie decide cuándo: elegir el momento mirando los resultados es una forma de sobreajuste, y los resultados que vuelven son solo de lo que el modelo eligió. El calendario está fijo en `plataforma/modelo.py: PROGRAMA`, no en la pantalla. **Modelo** muestra la próxima actualización, qué cambió en el ranking con la última y el historial.
6. **Retorno a la línea.** El **Reporte para la línea** muestra, entre lo auditado, la tasa de calibración por código, versión, motor y mercado, los componentes más calibrados y la tendencia semanal. Se descarga en CSV, solo con agregados. El componente no se usa para predecir, porque es el resultado; acá es información para mejorar la producción.

### Contrato de las entradas

Los tres endpoints reciben JSON `{"filas": [...]}` o CSV con encabezado, como texto (`{"csv": "..."}`). La pantalla Día de planta importa los CSV. Cada importación es todo o nada: si una fila falla, no entra ninguna y la respuesta dice cuál fila y por qué.

| Entrada | Columnas | Validaciones |
| --- | --- | --- |
| `POST /api/ingreso` (Gate Release) | `unidad,codigo,dia` | Sin vacíos; código del catálogo; unidad no ingresada antes |
| `POST /api/resultados` (QLS) | `unidad,resultado,dia[,componente]` | `OK` o `CALIBRADA`; la unidad tiene que estar enviada y sin resultado |
| `POST /api/despacho` (opcional) | `unidad,dia` | Si no llega, la unidad sale de la playa por la ventana de 5 días |

En planta, `unidad` es el VIN y queda dentro de la planta. El filtro de privacidad solo bloquea los VIN de la base ficticia.

### Fuente simulada (mientras no haya conexión con Ford)

**Avanzar al día siguiente** reproduce la base con el mismo contrato:
- ingresan las unidades con Día del VIN = t + 1, con ids `U<día>-<n>` (supuesto: el Día del VIN aproxima el Gate Release);
- cada unidad espera en la playa de 0 a 5 días;
- los resultados de lo enviado vuelven entre 1 y 5 días después, con la etiqueta y el componente de la base. Solo de lo enviado: lo no auditado nunca revela su resultado.

Las semillas están registradas en `plataforma/simulador.py`. El reloj arranca en el Día 155, con el histórico de auditorías al azar (Día ≤ 149) como punto de partida (versión 1), igual que P5, y llega hasta el 194. El almacén es sqlite y vive fuera del repo (`~/.cache/ford-predictive-quality/plataforma/planta.db`).

## Cómo correrla

Desde la raíz, con el entorno de [`solucion/README.md`](../solucion/README.md):

```sh
.venv/bin/python -m plataforma.servidor --csv "<Dataset QLS Inspección Adicional.csv>" --catalogo "<Códigos de catálogo.csv>"
```

Abrir `http://127.0.0.1:8765`. La primera vez, la pantalla Evaluación tarda alrededor de un minuto: reentrena los modelos día por día con las cinco semillas. Después queda en caché fuera del repo (`~/.cache/ford-predictive-quality/plataforma/`), igual que el almacén de planta y el estado del día.

```sh
.venv/bin/python -m plataforma.test_plataforma   # lógica del día y filtro sin VIN (sintéticas, sin CSV)
.venv/bin/python -m plataforma.verificar_ds      # control del design system sobre front/src
```

### Frontend

`front/` tiene el código: React 19, TypeScript, Vite, Tailwind v4 y componentes de [shadcn/ui](https://ui.shadcn.com) (Radix), más Recharts para el gráfico. Las versiones están fijadas en `package.json` y `package-lock.json`. El build se versiona en `web/`, así que para correr la demo alcanza con Python. Solo hace falta Node (probado con 26) para cambiar la interfaz:

```sh
cd plataforma/front
npm ci
npm run dev     # http://localhost:5173; /api va al servidor Python en el puerto 8765
npm run build   # regenera plataforma/web
```

Criterio de la interfaz: cada pantalla muestra primero la decisión, y el detalle queda a un clic.

| Pantalla | A la vista | A un clic |
| --- | --- | --- |
| Selección | El cupo, qué buscar y la respuesta para el código escrito | Deshacer (en el aviso y en la lista de enviadas), terminar la ronda (diálogo) |
| Hoja | Códigos a auditar, cantidad y avance | Ranking completo (pestaña), detalle del código (panel lateral), metodología (diálogo «Cómo leerla») |
| Día de planta | Entradas del día, versión vigente y armar la hoja | Importar CSV, el contrato de cada entrada (tooltip) |
| Modelo | Próxima actualización programada | Qué cambió en el ranking, el historial de versiones |
| Evaluación | Cifras y curva | Comparación y tabla por día (pestañas) |
| Contexto | Insignia «Base ficticia» | Calificador, huellas de la fuente y límites (tooltip) |

## Qué es real y qué es supuesto

- **Real (código de `solucion/`):**
  - carga enmascarada y protocolo de puntaje (Día ≤ t − 5);
  - cupo diario y armado de la hoja (`hoja.armar`);
  - reasignación cuando un código no llega (`hoja.reasignar`);
  - etiquetas parciales: el modelo solo conoce el histórico y lo auditado (`puntaje.Fuente`, como en P5). `hoja.armar` recibe esa fuente con el parámetro opcional `fuente`;
  - evaluador (`cupo.simular`, `cupo.metricas`).
- **Modelos:**
  - Random Forest con atributos, reentrenado cada 5 días: elección por efectividad del 01/10, por defecto.
  - CatBoost con atributos, reentrenado: segunda lectura.
  - Tasa fija: preregistrada.
  - RF y CatBoost se ajustan con `ml.ajustar` (log-loss interna ≤ 149) y la semilla 1. Para que una corrida no se lea como cifra exacta, la simulación informa el rango de aciertos entre las 5 semillas.
  - Tasa fija reproduce `eleccion.json` (59/391).
- **Prueba final:** se muestran las lecturas ya registradas en `solucion/resultados/prueba-final.json`; no se recalculan. RF no tiene lectura.
- **Supuestos de la demo:**
  - Días: solo validación (155–194).
  - Gate Release: el Día del VIN lo aproxima.
  - Espera en la playa: de 0 a 5 días. Demora de los resultados: de 1 a 5 días.
  - Ronda: un código que no se marca se supone llegado.
  - Días sin Gate Release en la base: el cupo es 0, salvo que Calidad fije otro.
  - Evaluación es la simulación fuera de línea con todas las etiquetas de validación; el ciclo de planta, en cambio, aprende solo de lo auditado. Por eso sus precisiones no coinciden.
- **Descargas:** el texto de evaluación de los archivos lo arma `solucion/hoja.py`, que todavía dice «La prueba final todavía no se corrió». La pantalla lo reemplaza por la lectura registrada del modelo.

## Reglas de datos

- **Ningún VIN sale del servidor.** Cada respuesta y cada descarga pasa por `privacidad.revisar` contra los VIN de la tabla. El mapa id → VIN de la fuente simulada vive solo en memoria y se reconstruye con semillas.
- **La tabla está enmascarada para Día ≥ 200.** La plataforma no relee la prueba final.
- **Fuera del repo:** el almacén de planta, el estado, el caché y las descargas. El reporte para la línea solo exporta agregados.

## Design system

La norma es `ford-design-system.md` (Ford Brand Central, extraído el 30/09/2026; el archivo queda fuera del repo). El tema (`front/src/index.css`) **borra** los valores por defecto de Tailwind y deja solo los de la marca, así que ningún componente de shadcn puede salirse aunque traiga sus clases:

- **Color (§1):** solo los 7 colores de la paleta, mapeados a los roles de shadcn: el CTA en Skyview, el texto en Ford Blue y los fondos en blanco o `#F0F0F0`. No hay rojo ni verde: los estados se distinguen con ícono y texto. La única transparencia es el velo de los paneles, Twilight al 60 %, que propone §9.9.
- **Forma (§4):** sin sombras. Radios de 8, 12 y 16 px, y píldora en los botones.
- **Letra (§2):** 4 tamaños (16, 20, 24 y 40 px) y pesos 400/500. Las clases `text-sm` o `font-bold` de shadcn caen en esos valores.
- **Botones (§5):** CTA de 76 px con radio 16, outline de 3 px y compacto de 2 px.
- **Componentes:** se ajustaron los de shadcn: se sacaron el modo oscuro y las transparencias, y se corrigieron el selector de dos opciones y el fondo de la barra de progreso.
- **Íconos:** [lucide](https://lucide.dev) en toda la interfaz (la librería de shadcn), con trazo de 2 px. El sistema de íconos de Ford (§7) es solo para marketing.
- **Logo (§6):** el logo de Ford del equipo, en blanco sobre Ford Blue. Solo se volvió transparente su fondo, `#02193B`, que no está en la paleta; el script queda igual. El nombre FordwardAI va al pie del panel.
- **Control:** `verificar_ds.py` falla si algo de esto se rompe. En el navegador se verificó además que los colores, tamaños y pesos calculados están dentro de la norma.
