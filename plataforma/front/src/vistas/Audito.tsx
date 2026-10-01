import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Encabezado, Vacio } from '@/components/comunes'
import { Icono } from '@/components/iconos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { api, type Decision, type Estado } from '@/lib/api'
import { useApp } from '@/lib/estado'
import { cn } from '@/lib/utils'

// En la playa, con el vehículo delante: el analista lee el código del parabrisas y la respuesta ocupa la pantalla.
export function Audito() {
  const { hoja, estado, refrescar, setEstado } = useApp()
  const [codigo, setCodigo] = useState('')
  const [decision, setDecision] = useState<Decision | null>(null)
  const [tomando, setTomando] = useState(false)
  const campo = useRef<HTMLInputElement>(null)

  useEffect(() => { refrescar(); campo.current?.focus() }, [refrescar])
  useEffect(() => {
    const c = codigo.trim()
    if (!c) { setDecision(null); return }
    // El estado puede cambiar desde otra tablet: se pide junto con la decisión.
    const t = setTimeout(() => {
      Promise.all([api<Decision>('decidir', { codigo: c }), refrescar()]).then(([d]) => setDecision(d)).catch(() => {})
    }, 180)
    return () => clearTimeout(t)
  }, [codigo, refrescar])

  if (!hoja || !estado) {
    return (
      <>
        <Encabezado titulo="¿Lo" acento="audito?" />
        <Vacio titulo="Todavía no hay hoja para hoy" texto="Sin hoja no hay prioridades: Calidad de Planta la arma al inicio del día."
          accion={<Button asChild size="cta"><a href="#hoy"><Icono nombre="hoy" />Preparar el día</a></Button>} />
      </>
    )
  }

  async function tomar() {
    if (!decision) return
    setTomando(true)
    try {
      const r = await api<{ unidad: string; decision: Decision; estado: Estado }>('tomar', { codigo: decision.codigo })
      setEstado(r.estado)
      setDecision(r.decision)
      toast.success(`Unidad ${r.unidad} registrada para ${r.decision.codigo}`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setTomando(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Encabezado ojo={`Equipo de analistas · Día ${hoja.dia}`} titulo="¿Lo" acento="audito?" />

      <div className="mb-8">
        <p className="mb-2 flex items-baseline gap-2"><b className="text-3xl">{estado.tomadas}</b> de {estado.cupo} auditorías del día</p>
        <Progress value={(100 * estado.tomadas) / Math.max(1, estado.cupo)} aria-label="Cupo cubierto" />
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
        <Label htmlFor="codigo">Código de la etiqueta del parabrisas</Label>
        <Input id="codigo" ref={campo} value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="ABF6"
          className="h-24 rounded-lg px-6 text-3xl tracking-widest uppercase" />
      </form>

      {estado.pendientes.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Códigos con unidades pendientes">
          {estado.pendientes.map((p) => (
            <Button key={p.codigo} type="button" size="sm" variant="compact" aria-pressed={decision?.codigo === p.codigo}
              className="aria-pressed:border-ford-blue aria-pressed:bg-ford-blue aria-pressed:text-white"
              onClick={() => setCodigo(p.codigo)}>
              {p.codigo} · {p.pendiente}
            </Button>
          ))}
        </div>
      ) : <p className="mt-4"><b>Cupo del día cubierto.</b> No queda nada pendiente.</p>}

      <Respuesta decision={decision} tomando={tomando} alTomar={tomar} />
    </div>
  )
}

function Respuesta({ decision: d, tomando, alTomar }: { decision: Decision | null; tomando: boolean; alTomar: () => void }) {
  const base = 'mt-6 flex min-h-56 flex-col justify-center gap-4 rounded-lg p-8'
  if (!d) {
    return (
      <div className={cn(base, 'bg-ford-gray')} aria-live="polite">
        <p className="flex items-center gap-3 text-2xl"><Icono nombre="audito" className="size-8" />Escribí o tocá un código</p>
        <p>La respuesta aparece acá: auditar o no, y por qué.</p>
      </div>
    )
  }
  const pos = d.posicion ? `Puesto ${d.posicion} del ranking.` : ''
  if (d.decision === 'auditar') {
    return (
      <div className={cn(base, 'bg-ford-blue text-white')} aria-live="polite">
        <p className="flex items-center gap-3 text-3xl font-medium tracking-tight"><Icono nombre="check" className="size-10" />Auditar {d.codigo}</p>
        <p>Quedan <b>{d.quedan}</b> de este código hoy. {pos} Motivo: {d.motivo.toLowerCase()}.</p>
        <Button size="cta" variant="inverse" onClick={alTomar} disabled={tomando} className="self-start">
          <Icono nombre="check" />{tomando ? 'Registrando…' : 'Tomar esta unidad'}
        </Button>
      </div>
    )
  }
  const fuera = d.decision === 'fuera_del_programa'
  return (
    <div className={cn(base, fuera ? 'border-3 border-ford-skyview' : 'bg-ford-gray')} aria-live="polite">
      <p className="flex items-center gap-3 text-3xl font-medium tracking-tight">
        <Icono nombre={fuera ? 'fuera' : 'menos'} className="size-10" />
        {fuera ? `${d.codigo} no está en el programa` : `No auditar ${d.codigo}`}
      </p>
      <p>{d.motivo}. {pos}</p>
    </div>
  )
}
