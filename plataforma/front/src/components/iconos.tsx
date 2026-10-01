// Íconos propios de la navegación y las acciones principales, con la geometría de §7: grilla de 24 × 24, 2 px de
// padding, formas sólidas y una sola esquina redondeada (abajo o arriba a la izquierda). Las affordances chicas de los
// componentes (chevron, cerrar) usan lucide, que es lo que trae shadcn.
const TRAZOS = {
  hoy: 'M7 4H21V21H3V8A4 4 0 0 1 7 4Z M5 10V19H19V10Z M7 12h4v4H7z M7 1h2v3H7z M15 1h2v3h-2z',
  hoja: 'M6 2H20V22H2V6A4 4 0 0 1 6 2Z M6 8h10v2H6z M6 12h10v2H6z M6 16h6v2H6z',
  audito: 'M10 2a8 8 0 1 1 0 16a8 8 0 0 1 0-16Z M10 5a5 5 0 1 0 0 10a5 5 0 0 0 0-10Z M15.6 17.7l2.1-2.1 4.6 4.6-2.1 2.1z',
  ronda:
    'M4 11.6L7.4 10.9 9.6 6.5H15V10.8H22V16H20.8A3.3 3.3 0 0 0 14.2 16H9.8A3.3 3.3 0 0 0 3.2 16H2V13.6A2 2 0 0 1 4 11.6Z ' +
    'M10.4 8H13.4V10.8H9Z M6.5 13.7a2.3 2.3 0 1 1 0 4.6a2.3 2.3 0 0 1 0-4.6Z M6.5 15.1a0.9 0.9 0 1 0 0 1.8a0.9 0.9 0 0 0 0-1.8Z ' +
    'M17.5 13.7a2.3 2.3 0 1 1 0 4.6a2.3 2.3 0 0 1 0-4.6Z M17.5 15.1a0.9 0.9 0 1 0 0 1.8a0.9 0.9 0 0 0 0-1.8Z',
  simulacion: 'M6 12H8V21H2V16A4 4 0 0 1 6 12Z M10 7h5v14h-5z M17 2h5v19h-5z',
  check: 'M2.6 12.4l2.2-2.2 4.4 4.4 9.9-9.9 2.2 2.2L9.2 19z',
  menos: 'M6 10H22V14H2A4 4 0 0 1 6 10Z',
  fuera: 'M5.6 3.5L12 9.9l6.4-6.4 2.1 2.1L14.1 12l6.4 6.4-2.1 2.1L12 14.1l-6.4 6.4-2.1-2.1L9.9 12 3.5 5.6z',
  descarga: 'M11 2h2v11l3.6-3.6 1.4 1.4-6 6-6-6 1.4-1.4L11 13z M2 18h20v4H5a3 3 0 0 1-3-3z',
  play: 'M6 3l15 9-15 9z',
  pausa: 'M9 3H10V21H5V7A4 4 0 0 1 9 3Z M14 3h5v18h-5z',
  paso: 'M4 3l12 9-12 9z M17 3h4v18h-4z',
  info: 'M12 2a10 10 0 1 1 0 20a10 10 0 0 1 0-20Z M11 10h2v7h-2z M11 6h2v2h-2z',
} as const

export type NombreIcono = keyof typeof TRAZOS

export function Icono({ nombre, className = 'size-6' }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path fill="currentColor" fillRule="evenodd" d={TRAZOS[nombre]} />
    </svg>
  )
}
