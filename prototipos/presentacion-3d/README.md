# Presentación 3D interactiva

Sitio estático para presentar la solución de FordwardAI en el Trials Day (2/10/2026): pantallas sobre una escena 3D oscura (línea de producción simulada y un vehículo en modo x-ray con puntos interactivos) que se recorren con scroll **o** con flechas, como diapositivas con pasos. Todo el contenido queda a la vista: no hay nada que abrir. Sigue el [guion de la presentación](../../docs/entrega/guion-presentacion.md) y cubre las secciones del template del Informe (01 a 06, con 2.1 a 2.3).

Es un **complemento** de la presentación oficial (.pptx sobre el template de Ford), no la reemplaza. El contenido sale de los borradores de [`docs/entrega/`](../../docs/entrega/) y las cifras, de los agregados de [`solucion/resultados/`](../../solucion/resultados/).

## Cómo abrirlo

Desde la **raíz del repo** (las figuras y los JSON se leen con rutas relativas `../../`):

```sh
python3 -m http.server 8000   # en Windows: python -m http.server 8000
```

y abrir <http://localhost:8000/prototipos/presentacion-3d/>. En Claude Code también está la configuración `presentacion-3d` en `.claude/launch.json`.

**Requiere internet:** three.js, GSAP y Roboto se cargan por CDN (jsDelivr, cdnjs y Google Fonts). Sin build, sin Node y sin npm. Si se abre como `file://`, los JSON no se pueden leer y las cifras usan su respaldo (ver [Cifras](#cifras)).

## Cómo se recorre

Cada pantalla tiene una cabecera (antetítulo, titular y bajada) y una serie de **pasos**: cifras, callouts (los puntos de la escena), figura, tarjetas y lista, en ese orden.

- **Con scroll** (rueda, trackpad, barra): al llegar a una pantalla, todos sus pasos aparecen en cascada.
- **Con teclado o control remoto:** al avanzar a una pantalla entra solo la cabecera; cada `→` revela un paso y, con todos a la vista, el siguiente `→` pasa a la pantalla siguiente. `←` deshace pasos y, en el primero, vuelve a la pantalla anterior completa.
- Al revelar un callout, la escena enfoca ese punto; en la línea de producción el vehículo avanza hasta esa estación. Un click en un callout o en un punto 3D lleva a ese paso.
- Los capítulos densos siguen en **pantallas de continuación** (numeradas «09b»), que no aparecen en el índice.
- La URL guarda pantalla y paso (`#hoja/2`): al recargar se vuelve al mismo lugar. Sin paso (`#hoja`), la pantalla se abre completa.
- El pie muestra `09 / 18` (pantalla / última pantalla), la sección y un punto por paso.

## Atajos de teclado

| Tecla | Acción |
| --- | --- |
| → / espacio / PgDn | Paso siguiente (o pantalla siguiente si ya están todos) |
| ← / Shift+espacio / PgUp | Paso anterior (en 0, pantalla anterior completa) |
| ↓ / ↑ | Recorre la pantalla si no entra en la ventana; si no, paso siguiente / anterior |
| Shift+→ / Shift+← | Saltar a la pantalla siguiente / anterior, completa |
| Inicio / Fin | Portada / cierre |
| 0–6 | Ir a la portada (0) o al separador 01–06 |
| I / Esc | Abrir o cerrar el índice |
| N | Abrir las notas del orador en otra ventana (muestran paso, total y próximo paso; sus botones también avanzan) |
| F | Pantalla completa |
| O | Activar o desactivar la órbita con el mouse (en los capítulos que la permiten) |
| L | Calidad de la escena: alta → bajo consumo → automática |

## Modos

| Parámetro | Qué hace |
| --- | --- |
| `?nucleo=1` | Solo los capítulos de la versión núcleo (12 a 15 minutos) del guion; las continuaciones siguen a su capítulo |
| `?estatico=1` | Sin WebGL: diapositivas sobre un fondo CSS. Para proyectores lentos o si falla la escena |
| `?calidad=alta` / `baja` / `auto` | Calidad inicial de la escena (la tecla `L` la cambia en vivo). `baja` es el modo de bajo consumo para notebook a batería |
| `?limpio=1` | Oculta los chips `[PENDIENTE: …]` (el índice sigue contando cuántos hay) |
| `?debug` | Información de depuración; en la consola avisa qué cifras usan respaldo |

Los parámetros se combinan: `?nucleo=1&limpio=1&calidad=baja`.

Con **movimiento reducido** activado en el sistema operativo no hay pasos ni animaciones: cada pantalla se ve completa y las flechas pasan de pantalla en pantalla. Al **imprimir** (o guardar como PDF) sale una pantalla por página, en claro y con todo visible.

## Figuras, ilustraciones y capturas

- **Figuras de datos:** [`figuras.js`](figuras.js) las dibuja como SVG oscuro desde los agregados de `solucion/resultados/*.json` (comparación de alternativas, particiones, veces el azar en la prueba final, dónde mirar, etiquetas parciales y detector). Si no puede, la pantalla usa el SVG de matplotlib de [`docs/entrega/figuras/`](../../docs/entrega/figuras/) como respaldo. Los colores salen de las variables `--figura-*` de `styles.css`.
- **Ilustraciones a mano:** `assets/ilustraciones/` (proceso, solución y esquemas sin datos de la hoja y de la plataforma), versionadas e insertadas en línea para que tomen los colores del tema.
- **Capturas locales:** la hoja y la plataforma muestran tasas por código, así que sus capturas **no se versionan**. Se generan con `herramientas/capturar_plataforma.ps1` (Windows) o `herramientas/capturar_plataforma.sh`, que dejan `d-hoja.png`, `d-inicio.png`, `d-codigos.png` y `d-alertas.png` en `assets/local/` (fuera de Git); la hoja también toma `assets/local/captura-hoja-dia-260.png` si existe. Sin ellas se ve el esquema sin números con un chip «Captura local pendiente».

## Herramientas

| Archivo | Para qué |
| --- | --- |
| `herramientas/capturar_plataforma.ps1` / `.sh` | Capturas locales de la plataforma y de la hoja (necesitan `prototipos/plataforma-web/data.js`, que se genera con el CSV crudo fuera del repo) |
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

- Solo agregados ya versionados en el repo. Nunca VIN individuales, tasas por código de catálogo ni tasas por mercado de destino (`LOCATION_n`). No se lee `prototipos/plataforma-web/data.js`.
- Toda cifra en pantalla lleva su leyenda: «entre auditados con actividad QLS, [tramo], base ficticia, n = …».
- No se dice «probabilidad de la unidad» ni se dan cifras de ahorro en dinero. La recomendación no cambia cuántas unidades se auditan: cambia cuáles.
- La base es ficticia: las cifras no prueban impacto en planta.
- Sin Ford Oval, sin Signature y sin logos de Ford (ver [CREDITOS.md](CREDITOS.md)).

## Cómo editar el contenido

- **Textos:** [`contenido.js`](contenido.js). `meta` (evento, desafío, equipo, integrantes y fecha), `secciones` (template del Informe) y `capitulos` (uno por pantalla: escena 3D, titular con su `acento`, bajada, cifras, puntos —callouts—, figura, tarjetas en `detalle` y notas del orador). Los titulares deben quedar en menos de 8 palabras.
- **Pantallas y pasos:** `continuacion: '<id>'` crea una pantalla que sigue a otra y hereda su sección, escena, titular y notas; `pasos` cambia cómo se agrupan (`'uno'`, `'pares'`, `'todos'`); `lista` arma pasos numerados; `disposicion` decide si las tarjetas van con el texto o sobre la escena. El encabezado de `contenido.js` explica cada campo. Cada pantalla debe entrar en 1920×1080 (y razonablemente en 1366×768): si no entra, partirla en una continuación.
- **Integrantes:** reemplazar los tres `[PENDIENTE: …]` de `meta.integrantes` por nombre (`Apellido, Nombre`), universidad y carrera. El equipo tiene dos integrantes de informática y uno de industrial.
- **Escenas y puntos:** los ids válidos están en el contrato de la escena (`escena/escena.js`): `portada`, `linea`, `datos`, `predictor`, `validacion`, `resultado`, `seguridad`, `factibilidad`, `donde-mirar`, `futuro`, `cierre`; puntos `etiqueta-parabrisas`, `carroceria`, `pintura`, `montaje`, `gate-release`, `inspeccion-adicional`, `componente-1` a `componente-3` (zonas ilustrativas; los componentes reales están anonimizados) y `playa-despacho`.
- **Figuras:** `figura` acepta `{ tipo: 'js', id, opciones, src }` (figuras.js, con `src` de respaldo), `{ src, respaldo }` (ilustración con respaldo) y `{ tipo: 'local', src: [candidatos], respaldo, pendiente }` (captura local). Los SVG de respaldo de [`docs/entrega/figuras/`](../../docs/entrega/figuras/) se regeneran con el comando de [`solucion/`](../../solucion/README.md), no a mano.

## Cifras

[`cifras.js`](cifras.js) exporta `cargarCifras()`. Cada clave lee un campo de un JSON versionado (`solucion/resultados/*.json` o `research/audit-csv.json`), lo formatea en es-AR (`10,9 %`, `13.312`) y le arma la leyenda. Si un archivo no se puede leer, usa el respaldo escrito en el propio `cifras.js` (el valor publicado en `docs/entrega/`) y marca `respaldo: true`. Una cifra sin dato devuelve `valor: '[PENDIENTE]'` y `pendiente: true`.

Para comprobar que los respaldos coinciden con los JSON y con el formato publicado:

```sh
python3 prototipos/presentacion-3d/verificar_cifras.py
```

Falla si algún respaldo difiere de su campo. Correrlo cada vez que se regeneren los resultados o se edite `cifras.js`.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `index.html`, `styles.css`, `ui.js`, `main.js` | Interfaz, pantallas, pasos y navegación |
| `figuras.js` | Figuras de datos en SVG |
| `herramientas/` | Capturas locales, renders y revisión de figuras |
| `escena/` | Escena 3D (three.js): vehículo, línea de producción y materiales |
| `contenido.js` | Textos, capítulos y notas del orador |
| `cifras.js` | Lectura y formato de las cifras, con respaldo |
| `verificar_cifras.py` | Prueba de los respaldos contra los JSON |
| `assets/` | Modelo 3D opcional (`ranger.glb`), ilustraciones y renders; `assets/local/` (capturas) no se versiona |
| `CREDITOS.md` | Licencias y atribuciones |

## Pendientes para completar

Cada placeholder tiene el formato `[PENDIENTE: qué falta — fuente esperada]`; para encontrarlos: `grep -rn "PENDIENTE" prototipos/presentacion-3d/`.

| Dónde | Placeholder | Fuente esperada |
| --- | --- | --- |
| `contenido.js` → `meta.integrantes[0..2].nombre` | `[PENDIENTE: Apellido, Nombre — carátula del Informe]` (×3) | Carátula del Informe |
| `contenido.js` → `meta.integrantes[0..2].universidad` | `[PENDIENTE: Universidad — carátula del Informe]` (×3) | Carátula del Informe |
| `contenido.js` → `meta.integrantes[0..2].carrera` | `[PENDIENTE: Carrera (informática) — carátula del Informe]` (×2) y `[PENDIENTE: Carrera (industrial) — carátula del Informe]` (×1) | Carátula del Informe |
| `contenido.js` → capítulo `hoja`, `figura.pendiente` (chip dentro de la figura) | `[PENDIENTE: captura de la hoja del Día 260 (captura-hoja-dia-260.png) — salida local fuera de Git; no se versiona porque muestra tasas por código]` | Salida local de la corrida única |
| `contenido.js` → capítulo `plataforma`, `figura.pendiente` (chip dentro de la figura) | `[PENDIENTE: capturas del prototipo de plataforma — prototipos/plataforma-web/ (shoot.sh, se generan localmente y no se versionan)]` | `prototipos/plataforma-web/shoot.sh` |

Las capturas no se versionan: si se muestran, se generan localmente el día de la presentación (ver [Figuras, ilustraciones y capturas](#figuras-ilustraciones-y-capturas)). Mientras falten, el chip se ve en la figura; `?limpio=1` lo oculta. `cifras.js` no tiene cifras pendientes.
