# Plataforma FordwardAI (MVP)

Propuesta de plataforma para la implementación, que funciona en la notebook. No es un sistema de Ford ni reemplaza a la E3: la hoja de códigos prioritarios sigue siendo el entregable y la plataforma la descarga igual (CSV, Excel e imprimible). Seguimiento en [#33](https://github.com/FordwardAI/ford-predictive-quality/issues/33).

## Para quién y qué decide

Es el MVP de cómo se usaría la solución en planta. El usuario principal es el **responsable de la selección**: el equipo de analistas que, cada ~2 h, elige en la playa de despacho qué unidades pasan a Auditoría Adicional. La decisión ocurre después de Gate Release, mientras las unidades esperan el despacho. Esa espera va de 0 a 5 días, así que en la playa conviven unidades de varios días. Se decide **por código** (etiqueta del parabrisas), y por eso una unidad de un día anterior se decide igual.

Cada dispositivo elige su rol en la primera pantalla. Se puede cambiar desde el menú.

| Rol | Dónde | Pantallas |
| --- | --- | --- |
| **Selección en la playa** | Tablet o celular | **Selección**: qué buscar, «¿la envío?», enviadas con deshacer y terminar ronda. **Prioridades del día**: la hoja en solo lectura. |
| **Calidad de Planta** | Escritorio | **Preparar el día**: programa, cupo y modelo. **Hoja del día**: ranking, detalle y descargas. **Seguimiento**: avance por código, rondas y cierre. **Evaluación**: la simulación frente al azar. |

### Un día en planta

1. **Inicio del día (Calidad de Planta).** Carga el programa y el cupo, y arma la hoja. Hasta que la arma, la tablet muestra «Esperando la hoja» y la selección sigue al azar, como hoy.
2. **Cada ~2 h (Selección).** El analista mira *qué buscar* (códigos con cantidad pendiente, por prioridad) y recorre la playa. Por cada vehículo escribe el código y la app responde **Enviar a auditoría** o **No enviar**, con el motivo. Si se equivoca, **deshace** el envío.
3. **Fin de la ronda (Selección).** **Terminar ronda** pregunta solo por lo que se buscaba: qué código no estaba o tenía menos unidades. Lo que faltó baja al siguiente del ranking, con la regla de la hoja.
4. **Durante el día (Calidad de Planta).** **Seguimiento** se actualiza solo cada 15 s con lo que registra la tablet. Al final, el cierre del día; en la demo, el resultado en agregado, porque es un día de validación.

## Cómo correrla

Desde la raíz, con el entorno de [`solucion/README.md`](../solucion/README.md):

```sh
.venv/bin/python -m plataforma.servidor --csv "<Dataset QLS Inspección Adicional.csv>" --catalogo "<Códigos de catálogo.csv>"
```

Abrir `http://127.0.0.1:8765`. La primera vez la simulación tarda alrededor de un minuto: reentrena los modelos día por día con las cinco semillas. Después queda en caché fuera del repo (`~/.cache/ford-predictive-quality/plataforma/`), igual que el estado del día.

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
| Simulación | Cifras y curva | Comparación y tabla por día (pestañas) |
| Contexto | Insignia «Base ficticia» | Calificador, huellas de la fuente y límites (tooltip) |

## Qué es real y qué es supuesto

- **Real (código de `solucion/`):**
  - carga enmascarada y protocolo de puntaje (Día ≤ t − 5);
  - cupo diario y armado de la hoja (`hoja.armar`);
  - reasignación cuando un código no llega (`hoja.reasignar`);
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
  - Programa del día: simulado con las unidades de la base (ids `U-…`), o subido como CSV `unidad,codigo`.
  - Ronda: un código que no se marca se supone llegado según el programa.
  - Cierre del día: revela en agregado cuántas de las tomadas se calibraron. Solo es posible porque el día es de validación; en planta se sabría después de la Auditoría Adicional.
- **Descargas:** el texto de evaluación de los archivos lo arma `solucion/hoja.py`, que todavía dice «La prueba final todavía no se corrió». La pantalla lo reemplaza por la lectura registrada del modelo.

## Reglas de datos

- **Ningún VIN sale del servidor.** Cada respuesta y cada descarga pasa por `privacidad.revisar` contra los VIN de la tabla. El mapa id → VIN del programa simulado vive solo en memoria.
- **La tabla está enmascarada para Día ≥ 200.** La plataforma no relee la prueba final.
- **Fuera del repo:** el estado, el caché y las descargas.

## Design system

La norma es `ford-design-system.md` (Ford Brand Central, extraído el 30/09/2026; el archivo queda fuera del repo). El tema (`front/src/index.css`) **borra** los valores por defecto de Tailwind y deja solo los de la marca, así que ningún componente de shadcn puede salirse aunque traiga sus clases:

- **Color (§1):** solo los 7 colores de la paleta, mapeados a los roles de shadcn: el CTA en Skyview, el texto en Ford Blue y los fondos en blanco o `#F0F0F0`. No hay rojo ni verde: los estados se distinguen con ícono y texto. La única transparencia es el velo de los paneles, Twilight al 60 %, que propone §9.9.
- **Forma (§4):** sin sombras. Radios de 8, 12 y 16 px, y píldora en los botones.
- **Letra (§2):** 4 tamaños (16, 20, 24 y 40 px) y pesos 400/500. Las clases `text-sm` o `font-bold` de shadcn caen en esos valores.
- **Botones (§5):** CTA de 76 px con radio 16, outline de 3 px y compacto de 2 px.
- **Componentes:** se ajustaron los de shadcn: se sacaron el modo oscuro y las transparencias, y se corrigieron el selector de dos opciones y el fondo de la barra de progreso.
- **Íconos:** la navegación y las acciones principales usan íconos propios con la geometría de §7. Las indicaciones chicas de los componentes (flechas, cerrar) usan lucide, que es lo que trae shadcn.
- **Logo (§6):** el logo de Ford del equipo, en blanco sobre Ford Blue. Solo se volvió transparente su fondo, `#02193B`, que no está en la paleta; el script queda igual. El nombre FordwardAI va al pie del panel.
- **Control:** `verificar_ds.py` falla si algo de esto se rompe. En el navegador se verificó además que los colores, tamaños y pesos calculados están dentro de la norma.
