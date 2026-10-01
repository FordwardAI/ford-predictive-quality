// Figuras de datos como SVG inline, dibujadas desde los agregados ya publicados
// (solucion/resultados/*.json). Contrato con ui.js (el bloque C lo implementa):
//
//   crear(id, { datos, opciones }) -> SVGElement | null
//
// `id`: comparacion | veces_azar_prueba_final | donde_mirar | etiquetas_parciales
//       | detector | particiones
// `datos`: objeto con los JSON ya leídos (ver cifras.js).
// `opciones`: p. ej. { resaltar: 'fuga' } en la figura `comparacion`.
// Devuelve null si falta el dato; ui.js usa entonces el SVG de matplotlib de respaldo.
// Colores solo por variables CSS (--figura-*), para que el tema oscuro y la
// impresión en claro funcionen sin tocar el SVG.

export const IDS = [
  'comparacion',
  'veces_azar_prueba_final',
  'donde_mirar',
  'etiquetas_parciales',
  'detector',
  'particiones',
];

export function crear(/* id, { datos, opciones } */) {
  return null;
}
