import type { ReactNode } from 'react'

import { Icono } from '@/components/iconos'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// Encabezado de página: titular corto con una palabra en Skyview (§1), una línea de contexto y acciones a la derecha.
export function Encabezado({ ojo, titulo, acento, bajada, acciones }: {
  ojo?: string; titulo: string; acento?: string; bajada?: ReactNode; acciones?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0 max-w-[64ch]">
        {ojo && <p className="mb-2 font-medium text-ford-skyview">{ojo}</p>}
        <h1 className="text-3xl">
          {titulo}{acento && <> <span className="text-ford-skyview">{acento}</span></>}
        </h1>
        {bajada && <p className="mt-3">{bajada}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-3">{acciones}</div>}
    </header>
  )
}

// Cifra destacada: rótulo, valor grande y una línea de apoyo opcional.
export function Cifra({ rotulo, valor, apoyo, acento, ayuda, className }: {
  rotulo: string; valor: ReactNode; apoyo?: ReactNode; acento?: boolean; ayuda?: ReactNode; className?: string
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <span className="flex items-center gap-1">
        {rotulo}
        {ayuda && <Ayuda>{ayuda}</Ayuda>}
      </span>
      <span className={cn('text-3xl leading-tight font-medium tracking-tight', acento && 'text-ford-skyview')}>{valor}</span>
      {apoyo && <span>{apoyo}</span>}
    </div>
  )
}

// Ícono de información con la explicación en un tooltip: el detalle metodológico queda a un toque, no a la vista.
export function Ayuda({ children, etiqueta = 'Más información' }: { children: ReactNode; etiqueta?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={etiqueta} className="inline-flex rounded-full text-ford-blue">
          <Icono nombre="info" className="size-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">{children}</TooltipContent>
    </Tooltip>
  )
}

// Estado vacío con una acción.
export function Vacio({ titulo, texto, accion }: { titulo: string; texto: string; accion?: ReactNode }) {
  return (
    <section className="max-w-2xl rounded-lg bg-ford-gray p-8">
      <h2 className="text-2xl">{titulo}</h2>
      <p className="mt-3 mb-6">{texto}</p>
      {accion}
    </section>
  )
}
