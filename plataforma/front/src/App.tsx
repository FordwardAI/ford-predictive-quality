import { useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Icono, type NombreIcono } from '@/components/iconos'
import { useApp, useVista, type Vista } from '@/lib/estado'
import { cn } from '@/lib/utils'
import { HojaDelDia } from '@/vistas/Hoja'
import { DiaPlanta } from '@/vistas/DiaPlanta'
import { Modelo } from '@/vistas/Modelo'
import { ReporteLinea } from '@/vistas/ReporteLinea'
import { Resultados } from '@/vistas/Resultados'
import { Seguimiento } from '@/vistas/Seguimiento'
import { Seleccion } from '@/vistas/Seleccion'

type Item = { id: Vista; nombre: string; corto: string; icono: NombreIcono }
// Una sola navegación: todavía no se sabe cómo se reparten estas tareas en planta, así que no se separa por rol.
const NAV: { grupo: string; items: Item[] }[] = [
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
  { grupo: 'En la playa', items: [{ id: 'seleccion', nombre: 'Selección', corto: 'Selección', icono: 'audito' }] },
]
const ITEMS = NAV.flatMap((g) => g.items)

function Contexto() {
  const { meta, hoja, modelo } = useApp()
  return (
    <div className="flex flex-wrap items-center gap-2">
      {hoja && <Badge variant="secondary">Día {hoja.dia}</Badge>}
      {hoja && <Badge variant="secondary">{modelo(hoja.modelo).corto}</Badge>}
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button"><Badge variant="outline">{meta.demo ? 'Demo sintética' : 'Base ficticia'}</Badge></button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          {meta.demo
            ? <>Demo con una base sintética generada por la plataforma (días {meta.validacion[0]}–{meta.validacion[1]}): sirve para ver el flujo; sus cifras no son resultados. Con los CSV de Ford muestra la base ficticia.</>
            : <>Datos de la base ficticia, reproducidos día por día hasta que haya conexión con Ford (días {meta.validacion[0]}–{meta.validacion[1]}).
              Fuente {meta.fuente.csv}, catálogo {meta.fuente.catalogo}.</>}
          {' '}Ningún VIN sale del servidor. Propuesta de FordwardAI: no es un sistema de Ford.
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export default function App() {
  const vistaHash = useVista()
  const vista = ITEMS.find((i) => i.id === vistaHash) ?? ITEMS[0]

  useEffect(() => { document.title = `${vista.nombre} · Plataforma FordwardAI` }, [vista])
  // En móvil, la pestaña activa de la navegación inferior se desplaza a la vista.
  useEffect(() => { document.querySelector('#nav-movil [aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' }) }, [vista])

  return (
    <div className="min-h-svh md:grid md:grid-cols-[228px_minmax(0,1fr)] md:gap-6 md:p-6">
      {/* §5: panel lateral flotante de 228 px, radio 16, Ford Blue con texto blanco. */}
      <nav aria-label="Secciones" className="sticky top-6 hidden h-[calc(100svh-48px)] flex-col rounded-lg bg-ford-blue px-3 py-6 text-white md:flex">
        <div className="flex flex-col items-center px-3 pb-8 text-center">
          <img src="ford-logo.png" alt="Ford" width={128} height={58} className="w-32" />
          <p className="mt-2">Selección para Auditoría Adicional</p>
        </div>
        {NAV.map((g) => (
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
        <p className="mt-auto px-3 text-center text-2xl">FordwardAI</p>
      </nav>

      {/* Móvil: barra superior con el logo y navegación inferior desplazable. */}
      <div className="flex items-center justify-between gap-3 bg-ford-blue px-4 py-3 text-white md:hidden">
        <img src="ford-logo.png" alt="Ford" width={80} height={36} className="w-20" />
        <span className="font-medium">FordwardAI</span>
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-end px-4 pt-4 md:px-0 md:pt-0">
          <Contexto />
        </div>
        <main className="w-full max-w-[1280px] px-4 pt-6 pb-28 md:px-12 md:pt-8 md:pb-16">
          {vista.id === 'seleccion' && <Seleccion />}
          {vista.id === 'hoy' && <DiaPlanta />}
          {vista.id === 'resultados' && <Resultados />}
          {vista.id === 'modelo' && <Modelo />}
          {vista.id === 'linea' && <ReporteLinea />}
          {vista.id === 'hoja' && <HojaDelDia />}
          {vista.id === 'seguimiento' && <Seguimiento />}
        </main>
      </div>

      <nav id="nav-movil" aria-label="Secciones" className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t-2 border-ford-gray bg-white md:hidden [&>a]:min-w-24 [&>a]:flex-1">
        {ITEMS.map((i) => (
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
