import { Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Cifra, Encabezado, Vacio } from '@/components/comunes'
import { Icono } from '@/components/iconos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api, type Cierre, type Estado, type Ronda } from '@/lib/api'
import { useApp } from '@/lib/estado'
import { dec, entero, pct } from '@/lib/formato'

// Cada ~2 h el equipo de analistas registra qué hay en la playa. Si un código no llegó, lo pendiente baja por el
// ranking (regla de la hoja); el historial y el cierre del día quedan aparte.
export function RondaPlaya() {
  const { hoja, estado, refrescar, setEstado } = useApp()
  const [playa, setPlaya] = useState<Record<string, number>>({})
  const [enviando, setEnviando] = useState(false)
  const [cierre, setCierre] = useState<Cierre | null>(null)

  useEffect(() => { refrescar() }, [refrescar])
  useEffect(() => {
    if (estado) setPlaya(Object.fromEntries(estado.pendientes.map((p) => [p.codigo, Math.max(0, p.programadas - p.tomadas.length)])))
  }, [estado])

  if (!hoja || !estado) {
    return (
      <>
        <Encabezado titulo="Ronda en la" acento="playa" />
        <Vacio titulo="Todavía no hay hoja para hoy" texto="La ronda sigue lo pendiente de la hoja del día."
          accion={<Button asChild size="cta"><a href="#hoy"><Icono nombre="hoy" />Preparar el día</a></Button>} />
      </>
    )
  }

  const pendientes = estado.pendientes.reduce((a, p) => a + p.pendiente, 0)
  const cambiar = (c: string, d: number) => setPlaya((x) => ({ ...x, [c]: Math.max(0, (x[c] ?? 0) + d) }))

  async function registrar() {
    setEnviando(true)
    try {
      const r = await api<{ ronda: Ronda; estado: Estado }>('ronda', { en_playa: playa })
      setEstado(r.estado)
      const bajaron = r.ronda.cambios.filter((c) => c.despues > c.antes).length
      toast.success(`Ronda ${r.ronda.numero} registrada` + (bajaron ? `: ${bajaron} código(s) reciben lo pendiente` : ''))
    } catch (e) { toast.error((e as Error).message) } finally { setEnviando(false) }
  }

  async function tomar(codigo: string) {
    try {
      const r = await api<{ unidad: string; estado: Estado }>('tomar', { codigo })
      setEstado(r.estado)
      toast.success(`Unidad ${r.unidad} registrada para ${codigo}`)
    } catch (e) { toast.error((e as Error).message) }
  }

  return (
    <>
      <Encabezado ojo={`Equipo de analistas · Día ${hoja.dia}`} titulo="Ronda en la" acento="playa"
        bajada="Marcá cuántas unidades de cada código hay en la playa. Si un código no llegó, lo pendiente pasa al siguiente del ranking."
        acciones={<Button variant="outline" onClick={() => api<Cierre>('cierre').then(setCierre)}><Icono nombre="check" />Cerrar el día</Button>} />

      <section className="mb-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
        <Cifra rotulo="Próxima ronda" valor={estado.rondas.length + 1} />
        <Cifra rotulo="Tomadas" valor={estado.tomadas} acento apoyo={`de ${estado.cupo}`} />
        <Cifra rotulo="Pendientes" valor={pendientes} />
        <Cifra rotulo="Al azar" valor={estado.azar} apoyo={estado.azar ? 'se agotó el ranking' : 'no hizo falta'} />
      </section>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          {estado.pendientes.length ? (
            <>
              <div className="overflow-x-auto rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-ford-blue hover:bg-ford-blue">
                      {['Código', 'Pendiente', 'En la playa', ''].map((c) => <TableHead key={c} className="text-white">{c}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estado.pendientes.map((p) => (
                      <TableRow key={p.codigo} className="even:bg-ford-gray hover:bg-ford-gray">
                        <TableCell>
                          <span className="block text-lg font-medium">{p.codigo}</span>
                          <span>{p.motivo} · puesto {p.posicion}</span>
                        </TableCell>
                        <TableCell className="text-lg">{p.pendiente}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="icon-sm" variant="compact" aria-label={`Una menos de ${p.codigo}`} onClick={() => cambiar(p.codigo, -1)}><Minus /></Button>
                            <output className="w-10 text-center text-lg" aria-live="polite">{playa[p.codigo] ?? 0}</output>
                            <Button size="icon-sm" variant="compact" aria-label={`Una más de ${p.codigo}`} onClick={() => cambiar(p.codigo, 1)}><Plus /></Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right"><Button size="sm" variant="compact" onClick={() => tomar(p.codigo)}>Tomar 1</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button size="cta" className="mt-6" disabled={enviando} onClick={registrar}><Icono nombre="ronda" />{enviando ? 'Registrando…' : 'Registrar la ronda'}</Button>
            </>
          ) : <Vacio titulo="Cupo del día cubierto" texto="No queda nada pendiente. Ya se puede cerrar el día." />}
        </section>

        <aside>
          <h2 className="mb-4 text-2xl">Historial</h2>
          {estado.rondas.length ? (
            <ol className="flex flex-col gap-4 border-l-2 border-ford-skyview pl-4">
              {estado.rondas.slice().reverse().map((r) => (
                <li key={r.numero}>
                  <p className="font-medium">Ronda {r.numero} · {r.tomadas} tomadas</p>
                  {r.cambios.length ? r.cambios.map((c) => (
                    <p key={c.codigo}>{c.codigo}: {c.antes} → {c.despues} <Badge variant="outline">{c.despues > c.antes ? 'recibe' : 'no llegó'}</Badge></p>
                  )) : <p>Sin cambios en lo pendiente.</p>}
                  {r.azar > 0 && <p><b>{r.azar} al azar:</b> se agotó el ranking.</p>}
                </li>
              ))}
            </ol>
          ) : <p>Todavía no se registró ninguna ronda.</p>}
        </aside>
      </div>

      <Dialog open={!!cierre} onOpenChange={(o) => !o && setCierre(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Resultado del Día {hoja.dia}</DialogTitle>
            <DialogDescription>{cierre?.aclaracion ?? cierre?.motivo}</DialogDescription>
          </DialogHeader>
          {cierre?.disponible && (
            <div className="grid grid-cols-3 gap-6">
              <Cifra rotulo="Auditadas" valor={cierre.tomadas} apoyo={`cupo ${cierre.cupo}`} />
              <Cifra rotulo="Se calibraron" valor={cierre.calibradas} acento apoyo={pct(cierre.tomadas ? cierre.calibradas! / cierre.tomadas : null)} />
              <Cifra rotulo="Al azar" valor={dec(cierre.esperado_azar, 1)} apoyo={`${pct(cierre.tasa_dia)} de ${entero(cierre.unidades_dia!)}`} />
            </div>
          )}
          <p>Un solo día dice poco. La comparación con incertidumbre está en Simulación.</p>
        </DialogContent>
      </Dialog>
    </>
  )
}
