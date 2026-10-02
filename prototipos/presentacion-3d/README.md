# Presentación 3D interactiva

Sitio estático para presentar la solución de FordwardAI en el Trials Day (2/10/2026): 20 pantallas sobre una escena 3D oscura (línea de producción simulada y un vehículo en modo x-ray con puntos interactivos) que se recorren con scroll **o** con flechas, como diapositivas. Un toque de flecha muestra la pantalla entera: no hay pasos ni nada que abrir. Lo acompaña el [speech de la presentación](../../docs/entrega/speech-presentacion.md) y cubre las secciones del template del Informe (01 a 06, con 2.1 a 2.3).

Es **la presentación** del equipo (E1). El contenido sale de los borradores de [`docs/entrega/`](../../docs/entrega/) y las cifras, de los agregados de [`solucion/resultados/`](../../solucion/resultados/).

## Cómo abrirlo

Desde la **raíz del repo** (las figuras y los JSON se leen con rutas relativas `../../`):

```sh
python3 -m http.server 8000   # en Windows: python -m http.server 8000
```

y abrir <http://localhost:8000/prototipos/presentacion-3d/>. En Claude Code también está la configuración `presentacion-3d` en `.claude/launch.json`.

**Requiere internet:** three.js, GSAP y Roboto se cargan por CDN (jsDelivr, cdnjs y Google Fonts). Sin build, sin Node y sin npm. Si se abre como `file://`, los JSON no se pueden leer y las cifras usan su respaldo (ver [Cifras](#cifras)).

## Cómo se recorre

Cada pantalla tiene antetítulo, titular, bajada y, según el caso, hasta 3 cifras, callouts (los puntos de la escena), una figura y hasta 3 tarjetas. Está pensada para proyector: pocas palabras, letra grande (referencia 1920×1080, titular de 108 px, nada por debajo de 18 px) y todo escala en proporción en 1366×768.

- **Un toque = toda la pantalla.** `→` (o espacio, PgDn, ↓) pasa a la pantalla siguiente y muestra todo su contenido con una entrada en cascada corta (≈ 1,2 s); `←` (o PgUp, ↑) vuelve a la anterior, también completa. Las pulsaciones rápidas se encadenan sin esperar a que termine la animación.
- **Captura ampliada (pasador).** En las siete pantallas de la plataforma (`figura.ampliar: true` en `contenido.js`) el primer «siguiente» agranda la captura hasta casi toda la pantalla y atenúa el resto; el segundo pasa a la pantalla siguiente. «Anterior» con la captura ampliada la vuelve a su lugar. Llegar por scroll, índice o enlace la muestra sin ampliar.
- **Con scroll** (rueda, trackpad, barra): al llegar a una pantalla entra con la misma cascada.
- En las pantallas de la **línea de producción** (`proceso` y `pregunta`) el vehículo recorre la línea solo al llegar (salvo `pregunta`, que lleva `continua: true` y arranca quieta en Auditoría Adicional, donde terminó `proceso`) y la escena enfoca cada estación con callout al pasar por ella. La duración sale del campo `recorrido` de cada pantalla (por defecto 6 s): `proceso` tarda ≈ 28 s para que se aprecie cada estación, la línea mide ≈ 162 unidades. En las pantallas con varios puntos sobre el vehículo, el foco rota entre ellos cada 3 s. El panel de escaneo del túnel de Auditoría Adicional (visible en `proceso` y `aprende`) hace un ciclo de ida y vuelta cada ≈ 14 s, con las rayas casi quietas (`VELOCIDAD_ESCANEO` y `VELOCIDAD_RAYAS` en `escena/fabrica.js`). Un click en un callout o en un punto 3D enfoca ese punto.
- La URL guarda la pantalla (`#hoja`): al recargar se vuelve al mismo lugar.
- El pie muestra `07 / 19` (pantalla / última pantalla; se numera desde `00`) y la sección. A la derecha, el **riel**: una marca igual por pantalla (la actual, en azul); un clic en una marca va a esa pantalla y su nombre aparece al pasar el mouse.
- Las notas del orador (`N`) muestran las notas, el **respaldo para preguntas** (la `ampliacion` de la pantalla, que no se proyecta) y el título de la pantalla siguiente.

Pantallas: 00 portada · 01 `proceso` · 02 `pregunta` · 03 `predictor` · 04 `validacion` · 05 `alternativas` · 06 `solucion` · 07 `resultado` · 08 `seguridad` · 09 `factibilidad` · 10 `plataforma-dia` · 11 `hoja` · 12 `plataforma-playa` · 13 `plataforma-seguimiento` · 14 `plataforma-resultados` · 15 `plataforma-modelo` · 16 `plataforma-linea` · 17 `futuro` · 18 `conclusiones` · 19 cierre. La **implementación** va junta al final del cuerpo (10 a 17, sección 05): son las pantallas donde se muestran las capturas de la aplicación; las siete del flujo (`flujo-*.png`) siguen el ciclo de planta de `plataforma/README.md`.

**La solución y el resultado** son de CatBoost con atributos del código, reentrenado cada 5 días (vida media 15 días, semilla 1):

- `alternativas` cuenta la elección por precisión en cinco bloques de tiempo (propuesta aprobada el 30/09; [`precision.json`](../../solucion/resultados/precision.json)): 54 alternativas, un punto por alternativa en la figura `seleccion`, con CatBoost, el azar y el oráculo rotulados y las demás anónimas.
- `solucion` presenta CatBoost con sus límites: es la más precisa de una familia que empata y en el último bloque (confirmación) baja, dentro del ruido.
- `resultado` muestra solo la lectura preregistrada de CatBoost en la prueba final (`corridas[1]` de [`prueba-final.json`](../../solucion/resultados/prueba-final.json)), por tramo, y advierte que es una lectura más débil porque el equipo ya conocía otra lectura previa. Las otras lecturas quedan solo en el respaldo del orador (`ampliacion` de `resultado`).
- Las piezas de «dónde mirar», mínimo por código, detector y la hoja de ensayo del Día 190 se evaluaron con el predictor de la primera etapa; sus rótulos lo dicen y no se atribuyen a CatBoost.

## Atajos de teclado

| Tecla | Acción |
| --- | --- |
| → / espacio / PgDn | Pantalla siguiente, con todo su contenido |
| ← / Shift+espacio / PgUp | Pantalla anterior, completa |
| ↓ / ↑ | Igual que → / ← (si una pantalla no entrara en la ventana, primero la recorren) |
| Inicio / Fin | Portada / cierre |
| 0–6 | Ir a la portada (0) o a la primera pantalla de la sección 01–06 |
| I / Esc | Abrir o cerrar el índice (las 20 pantallas) |
| N | Abrir las notas del orador en otra ventana (notas, respaldo para preguntas y pantalla siguiente; sus botones también avanzan) |
| F | Pantalla completa |
| O | Activar o desactivar la órbita con el mouse (en los capítulos que la permiten) |
| L | Calidad de la escena: alta → bajo consumo → automática |

## Modos

| Parámetro | Qué hace |
| --- | --- |
| `?nucleo=1` | Solo los capítulos con `nucleo: true` (hoy son las 20 pantallas) |
| `?estatico=1` | Sin WebGL: diapositivas sobre un fondo CSS. Para proyectores lentos o si falla la escena |
| `?calidad=alta` / `baja` / `auto` | Calidad inicial de la escena (la tecla `L` la cambia en vivo). `baja` es el modo de bajo consumo para notebook a batería |
| `?limpio=1` | Oculta los chips `[PENDIENTE: …]` (el índice sigue contando cuántos hay) |
| `?debug` | Información de depuración; en la consola avisa qué cifras usan respaldo |

Los parámetros se combinan: `?nucleo=1&limpio=1&calidad=baja`.

Con **movimiento reducido** activado en el sistema operativo no hay animaciones: cada pantalla aparece completa de una vez y el vehículo queda quieto en su posición final. Al **imprimir** (o guardar como PDF) sale una pantalla por página, en claro y con todo visible.

## Figuras, ilustraciones y capturas

- **Figuras de datos:** [`figuras.js`](figuras.js) las dibuja como SVG oscuro desde los agregados de `solucion/resultados/*.json` (elección por precisión `seleccion`, particiones, veces el azar de CatBoost en la prueba final, comparación de alternativas en validación, dónde mirar, etiquetas parciales y detector). Si no puede, la pantalla usa el SVG de matplotlib de [`docs/entrega/figuras/`](../../docs/entrega/figuras/) como respaldo cuando lo declara; `seleccion` y `veces_azar_prueba_final` no tienen respaldo y, si no se pueden dibujar, la pantalla queda sin figura. Los colores salen de las variables `--figura-*` de `styles.css`.
- **Ilustraciones a mano:** `assets/ilustraciones/` (proceso, solución y esquemas sin datos de la hoja y de la plataforma), versionadas e insertadas en línea para que tomen los colores del tema.
- **Capturas locales:** la hoja y la plataforma muestran tasas por código, así que sus capturas **no se versionan**. Las pantallas del flujo (`plataforma-*` y `hoja`) usan `flujo-*.png`, que genera `herramientas/capturar_flujo.sh` con la [plataforma](../../plataforma/README.md) y deja en `assets/local/` (fuera de Git); la hoja también toma `assets/local/captura-hoja-dia-260.png` si existe. Sin ellas se ve el esquema sin números con un chip «Captura local pendiente».

## Herramientas

| Archivo | Para qué |
| --- | --- |
| `herramientas/capturar_flujo.sh` | Las capturas `flujo-*.png` de la plataforma (levanta su propio servidor, recorre los días 155 a 166 con CatBoost; necesita el CSV y el catálogo fuera del repo, `FORD_CSV` y `FORD_CATALOGO`) y las deja en `assets/local/` |
| `herramientas/figuras-demo.html` | Revisar las figuras de `figuras.js` y las ilustraciones en tema oscuro y claro (`?solo=<id>&tema=claro`) |
| `herramientas/renderizar.*` | Renders de la escena 3D para `?estatico=1`, portada y documentación |
| `escena/demo.html` | Probar la escena sola. Parámetros: `?escena=<id>&p=<0..1>`, `?env=estudio\|room` (entorno de luz), `?calidad=alta\|baja\|auto`, `?modelo=procedural` (sin el GLB), `?reducido` (sin transiciones), `?orbita`, `?anclas=1` (mover las anclas de los hotspots y copiar el JSON desde la consola) y `?captura=1` (un cuadro sin interfaz, lo usa `renderizar.*`) |
| `verificar_cifras.py` | Comprobar que los respaldos de `cifras.js` coinciden con los JSON |

## El vehículo

El modelo es **ilustrativo**: la base de datos no dice qué modelo de vehículo se produce. Si no existe `assets/ranger.glb`, la escena usa una pickup procedural construida en código, así que el sitio funciona sin descargar nada.

Para usar el modelo 3D:

1. Descargarlo **a mano** (requiere cuenta en Sketchfab y aceptar su licencia CC-BY 4.0): [Ford Ranger Next-Gen 2023 Sport, de Asadawut.Kaewma](https://sketchfab.com/3d-models/ford-ranger-next-gen-2023-sport-e93ac097ee9a46a4a9decca9aceed03c), formato «Autoconverted format (glTF)». Descomprimirlo en `assets/fuente/` (no se versiona).
2. Optimizarlo (Node necesario solo para este paso, fuera del sitio):

   ```sh
   npx @gltf-transform/cli@4 optimize prototipos/presentacion-3d/assets/fuente/scene.gltf \
     prototipos/presentacion-3d/assets/ranger.glb --compress draco --simplify false \
     --weld false --texture-compress webp --texture-size 1024
   ```

3. Meta: **menos de 5 MB**. `assets/.gitignore` ignora todo salvo `ranger.glb`; si queda por encima de 5 MB, no se versiona. Antes de subirlo, revisar el atributo en [CREDITOS.md](CREDITOS.md).

## Reglas de datos

- Solo agregados ya versionados en el repo. Nunca VIN individuales, tasas por código de catálogo ni tasas por mercado de destino (`LOCATION_n`).
- Toda cifra en pantalla lleva su leyenda: «entre auditados con actividad QLS, [tramo], base ficticia, n = …».
- No se dice «probabilidad de la unidad» ni se dan cifras de ahorro en dinero. La recomendación no cambia cuántas unidades se auditan: cambia cuáles.
- La base es ficticia: las cifras no prueban impacto en planta.
- Sin Ford Oval, sin Signature y sin logos de Ford (ver [CREDITOS.md](CREDITOS.md)).

## Cómo editar el contenido

- **Textos:** [`contenido.js`](contenido.js). `meta` (evento, desafío, equipo, integrantes y fecha), `secciones` (template del Informe) y `capitulos` (uno por pantalla: escena 3D, titular con su `acento`, bajada, cifras, puntos —callouts—, figura, tarjetas en `detalle`, `ampliacion` —respaldo para preguntas, solo en las notas— y notas del orador). Los titulares deben quedar en menos de 8 palabras.
- **Disposición:** el texto va de un lado (≈ 46 % del ancho; `lado: 'izquierda' | 'derecha'`, o por sección) y la figura o el vehículo del otro. Sin figura, las tarjetas van en una banda al pie; si así la pantalla no entra en la ventana, pasan al pie de la columna del vehículo (y, si todavía no entra, también los callouts). `disposicion: 'tarjetas-texto' | 'tarjetas-escena'` fuerza dónde van las tarjetas. El encabezado de `contenido.js` explica cada campo. Cada pantalla debe entrar en 1920×1080 sin desbordar: si no entra, recortar texto antes que achicar la letra.
- **Integrantes:** `meta.integrantes` tiene nombre, carrera y universidad de los tres.
- **Escenas y puntos:** los ids válidos están en el contrato de la escena (`escena/escena.js`): `portada`, `linea`, `datos`, `predictor`, `validacion`, `resultado`, `seguridad`, `factibilidad`, `donde-mirar`, `futuro`, `cierre`; puntos `etiqueta-parabrisas`, `carroceria`, `pintura`, `montaje`, `gate-release`, `inspeccion-adicional`, `componente-1` a `componente-3` (zonas ilustrativas del vehículo; ninguna pantalla las usa hoy: los componentes reales están anonimizados y `donde-mirar` no tiene puntos) y `playa-despacho`.
- **Figuras:** `figura` acepta `{ tipo: 'js', id, opciones, src }` (figuras.js, con `src` de respaldo), `{ src, respaldo }` (ilustración con respaldo) y `{ tipo: 'local', src: [candidatos], respaldo, pendiente }` (captura local). Los SVG de respaldo de [`docs/entrega/figuras/`](../../docs/entrega/figuras/) se regeneran con el comando de [`solucion/`](../../solucion/README.md), no a mano.

## Cifras

[`cifras.js`](cifras.js) exporta `cargarCifras()`. Cada clave lee un campo de un JSON versionado (`solucion/resultados/*.json` o `research/audit-csv.json`), lo formatea en es-AR (`10,9 %`, `13.312`) y le arma la leyenda. Si un archivo no se puede leer, usa el respaldo escrito en el propio `cifras.js` (el valor publicado en `docs/entrega/`) y marca `respaldo: true`. Una cifra sin dato devuelve `valor: '[PENDIENTE]'` y `pendiente: true`.

Para comprobar que los respaldos coinciden con los JSON y con el formato publicado:

```sh
python3 prototipos/presentacion-3d/verificar_cifras.py
```

Falla si algún respaldo difiere de su campo. Correrlo cada vez que se regeneren los resultados o se edite `cifras.js`.

Cifras que se proyectan en las pantallas de la solución:

| Pantalla | Claves | Fuente |
| --- | --- | --- |
| `alternativas` | `alternativas.n`, `catboost.seleccion`, `catboost.azarSeleccion` | `precision.json` (`ranking#largo`, `ganadora`, `azar`) |
| `solucion` | `catboost.seleccion`, `catboost.confirmacion`, `catboost.azarConfirmacion` | `precision.json` (`ganadora`, `azar.confirmacion`) |
| `resultado` | `catboost.prueba.precision`, `catboost.prueba.azar`, `catboost.prueba.veces` | `prueba-final.json` → `corridas[1]` (CatBoost) |

De [`prueba-final.json`](../../solucion/resultados/prueba-final.json) se proyecta solo `corridas[1]` (preregistro de precisión, CatBoost). `corridas[2]` la repite exactamente y no se lee. Las claves de `corridas[0]` y `corridas[3]` se conservan en `cifras.js` (verificadas contra el JSON) pero no se proyectan; esas lecturas solo aparecen, como texto verificado, en el respaldo del orador de `resultado`. `catboost.azarConfirmacion` y la tercera lectura no figuran en los borradores de `docs/entrega/`: su formato se comprueba solo contra el JSON.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `index.html`, `styles.css`, `ui.js`, `main.js` | Interfaz, pantallas, índice, riel y navegación |
| `figuras.js` | Figuras de datos en SVG |
| `herramientas/` | Capturas locales, renders y revisión de figuras |
| `escena/` | Escena 3D (three.js): vehículo, línea de producción y materiales |
| `tokens.css` | Tokens de la guía de marca de Ford (colores y tipografía) |
| `contenido.js` | Textos, capítulos y notas del orador |
| `cifras.js` | Lectura y formato de las cifras, con respaldo |
| `verificar_cifras.py` | Prueba de los respaldos contra los JSON |
| `assets/` | Modelo 3D opcional (`ranger.glb`), ilustraciones y renders; `assets/local/` (capturas) no se versiona |
| `CREDITOS.md` | Licencias y atribuciones |

**Orden de la línea (`escena/fabrica.js`, `ESTACIONES`).** Carrocería → Pintura → Montaje → Gate Release → **Playa de despacho** → Auditoría Adicional, como en el proceso real. La playa es una grilla de pickups al costado de la línea (del lado opuesto a la cámara) que empieza en su estación y se extiende hacia adelante: la cámara mira hacia adelante y a la derecha, y el degradado del texto oscurece la izquierda, así que detrás del auto no se vería. Las unidades resaltadas son las seleccionadas (≈ 5 %), y de ahí el auto sigue al túnel de Auditoría Adicional. Para mover una estación se cambia su `x` en `ESTACIONES` (y `FIN_LINEA` si hace falta); el recorrido, la cámara y las duraciones se recalculan solos. Después hay que regenerar los renders del modo estático (`herramientas/renderizar.*`).

## Pendientes para completar

Cada placeholder tiene el formato `[PENDIENTE: qué falta — fuente esperada]`; para encontrarlos: `grep -rn "PENDIENTE" prototipos/presentacion-3d/`.

| Dónde | Placeholder | Fuente esperada |
| --- | --- | --- |
| `contenido.js` → capítulos `hoja` y `plataforma-*`, `figura.pendiente` (chip dentro de la figura) | `[PENDIENTE: captura flujo-N-….png — herramientas/capturar_flujo.sh, salida local fuera de Git]` (×7) | `herramientas/capturar_flujo.sh` (o las capturas del traspaso, copiadas a `assets/local/`) |

Las capturas no se versionan: si se muestran, se generan localmente el día de la presentación (ver [Figuras, ilustraciones y capturas](#figuras-ilustraciones-y-capturas)). Mientras falten, el chip se ve en la figura; `?limpio=1` lo oculta. `cifras.js` no tiene cifras pendientes.
