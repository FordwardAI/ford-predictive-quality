import {
  BadgeCheck, CalendarClock, CalendarDays, CircleCheck, CircleMinus, CircleX, ClipboardCheck, ClipboardList,
  Download, Factory, Info, ListChecks, ListOrdered, RefreshCw, Route, ScanSearch,
  SquareParking, type LucideIcon,
} from 'lucide-react'

// Íconos de lucide (la librería que usa shadcn/ui), con trazo de 2 px. El sistema de íconos de Ford (§7) es solo para
// marketing; en el producto se usa una sola familia en toda la interfaz.
const ICONOS = {
  hoy: CalendarDays,
  hoja: ClipboardList,
  audito: ScanSearch,
  ronda: Route,
  seguimiento: ListChecks,
  prioridades: ListOrdered,
  resultados: BadgeCheck,
  modelo: RefreshCw,
  programa: CalendarClock,
  linea: Factory,
  playa: SquareParking,
  calidad: ClipboardCheck,
  check: CircleCheck,
  menos: CircleMinus,
  fuera: CircleX,
  descarga: Download,
  info: Info,
} satisfies Record<string, LucideIcon>

export type NombreIcono = keyof typeof ICONOS

export function Icono({ nombre, className = 'size-6' }: { nombre: NombreIcono; className?: string }) {
  const C = ICONOS[nombre]
  return <C aria-hidden="true" focusable="false" strokeWidth={2} className={className} />
}
