import { lazy, Suspense, useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Icono, type NombreIcono } from '@/components/iconos'
import { useApp, useVista, type Vista } from '@/lib/estado'
import { useRol, type Rol } from '@/lib/rol'
import { cn } from '@/lib/utils'
import { ElegirRol } from '@/vistas/ElegirRol'
import { HojaDelDia } from '@/vistas/Hoja'
import { DiaPlanta } from '@/vistas/DiaPlanta'
import { Modelo } from '@/vistas/Modelo'
import { ReporteLinea } from '@/vistas/ReporteLinea'
import { Resultados } from '@/vistas/Resultados'
import { Seguimiento } from '@/vistas/Seguimiento'
import { Seleccion } from '@/vistas/Seleccion'

// Recharts solo se carga al abrir la evaluación.
const SimulacionBase = lazy(() => import('@/vistas/Simulacion').then((m) => ({ default: m.SimulacionBase })))

type Item = { id: Vista; nombre: string; corto: string; icono: NombreIcono }
const NAV: Record<Rol, { nombre: string; grupos: { grupo: string; items: Item[] }[] }> = {
  seleccion: {
    nombre: 'Selección en la playa',
    grupos: [{
      grupo: 'En la playa',
      items: [
        { id: 'seleccion', nombre: 'Selección', corto: 'Selección', icono: 'audito' },
        { id: 'prioridades', nombre: 'Prioridades del día', corto: 'Prioridades', icono: 'prioridades' },
      ],
    }],
  },
  calidad: {
    nombre: 'Calidad de Planta',
    grupos: [
      {
        grupo: 'Operación del día',
        items: [
          { id: 'hoy', nombre: 'Día de planta', corto: 'Día', icono: 'hoy' },
          { id: 'hoja', nombre: 'Hoja del día', corto: 'Hoja', icono: 'hoja' },
          { id: 'seguimiento', nombre: 'Seguimiento', corto: 'Seguimiento', icono: 'seguimiento' },
        ],
      },
      {
        grupo: 'Retorno de la auditoría',
        items: [
          { id: 'resultados', nombre: 'Resultados', corto: 'Resultados', icono: 'resultados' },
          { id: 'modelo', nombre: 'Modelo', corto: 'Modelo', icono: 'modelo' },
          { id: 'linea', nombre: 'Reporte para la línea', corto: 'Línea', icono: 'linea' },
        ],
      },
      { grupo: 'Evaluación', items: [{ id: 'simulacion', nombre: 'Evaluación', corto: 'Evaluación', icono: 'simulacion' }] },
    ],
  },
}

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
  const [rol, setRol] = useRol()
  const vistaHash = useVista()
  const nav = rol ? NAV[rol] : null
  const items = nav ? nav.grupos.flatMap((g) => g.items) : []
  const vista = items.find((i) => i.id === vistaHash) ?? items[0]

  useEffect(() => { if (vista) document.title = `${vista.nombre} · Plataforma FordwardAI` }, [vista])

  if (!rol || !nav || !vista) {
    return <ElegirRol alElegir={(r) => { setRol(r); location.hash = NAV[r].grupos[0].items[0].id }} />
  }
  const cambiarRol = () => { setRol(null); history.replaceState(null, '', location.pathname) }

  return (
    <div className="min-h-svh md:grid md:grid-cols-[228px_minmax(0,1fr)] md:gap-6 md:p-6">
      {/* §5: panel lateral flotante de 228 px, radio 16, Ford Blue con texto blanco. */}
      <nav aria-label="Secciones" className="sticky top-6 hidden h-[calc(100svh-48px)] flex-col rounded-lg bg-ford-blue px-3 py-6 text-white md:flex">
        <div className="px-3 pb-8">
          <img src="ford-logo.png" alt="Ford" width={128} height={58} className="w-32" />
          <p className="mt-2">Selección para Auditoría Adicional</p>
        </div>
        {nav.grupos.map((g) => (
          <div key={g.grupo} className="mb-6">
            <p className="px-3 pb-2">{g.grupo}</p>
            <ul className="flex flex-col gap-1">
              {g.items.map((i) => (
                <li key={i.id}>
                  <a href={`#${i.id}`} aria-current={vista.id === i.id ? 'page' : undefined}
                    className={cn('flex min-h-10 items-center gap-3 rounded-full px-3 transition-colors duration-300',
                      vista.id === i.id ? 'bg-white font-medium text-ford-blue' : 'hover:bg-ford-twilight')}>
                    <Icono nombre={i.icono} />{i.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="mt-auto px-3">
          <p>{nav.nombre}</p>
          <button type="button" onClick={cambiarRol} className="mt-1 rounded-full text-left underline underline-offset-4">Cambiar de rol</button>
          <p className="mt-6 text-2xl">FordwardAI</p>
        </div>
      </nav>

      {/* Móvil: barra superior con el logo y el rol; navegación inferior, al alcance del pulgar en la playa. */}
      <div className="flex items-center justify-between gap-3 bg-ford-blue px-4 py-3 text-white md:hidden">
        <img src="ford-logo.png" alt="Ford" width={80} height={36} className="w-20" />
        <button type="button" onClick={cambiarRol} className="rounded-full text-right">
          {nav.nombre}<span className="block underline underline-offset-4">Cambiar</span>
        </button>
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-end px-4 pt-4 md:px-0 md:pt-0">
          <Contexto />
        </div>
        <main className="w-full max-w-[1280px] px-4 pt-6 pb-28 md:px-12 md:pt-8 md:pb-16">
          {vista.id === 'seleccion' && <Seleccion />}
          {vista.id === 'prioridades' && <HojaDelDia soloLectura />}
          {vista.id === 'hoy' && <DiaPlanta />}
          {vista.id === 'resultados' && <Resultados />}
          {vista.id === 'modelo' && <Modelo />}
          {vista.id === 'linea' && <ReporteLinea />}
          {vista.id === 'hoja' && <HojaDelDia />}
          {vista.id === 'seguimiento' && <Seguimiento />}
          {vista.id === 'simulacion' && <Suspense fallback={<p>Cargando…</p>}><SimulacionBase /></Suspense>}
        </main>
      </div>

      <nav aria-label="Secciones" className={cn('fixed inset-x-0 bottom-0 z-40 border-t-2 border-ford-gray bg-white md:hidden',
        items.length <= 4 ? 'grid grid-cols-2' : 'flex overflow-x-auto [&>a]:min-w-24')}>
        {items.map((i) => (
          <a key={i.id} href={`#${i.id}`} aria-current={vista.id === i.id ? 'page' : undefined}
            className={cn('flex flex-col items-center gap-1 py-2', vista.id === i.id ? 'font-medium text-ford-skyview' : 'text-ford-blue')}>
            <Icono nombre={i.icono} />
            <span className="leading-none">{i.corto}</span>
          </a>
        ))}
      </nav>
      <Toaster position="top-center" />
    </div>
  )
}
