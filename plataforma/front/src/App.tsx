import { lazy, Suspense } from 'react'

import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Icono, type NombreIcono } from '@/components/iconos'
import { useApp, useVista, type Vista } from '@/lib/estado'
import { cn } from '@/lib/utils'
import { Audito } from '@/vistas/Audito'
import { HojaDelDia } from '@/vistas/Hoja'
import { Hoy } from '@/vistas/Hoy'
import { RondaPlaya } from '@/vistas/Ronda'

// Recharts solo se carga al abrir la simulación.
const SimulacionBase = lazy(() => import('@/vistas/Simulacion').then((m) => ({ default: m.SimulacionBase })))

const NAV: { grupo: string; items: { id: Vista; nombre: string; corto: string; icono: NombreIcono }[] }[] = [
  {
    grupo: 'Operación del día',
    items: [
      { id: 'hoy', nombre: 'Preparar el día', corto: 'Hoy', icono: 'hoy' },
      { id: 'hoja', nombre: 'Hoja del día', corto: 'Hoja', icono: 'hoja' },
      { id: 'audito', nombre: '¿Lo audito?', corto: 'Auditar', icono: 'audito' },
      { id: 'ronda', nombre: 'Ronda en la playa', corto: 'Ronda', icono: 'ronda' },
    ],
  },
  { grupo: 'Evaluación', items: [{ id: 'simulacion', nombre: 'Simulación', corto: 'Simular', icono: 'simulacion' }] },
]

function Contexto() {
  const { meta, hoja, modelo } = useApp()
  return (
    <div className="flex flex-wrap items-center gap-2">
      {hoja && <Badge variant="secondary">Día {hoja.dia}</Badge>}
      {hoja && <Badge variant="secondary">{modelo(hoja.modelo).corto}</Badge>}
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button"><Badge variant="outline">Base ficticia</Badge></button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          Entre auditados con actividad QLS. Solo días de validación {meta.validacion[0]}–{meta.validacion[1]}; la prueba
          final no se relee. Fuente {meta.fuente.csv}, catálogo {meta.fuente.catalogo}. Ningún VIN sale del servidor.
          Propuesta de FordwardAI: no es un sistema de Ford.
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export default function App() {
  const [vista] = useVista()
  const titulo = NAV.flatMap((g) => g.items).find((i) => i.id === vista)!
  document.title = `${titulo.nombre} · Plataforma FordwardAI`

  return (
    <div className="min-h-svh md:grid md:grid-cols-[228px_minmax(0,1fr)] md:gap-6 md:p-6">
      {/* §5: panel lateral flotante de 228 px, radio 16, Ford Blue con texto blanco. */}
      <nav aria-label="Secciones" className="sticky top-6 hidden h-[calc(100svh-48px)] flex-col rounded-lg bg-ford-blue px-3 py-6 text-white md:flex">
        <div className="px-3 pb-8">
          <img src="ford-logo.png" alt="Ford" width={128} height={58} className="w-32" />
          <p className="mt-2">Selección para Auditoría Adicional</p>
        </div>
        {NAV.map((g) => (
          <div key={g.grupo} className="mb-6">
            <p className="px-3 pb-2">{g.grupo}</p>
            <ul className="flex flex-col gap-1">
              {g.items.map((i) => (
                <li key={i.id}>
                  <a href={`#${i.id}`} aria-current={vista === i.id ? 'page' : undefined}
                    className={cn('flex min-h-10 items-center gap-3 rounded-full px-3 transition-colors duration-300',
                      vista === i.id ? 'bg-white font-medium text-ford-blue' : 'hover:bg-ford-twilight')}>
                    <Icono nombre={i.icono} />{i.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="mt-auto px-3 text-2xl">FordwardAI</p>
      </nav>

      {/* Móvil: barra superior con el logo y navegación inferior, al alcance del pulgar en la playa. */}
      <div className="flex items-center justify-between gap-3 bg-ford-blue px-4 py-3 md:hidden">
        <img src="ford-logo.png" alt="Ford" width={80} height={36} className="w-20" />
        <span className="font-medium text-white">FordwardAI</span>
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-end px-4 pt-4 md:px-0 md:pt-0">
          <Contexto />
        </div>
        <main className="w-full max-w-[1280px] px-4 pt-6 pb-28 md:px-12 md:pt-8 md:pb-16">
          {vista === 'hoy' && <Hoy />}
          {vista === 'hoja' && <HojaDelDia />}
          {vista === 'audito' && <Audito />}
          {vista === 'ronda' && <RondaPlaya />}
          {vista === 'simulacion' && <Suspense fallback={<p>Cargando…</p>}><SimulacionBase /></Suspense>}
        </main>
      </div>

      <nav aria-label="Secciones" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t-2 border-ford-gray bg-white md:hidden">
        {NAV.flatMap((g) => g.items).map((i) => (
          <a key={i.id} href={`#${i.id}`} aria-current={vista === i.id ? 'page' : undefined}
            className={cn('flex flex-col items-center gap-1 py-2', vista === i.id ? 'font-medium text-ford-skyview' : 'text-ford-blue')}>
            <Icono nombre={i.icono} />
            <span className="leading-none">{i.corto}</span>
          </a>
        ))}
      </nav>
      <Toaster position="top-center" />
    </div>
  )
}
