# Presentación 3D interactiva

Sitio estático para presentar la solución de FordwardAI en el Trials Day (2/10/2026): capítulos con scroll sobre una escena 3D oscura (línea de producción simulada y un vehículo en modo x-ray con puntos interactivos). Sigue el [guion de la presentación](../../docs/entrega/guion-presentacion.md) y cubre las secciones del template del Informe (01 a 06, con 2.1 a 2.3).

Es un **complemento** de la presentación oficial (.pptx sobre el template de Ford), no la reemplaza. El contenido sale de los borradores de [`docs/entrega/`](../../docs/entrega/) y las cifras, de los agregados de [`solucion/resultados/`](../../solucion/resultados/).

## Cómo abrirlo

Desde la **raíz del repo** (las figuras y los JSON se leen con rutas relativas `../../`):

```sh
python3 -m http.server 8000
```

y abrir <http://localhost:8000/prototipos/presentacion-3d/>. En Claude Code también está la configuración `presentacion-3d` en `.claude/launch.json`.

**Requiere internet:** three.js, GSAP y Roboto se cargan por CDN (jsDelivr, cdnjs y Google Fonts). Sin build, sin Node y sin npm. Si se abre como `file://`, los JSON no se pueden leer y las cifras usan su respaldo (ver [Cifras](#cifras)).

## Atajos de teclado

| Tecla | Acción |
| --- | --- |
| → / espacio | Capítulo siguiente |
| ← | Capítulo anterior |
| 0–6 | Ir a la portada (0) o al separador 01–06 |
| I / Esc | Abrir o cerrar el índice |
| N | Mostrar u ocultar las notas del orador |
| F | Pantalla completa |
| O | Activar o desactivar la órbita con el mouse (en los capítulos que la permiten) |

## Modos

| Parámetro | Qué hace |
| --- | --- |
| `?nucleo=1` | Solo los capítulos de la versión núcleo (12 a 15 minutos) del guion |
| `?estatico=1` | Sin animaciones de cámara: útil para proyectores lentos o para capturas |
| `?debug` | Muestra información de depuración; en la consola avisa qué cifras usan respaldo |

Los parámetros se combinan: `?nucleo=1&estatico=1`.

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

- **Textos:** [`contenido.js`](contenido.js). `meta` (evento, desafío, equipo, integrantes y fecha), `secciones` (template del Informe) y `capitulos` (uno por pantalla: escena 3D, titular con su `acento`, bajada, cifras, puntos interactivos, figura, tarjetas de detalle y notas del orador). Los titulares deben quedar en menos de 8 palabras; el detalle va en `detalle` y `puntos`.
- **Integrantes:** reemplazar los tres `[PENDIENTE: …]` de `meta.integrantes` por nombre (`Apellido, Nombre`), universidad y carrera. El equipo tiene dos integrantes de informática y uno de industrial.
- **Escenas y puntos:** los ids válidos están en el contrato de la escena (`escena/escena.js`): `portada`, `linea`, `datos`, `predictor`, `validacion`, `resultado`, `seguridad`, `factibilidad`, `donde-mirar`, `futuro`, `cierre`; puntos `etiqueta-parabrisas`, `carroceria`, `pintura`, `montaje`, `gate-release`, `inspeccion-adicional`, `componente-1` a `componente-3` (zonas ilustrativas; los componentes reales están anonimizados) y `playa-despacho`.
- **Figuras:** se toman de [`docs/entrega/figuras/`](../../docs/entrega/figuras/) (SVG). Se regeneran con el comando de [`solucion/`](../../solucion/README.md), no a mano.

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
| `index.html`, `styles.css`, `ui.js`, `main.js` | Interfaz, capítulos y navegación |
| `escena/` | Escena 3D (three.js): vehículo, línea de producción y materiales |
| `contenido.js` | Textos, capítulos y notas del orador |
| `cifras.js` | Lectura y formato de las cifras, con respaldo |
| `verificar_cifras.py` | Prueba de los respaldos contra los JSON |
| `assets/` | Modelo 3D opcional (`ranger.glb`) |
| `CREDITOS.md` | Licencias y atribuciones |

## Pendientes para completar

Cada placeholder tiene el formato `[PENDIENTE: qué falta — fuente esperada]`; para encontrarlos: `grep -rn "PENDIENTE" prototipos/presentacion-3d/`.

| Dónde | Placeholder | Fuente esperada |
| --- | --- | --- |
| `contenido.js` → `meta.integrantes[0..2].nombre` | `[PENDIENTE: Apellido, Nombre — carátula del Informe]` (×3) | Carátula del Informe |
| `contenido.js` → `meta.integrantes[0..2].universidad` | `[PENDIENTE: Universidad — carátula del Informe]` (×3) | Carátula del Informe |
| `contenido.js` → `meta.integrantes[0..2].carrera` | `[PENDIENTE: Carrera (informática) — carátula del Informe]` (×2) y `[PENDIENTE: Carrera (industrial) — carátula del Informe]` (×1) | Carátula del Informe |
| `contenido.js` → capítulo `hoja`, tarjeta «Captura para la demo» | `[PENDIENTE: captura de la hoja del Día 260 (captura-hoja-dia-260.png) — salida local fuera de Git; no se versiona porque muestra tasas por código]` | Salida local de la corrida única |
| `contenido.js` → capítulo `plataforma`, tarjeta «Capturas» | `[PENDIENTE: capturas del prototipo de plataforma — prototipos/plataforma-web/ (shoot.sh, se generan localmente y no se versionan)]` | `prototipos/plataforma-web/shoot.sh` |

Las capturas no se versionan: si se muestran, se cargan localmente el día de la presentación. `cifras.js` no tiene cifras pendientes.
