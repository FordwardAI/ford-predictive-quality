# Créditos y licencias

## Bibliotecas y fuentes (por CDN, no se copian al repo)

| Recurso | Uso | Licencia | Fuente |
| --- | --- | --- | --- |
| three.js 0.186.1 (incluye `examples/jsm`) | Escena 3D, OrbitControls, bloom, carga de glTF | MIT | <https://threejs.org/> · <https://github.com/mrdoob/three.js/blob/dev/LICENSE> |
| GSAP 3.15.0 y ScrollTrigger | Animaciones y scroll | GSAP Standard «no charge» License | <https://gsap.com/> · <https://gsap.com/standard-license/> |
| Roboto (400 y 500) | Tipografía de respaldo de «Ford F-1» | SIL Open Font License 1.1 | Google Fonts: <https://fonts.google.com/specimen/Roboto> |

## Modelo 3D (opcional)

- This work is based on **«Ford Ranger Next-Gen 2023 Sport»** (<https://sketchfab.com/3d-models/ford-ranger-next-gen-2023-sport-e93ac097ee9a46a4a9decca9aceed03c>) by **Asadawut.Kaewma** (<https://sketchfab.com/Asadawut.Kaewma>), licensed under **CC-BY 4.0** (<http://creativecommons.org/licenses/by/4.0/>).
- Cambios: optimizado con glTF Transform 4 (`optimize --compress draco --simplify false --weld false --texture-compress webp --texture-size 1024`: de 27,5 MB a 2,5 MB, sin simplificar la malla) y mostrado con materiales propios (x-ray y pintado).
- **Procedencia.** La descripción del modelo en Sketchfab dice que se obtuvo del sitio de Ford Tailandia. Por eso se usa solo en esta presentación académica para Ford y no se publica en un sitio abierto.
- **Marcas registradas.** La licencia CC-BY cubre la malla del autor, no el diseño del vehículo ni los nombres, emblemas o marcas de Ford Motor Company, que pertenecen a sus titulares. Se usa solo como ilustración: la base de datos del desafío no dice qué modelo se produce.
- Si no está `assets/ranger.glb`, la escena usa una pickup procedural hecha en código, sin atribución externa.
- **Emblemas tapados.** La textura del modelo trae el óvalo de Ford y la insignia del portón; la escena los cubre con placas del color de la pieza (`taparEmblemas` en [`escena/vehiculo.js`](escena/vehiculo.js)), así que no aparecen en la presentación ni en los renders.

## Renders (`assets/renders/`)

- Las imágenes WebP de `assets/renders/` se generan con [`herramientas/renderizar.ps1`](herramientas/renderizar.ps1) / [`renderizar.sh`](herramientas/renderizar.sh) a partir de la escena propia (`escena/demo.html?captura=1`).
- Las que muestran la pickup son **obra derivada** de «Ford Ranger Next-Gen 2023 Sport» de **Asadawut.Kaewma**, bajo **CC-BY 4.0** (autor, fuente y licencia arriba). Cambios: materiales propios (pintura, x-ray, vidrios), emblemas tapados, iluminación, entorno y composición de la escena. El resto de los elementos (fábrica, playa, partículas, gráficos) es del equipo.
- Uso **académico**, solo para esta presentación del desafío; no se publican en un sitio abierto, por la procedencia del modelo indicada arriba.

## Marca

- Paleta, tipografía y reglas de uso según la guía pública del design system de Ford: <https://brand.ford.com/>. Los tokens se reutilizan de [`prototipos/plataforma-web/tokens.css`](../plataforma-web/tokens.css).
- **No se usan** el Ford Oval, la Signature ni ningún logo de Ford.

## Contenido

- Textos y figuras: equipo FordwardAI, a partir de [`docs/entrega/`](../../docs/entrega/) y [`docs/entrega/figuras/`](../../docs/entrega/figuras/) (generadas por `solucion/figuras.py`).
- Cifras: agregados de [`solucion/resultados/`](../../solucion/resultados/) y [`research/audit-csv.json`](../../research/audit-csv.json), sobre la base ficticia del desafío.
