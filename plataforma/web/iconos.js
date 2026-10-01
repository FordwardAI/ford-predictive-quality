// Íconos de interfaz propios: el sistema de íconos de Ford es solo para marketing (§7), pero se sigue su geometría:
// grilla de 24 × 24 con 2 px de padding, formas sólidas, una esquina redondeada (arriba o abajo a la izquierda,
// 3–4 px) y el resto rectas; los objetos redondos (rueda, lupa) conservan su forma.
const TRAZOS = {
  preparar: 'M7 4H21V21H3V8A4 4 0 0 1 7 4Z M5 10V19H19V10Z M7 12h4v4H7z M7 1h2v3H7z M15 1h2v3h-2z',
  hoja: 'M6 2H20V22H2V6A4 4 0 0 1 6 2Z M6 8h10v2H6z M6 12h10v2H6z M6 16h6v2H6z',
  audito: 'M10 2a8 8 0 1 1 0 16a8 8 0 0 1 0-16Z M10 5a5 5 0 1 0 0 10a5 5 0 0 0 0-10Z M15.6 17.7l2.1-2.1 4.6 4.6-2.1 2.1z',
  ronda: 'M6 5H16.5L21 10.5V16H2V9A4 4 0 0 1 6 5Z M6 7.5V10.5H15.5L13.5 7.5Z M7 15.5a3 3 0 1 1 0 6a3 3 0 0 1 0-6Z M17 15.5a3 3 0 1 1 0 6a3 3 0 0 1 0-6Z',
  simulacion: 'M6 12H8V21H2V16A4 4 0 0 1 6 12Z M10 7h5v14h-5z M17 2h5v19h-5z',
  check: 'M2.6 12.4l2.2-2.2 4.4 4.4 9.9-9.9 2.2 2.2L9.2 19z',
  menos: 'M6 10H22V14H2A4 4 0 0 1 6 10Z',
  fuera: 'M5.6 3.5L12 9.9l6.4-6.4 2.1 2.1L14.1 12l6.4 6.4-2.1 2.1L12 14.1l-6.4 6.4-2.1-2.1L9.9 12 3.5 5.6z',
  descarga: 'M11 2h2v11l3.6-3.6 1.4 1.4-6 6-6-6 1.4-1.4L11 13z M2 18h20v4H5a3 3 0 0 1-3-3z',
  subir: 'M11 17V6.8L7.4 10.4 6 9l6-6 6 6-1.4 1.4L13 6.8V17z M2 18h20v4H5a3 3 0 0 1-3-3z',
  play: 'M6 3l15 9-15 9z',
  pausa: 'M9 3H10V21H5V7A4 4 0 0 1 9 3Z M14 3h5v18h-5z',
  paso: 'M4 3l12 9-12 9z M17 3h4v18h-4z',
  info: 'M12 2a10 10 0 1 1 0 20a10 10 0 0 1 0-20Z M11 10h2v7h-2z M11 6h2v2h-2z',
};

export function icono(nombre, tam = 24) {
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">` +
    `<path fill="currentColor" fill-rule="evenodd" d="${TRAZOS[nombre]}"/></svg>`;
}
