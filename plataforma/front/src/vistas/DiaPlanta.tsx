import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Ayuda, Cifra, Encabezado } from '@/components/comunes'
import { Icono } from '@/components/iconos'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api, type ClaveModelo, type Planta } from '@/lib/api'
import { useApp, useSincronizar } from '@/lib/estado'
import { entero } from '@/lib/formato'

// Calidad de Planta al inicio del día: qué entró (Gate Release y resultados), con qué modelo y qué cupo se trabaja.
export function DiaPlanta() {
  const { meta, planta, setPlanta, refrescarPlanta, hoja, estado, armar, modelo, refrescar } = useApp()
  const [cupo, setCupo] = useState('')
  const [clave, setClave] = useState<ClaveModelo>(hoja?.modelo ?? meta.modelos.find((m) => m.por_defecto)!.clave)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [reiniciar, setReiniciar] = useState(false)
  useSincronizar(refrescarPlanta)

  const t = planta.dia
  const armadaHoy = planta.hoja_armada && hoja?.dia === t
  const prog = planta.programa

  async function accion(nombre: string, f: () => Promise<void>) {
    setOcupado(nombre)
    try { await f() } catch (e) { toast.error((e as Error).message) } finally { setOcupado(null) }
  }

  const avanzar = () => accion('avanzar', async () => {
    const r = await api<{ avance: { dia: number; nuevas: number; resultados: number; calibradas: number; version_nueva: number | null }; planta: Planta }>('planta/avanzar', {})
    setPlanta(r.planta)
    await refrescar()
    const a = r.avance
    toast.success(`Día ${a.dia}: ${entero(a.nuevas)} unidades pasaron Gate Release · ${a.resultados} resultados de auditoría (${a.calibradas} CALIBRADA)`)
    if (a.version_nueva) toast(`Actualización programada: el modelo pasó a v${a.version_nueva}`)
  })

  return (
    <>
      <Encabezado ojo="Calidad de Planta" titulo={`Día ${t} en la`} acento="planta"
        bajada="Lo que entró hoy, con qué modelo se prioriza y cuántas unidades se auditan." />

      {prog.hoy && (
        <section className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-ford-blue px-6 py-4 text-white" aria-live="polite">
          <p className="flex items-center gap-3"><Icono nombre="modelo" />Hoy el modelo se actualizó solo a <b>v{planta.version.numero}</b>, con los resultados hasta el Día {planta.version.entrenado_hasta}.</p>
          <Button variant="inverse" size="sm" asChild><a href="#modelo">Qué cambió</a></Button>
        </section>
      )}

      <section aria-label="Entradas" className="mb-10 grid gap-6 lg:grid-cols-3">
        <Entrada titulo="Gate Release" valor={entero(planta.gate_release_hoy)} unidad="unidades hoy"
          apoyo={`${entero(planta.playa)} esperan en la playa (${entero(planta.playa_dias_anteriores)} de días anteriores)`}
          ultima={planta.entradas.ingreso} columnas="unidad,codigo,dia" ruta="ingreso" alImportar={setPlanta} />
        <Entrada titulo="Resultados de auditoría" valor={entero(planta.con_resultado)} unidad={`de ${entero(planta.enviadas_total)} enviadas`}
          apoyo="Exportación de QLS con el resultado de Auditoría Adicional"
          ultima={planta.entradas.resultados} columnas="unidad,resultado,dia,componente" ruta="resultados" alImportar={setPlanta} />
        <div className="flex flex-col gap-3 rounded-lg border-2 border-ford-gray p-6">
          <h2 className="text-lg">Modelo vigente</h2>
          <Cifra rotulo="" valor={`v${planta.version.numero}`} apoyo={`resultados hasta el Día ${planta.version.entrenado_hasta}`} />
          <p>Se actualiza solo cada {prog.cada} días. Próxima: Día {prog.proxima}, con {prog.nuevos} resultados nuevos hasta hoy.</p>
          <Button variant="compact" size="sm" asChild className="mt-auto self-start"><a href="#modelo">Ver modelo</a></Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
      {armadaHoy && estado ? (
        <section className="flex flex-wrap content-start items-center justify-between gap-6 rounded-lg bg-ford-gray p-6 lg:col-span-2">
          <div className="min-w-64 flex-1">
            <h2 className="text-2xl">Hoja del Día {t} armada</h2>
            <p className="mt-2">{estado.tomadas} de {estado.cupo} unidades enviadas a auditoría · {modelo(estado.modelo).nombre} v{estado.version}</p>
            <Progress value={(100 * estado.tomadas) / Math.max(1, estado.cupo)} className="mt-3 max-w-md" aria-label="Cupo cubierto" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild><a href="#hoja">Ver la hoja</a></Button>
            <Button asChild><a href="#seguimiento"><Icono nombre="seguimiento" />Seguimiento</a></Button>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border-2 border-ford-gray p-6 lg:col-span-2">
          <h2 className="mb-6 text-2xl">Armar la hoja del Día {t}</h2>
          <form className="grid gap-8 md:grid-cols-2" onSubmit={(e) => {
            e.preventDefault()
            accion('armar', async () => { await armar({ cupo: cupo === '' ? null : +cupo, modelo: clave }); location.hash = 'hoja' })
          }}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cupo">Cupo del día</Label>
              <Input id="cupo" className="h-12" type="number" min={0} inputMode="numeric" placeholder={String(planta.cupo_sugerido)}
                value={cupo} onChange={(e) => setCupo(e.target.value)} />
              <p>Lo fija Calidad de Planta. Vacío: el 5 % de las {entero(planta.gate_release_hoy)} que pasaron Gate Release hoy ({planta.cupo_sugerido}).</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="modelo" className="flex items-center gap-1">Modelo
                <Ayuda>{modelo(clave).detalle} {modelo(clave).advertencia}</Ayuda></Label>
              <Select value={clave} onValueChange={(v) => setClave(v as ClaveModelo)}>
                <SelectTrigger id="modelo" className="h-12 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meta.modelos.map((x) => <SelectItem key={x.clave} value={x.clave}>{x.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              <p>{modelo(clave).por_defecto ? 'Recomendado. ' : ''}Usa la versión v{planta.version.numero}: el histórico y los resultados hasta el Día {planta.version.entrenado_hasta}.</p>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" size="cta" disabled={!!ocupado || planta.playa === 0}>
                <Icono nombre="hoja" />{ocupado === 'armar' ? 'Armando…' : 'Armar la hoja'}
              </Button>
              {planta.playa === 0 && <p className="mt-3">No hay unidades en la playa de despacho.</p>}
            </div>
          </form>
        </section>
      )}

      {planta.modo === 'simulada' && (
        <section className="flex flex-col rounded-lg bg-ford-gray p-6">
          <h2 className="text-lg">Fuente simulada · base ficticia</h2>
          <p className="mt-2">Hasta que haya conexión con Ford, la base se reproduce día por día con el mismo contrato:
            entran las unidades de Gate Release y, de 1 a 5 días después, los resultados de lo enviado.</p>
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
            <Button variant="outline" onClick={avanzar} disabled={!!ocupado || t >= planta.fin}>
              {ocupado === 'avanzar' ? 'Avanzando…' : `Avanzar al Día ${t + 1}`}
            </Button>
            <Button variant="ghost" onClick={() => setReiniciar(true)} disabled={!!ocupado}>Reiniciar en el Día {planta.inicio}</Button>
          </div>
          {t >= planta.fin && <p className="mt-3">Fin de la validación: los días siguientes son la prueba final, que no se relee.</p>}
        </section>
      )}
      </div>

      <Dialog open={reiniciar} onOpenChange={setReiniciar}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">¿Reiniciar la simulación?</DialogTitle>
            <DialogDescription>Se borran los envíos, los resultados y las versiones del modelo, y el reloj vuelve al Día {planta.inicio}.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setReiniciar(false)}>Cancelar</Button>
            <Button onClick={() => accion('reiniciar', async () => {
              const r = await api<{ planta: Planta }>('planta/reiniciar', {})
              setPlanta(r.planta)
              await refrescar()
              setReiniciar(false)
              toast(`Simulación reiniciada en el Día ${r.planta.dia}`)
            })}>Reiniciar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Una entrada de datos: lo último que llegó y la importación por archivo (mismo contrato que la API).
function Entrada({ titulo, valor, unidad, apoyo, ultima, columnas, ruta, alImportar }: {
  titulo: string; valor: string; unidad: string; apoyo: string; ultima: { dia: number | null; n: number } | null
  columnas: string; ruta: string; alImportar: (p: Planta) => void
}) {
  const archivo = useRef<HTMLInputElement>(null)
  async function importar(f: File) {
    try {
      const r = await api<{ planta: Planta; ingresadas?: number; recibidos?: number }>(ruta, { csv: await f.text() })
      alImportar(r.planta)
      toast.success(`${f.name}: ${r.ingresadas ?? r.recibidos} filas recibidas`)
    } catch (e) {
      toast.error(`${f.name}: ${(e as Error).message}`)
    } finally {
      if (archivo.current) archivo.current.value = ''
    }
  }
  return (
    <div className="flex flex-col gap-3 rounded-lg border-2 border-ford-gray p-6">
      <h2 className="text-lg">{titulo}</h2>
      <Cifra rotulo="" valor={valor} apoyo={unidad} />
      <p>{apoyo}</p>
      <p>{ultima ? `Última recepción: ${ultima.n} filas${ultima.dia != null ? `, Día ${ultima.dia}` : ''}` : 'Todavía no se recibió nada'}</p>
      <input ref={archivo} type="file" accept=".csv,text/csv" className="sr-only" aria-label={`Importar ${titulo}`}
        onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])} />
      <div className="mt-auto flex items-center gap-2">
        <Button variant="compact" size="sm" onClick={() => archivo.current?.click()}>Importar CSV</Button>
        <Ayuda>Columnas: {columnas}. Mismo contrato que la API (POST /api/{ruta}).</Ayuda>
      </div>
    </div>
  )
}
