import { Minus, Plus, Undo2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Encabezado } from '@/components/comunes'
import { Icono } from '@/components/iconos'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { api, type Decision, type Estado, type Ronda } from '@/lib/api'
import { useApp, useSincronizar } from '@/lib/estado'
import { cn } from '@/lib/utils'
import { ResultadoBadge } from '@/vistas/Resultados'

// La pantalla del responsable de la selección, en la playa de despacho. Una ronda (cada ~2 h): mirar qué buscar,
// leer el código de cada vehículo, enviar los que correspondan y, al terminar, avisar qué no estaba.
export function Seleccion() {
  const { hoja, estado, refrescar, setEstado } = useApp()
  const [codigo, setCodigo] = useState('')
  const [decision, setDecision] = useState<Decision | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [terminando, setTerminando] = useState(false)
  const campo = useRef<HTMLInputElement>(null)

  useSincronizar(refrescar)
  useEffect(() => {
    const c = codigo.trim()
    if (!c || !hoja) { setDecision(null); return }
    const t = setTimeout(() => { api<Decision>('decidir', { codigo: c }).then(setDecision).catch(() => {}) }, 150)
    return () => clearTimeout(t)
  }, [codigo, hoja, estado?.tomadas])

  if (!hoja || !estado) {
    return (
      <div className="mx-auto max-w-xl">
        <Encabezado ojo="Selección para Auditoría Adicional" titulo="Esperando la" acento="hoja" />
        <section className="rounded-lg bg-ford-gray p-8">
          <h2 className="text-2xl">Calidad de Planta todavía no armó la hoja de hoy</h2>
          <p className="mt-3">Mientras tanto, la selección sigue como hoy, al azar. Esta pantalla se actualiza sola cuando la hoja esté lista.</p>
        </section>
      </div>
    )
  }

  const cubierto = estado.tomadas >= estado.cupo || estado.pendientes.length === 0
  const ronda = estado.rondas.length + 1

  async function enviar() {
    if (!decision) return
    setEnviando(true)
    try {
      const r = await api<{ unidad: string; decision: Decision; estado: Estado }>('tomar', { codigo: decision.codigo })
      setEstado(r.estado)
      setDecision(r.decision)
      const env = r.estado.enviadas.find((e) => e.unidad === r.unidad)
      toast.success(`${r.decision.codigo}: unidad ${r.unidad}${env?.dia_gr != null ? ` (Gate Release Día ${env.dia_gr})` : ''} enviada a auditoría`, {
        action: { label: 'Deshacer', onClick: () => deshacer(r.unidad) },
      })
      setCodigo('')
      campo.current?.focus()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  async function deshacer(unidad: string) {
    try {
      const r = await api<{ decision: Decision; estado: Estado }>('deshacer', { unidad })
      setEstado(r.estado)
      toast(`Se deshizo el envío de ${unidad}`)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  // Última enviada de cada código: la que se puede deshacer.
  const ultimas = new Set(Object.values(Object.fromEntries(estado.enviadas.map((e) => [e.codigo, e.unidad]))))

  return (
    <div className="mx-auto max-w-xl">
      <Encabezado ojo={`Día ${hoja.dia} · ronda ${ronda}`} titulo="¿La" acento="envío?" />

      <section aria-label="Avance del día" className="mb-8">
        <p className="mb-2 flex items-baseline gap-2"><b className="text-3xl">{estado.tomadas}</b> de {estado.cupo} enviadas hoy</p>
        <Progress value={(100 * estado.tomadas) / Math.max(1, estado.cupo)} aria-label="Cupo cubierto" />
      </section>

      {cubierto ? (
        <section className="mb-8 rounded-lg bg-ford-blue p-8 text-white" aria-live="polite">
          <p className="flex items-center gap-3 text-3xl font-medium tracking-tight"><Icono nombre="check" className="size-10" />
            {estado.cupo === 0 ? 'Hoy no se audita' : 'Cupo del día cubierto'}</p>
          <p className="mt-3">{estado.cupo === 0
            ? 'El cupo de hoy es 0: no hubo unidades nuevas de Gate Release. Si Calidad de Planta fija otro cupo, aparece acá.'
            : 'No hace falta enviar más unidades hoy.'}</p>
        </section>
      ) : (
        <>
          <section aria-label="Qué buscar en la playa" className="mb-6">
            <h2 className="mb-3 text-lg">Qué buscar</h2>
            <div className="flex flex-wrap gap-2">
              {estado.pendientes.map((p) => (
                <Button key={p.codigo} type="button" size="sm" variant="compact" aria-pressed={decision?.codigo === p.codigo}
                  className="aria-pressed:border-ford-blue aria-pressed:bg-ford-blue aria-pressed:text-white"
                  onClick={() => setCodigo(p.codigo)}>
                  {p.codigo} · {p.pendiente}
                </Button>
              ))}
            </div>
          </section>

          <form onSubmit={(e) => { e.preventDefault(); if (decision?.decision === 'auditar') enviar() }} className="flex flex-col gap-2">
            <Label htmlFor="codigo">Código de la etiqueta del parabrisas</Label>
            <Input id="codigo" ref={campo} value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="ABF6" enterKeyHint="send"
              className="h-24 rounded-lg px-6 text-3xl tracking-widest uppercase" />
          </form>
          <Respuesta decision={decision} enviando={enviando} alEnviar={enviar} />
        </>
      )}

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg">Enviadas hoy</h2>
          {!cubierto && <Button variant="compact" size="sm" onClick={() => setTerminando(true)}>Terminar ronda {ronda}</Button>}
        </div>
        {estado.enviadas.length ? (
          <ul className="divide-y-2 divide-ford-gray">
            {estado.enviadas.slice().reverse().map((e) => (
              <li key={e.unidad} className="flex min-h-12 items-center justify-between gap-3 py-2">
                <span className="flex flex-col gap-1">
                  <span><b>{e.codigo}</b> · {e.unidad} · ronda {e.ronda}</span>
                  <ResultadoBadge e={{ resultado: e.resultado, componente: null, dia_resultado: null }} />
                </span>
                {ultimas.has(e.unidad) && !e.resultado && (
                  <Button variant="ghost" size="sm" onClick={() => deshacer(e.unidad)}><Undo2 />Deshacer</Button>
                )}
              </li>
            ))}
          </ul>
        ) : <p>Todavía no se envió ninguna unidad.</p>}
      </section>

      <TerminarRonda abierto={terminando} alCerrar={() => setTerminando(false)} ronda={ronda}
        alTerminar={(r, e) => {
          setEstado(e)
          const reciben = r.cambios.filter((c) => c.despues > c.antes).map((c) => c.codigo)
          toast.success(`Ronda ${r.numero} registrada` + (reciben.length ? `. Ahora buscá también: ${reciben.join(', ')}` : ''))
          if (r.azar) toast(`Se agotó el ranking: ${r.azar} unidad(es) se eligen al azar`)
        }} />
    </div>
  )
}

function Respuesta({ decision: d, enviando, alEnviar }: { decision: Decision | null; enviando: boolean; alEnviar: () => void }) {
  const base = 'mt-6 flex min-h-56 flex-col justify-center gap-4 rounded-lg p-8'
  if (!d) {
    return (
      <div className={cn(base, 'bg-ford-gray')} aria-live="polite">
        <p className="flex items-center gap-3 text-2xl"><Icono nombre="audito" className="size-8" />Escribí o tocá un código</p>
        <p>La respuesta aparece acá: si la unidad va a Auditoría Adicional, y por qué.</p>
      </div>
    )
  }
  if (d.decision === 'auditar') {
    return (
      <div className={cn(base, 'bg-ford-blue text-white')} aria-live="polite">
        <p className="flex items-center gap-3 text-3xl font-medium tracking-tight"><Icono nombre="check" className="size-10" />Enviar {d.codigo} a auditoría</p>
        <p>Faltan <b>{d.quedan}</b> de este código hoy · {d.motivo.toLowerCase()} · puesto {d.posicion} de prioridad.</p>
        <Button size="cta" variant="inverse" onClick={alEnviar} disabled={enviando} className="self-start">
          <Icono nombre="check" />{enviando ? 'Enviando…' : 'Enviar esta unidad'}
        </Button>
      </div>
    )
  }
  return (
    <div className={cn(base, 'bg-ford-gray')} aria-live="polite">
      <p className="flex items-center gap-3 text-3xl font-medium tracking-tight"><Icono nombre="menos" className="size-10" />No enviar {d.codigo}</p>
      <p>{d.motivo}.{d.posicion ? ` Puesto ${d.posicion} de prioridad.` : ''}</p>
    </div>
  )
}

// Al terminar la ronda solo se pregunta por lo que se buscaba: qué códigos no estaban o tenían menos unidades.
function TerminarRonda({ abierto, alCerrar, ronda, alTerminar }: {
  abierto: boolean; alCerrar: () => void; ronda: number; alTerminar: (r: Ronda, e: Estado) => void
}) {
  const { estado } = useApp()
  const [habia, setHabia] = useState<Record<string, number>>({})
  const [enviando, setEnviando] = useState(false)
  useEffect(() => {
    if (abierto && estado) setHabia(Object.fromEntries(estado.pendientes.map((p) => [p.codigo, p.pendiente])))
  }, [abierto]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!estado) return null
  const cambiar = (c: string, d: number) => setHabia((x) => ({ ...x, [c]: Math.max(0, (x[c] ?? 0) + d) }))

  async function confirmar() {
    setEnviando(true)
    try {
      // Solo viajan los códigos con menos unidades que las buscadas; el resto se supone en la playa.
      const faltan = Object.fromEntries(estado!.pendientes.filter((p) => (habia[p.codigo] ?? p.pendiente) < p.pendiente)
        .map((p) => [p.codigo, habia[p.codigo]]))
      const r = await api<{ ronda: Ronda; estado: Estado }>('ronda', { en_playa: faltan })
      alTerminar(r.ronda, r.estado)
      alCerrar()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && alCerrar()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Terminar la ronda {ronda}</DialogTitle>
          <DialogDescription>¿Faltó algo de lo que buscabas? Lo que no estaba pasa al siguiente código del ranking.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col divide-y-2 divide-ford-gray">
          {estado.pendientes.map((p) => {
            const n = habia[p.codigo] ?? p.pendiente
            return (
              <li key={p.codigo} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span><b className="text-lg">{p.codigo}</b><span className="block">buscabas {p.pendiente}</span></span>
                <span className="flex items-center gap-2">
                  <Button size="icon-sm" variant="compact" aria-label={`Había una menos de ${p.codigo}`} onClick={() => cambiar(p.codigo, -1)} disabled={n === 0}><Minus /></Button>
                  <output className="w-24 text-center" aria-live="polite">{n === 0 ? 'no estaba' : n >= p.pendiente ? 'estaban' : `había ${n}`}</output>
                  <Button size="icon-sm" variant="compact" aria-label={`Había una más de ${p.codigo}`} onClick={() => cambiar(p.codigo, 1)} disabled={n >= p.pendiente}><Plus /></Button>
                </span>
              </li>
            )
          })}
        </ul>
        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={alCerrar}>Volver</Button>
          <Button onClick={confirmar} disabled={enviando}><Icono nombre="ronda" />{enviando ? 'Registrando…' : 'Terminar ronda'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
