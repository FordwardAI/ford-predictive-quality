import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Cifra, Encabezado } from '@/components/comunes'
import { Icono } from '@/components/iconos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api, type Planta, type Propuesta, type Recomendacion, type Version } from '@/lib/api'
import { useApp } from '@/lib/estado'
import { pct } from '@/lib/formato'

// El modelo cambia solo cuando el gerente lo decide. La plataforma recomienda y recuerda cuándo (regla de días y de
// resultados nuevos) y muestra qué cambiaría antes de aplicar. Los resultados nuevos son solo de lo que el modelo
// eligió: una muestra sesgada, por eso no se reentrena solo.
export function Modelo() {
  const { meta, planta, setPlanta, modelo } = useApp()
  const [datos, setDatos] = useState<{ versiones: Version[]; recomendacion: Recomendacion | null } | null>(null)
  const [propuesta, setPropuesta] = useState<Propuesta | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const pedir = useCallback(() => {
    api<{ versiones: Version[]; recomendacion: Recomendacion | null }>('modelo').then(setDatos)
    api<Propuesta>('modelo/propuesta').then(setPropuesta).catch(() => setPropuesta(null))
  }, [])
  useEffect(() => { pedir() }, [pedir, planta.dia])

  async function decidir(ruta: 'actualizar' | 'posponer') {
    setOcupado(true)
    try {
      const r = await api<{ planta: Planta; version?: number }>(`modelo/${ruta}`, {})
      setPlanta(r.planta)
      toast.success(ruta === 'actualizar' ? `Modelo actualizado a la versión ${r.version}: rige desde la próxima hoja` : 'Actualización pospuesta')
      pedir()
    } catch (e) { toast.error((e as Error).message) } finally { setOcupado(false) }
  }

  const rec = datos?.recomendacion
  const v = planta.version
  const cambian = propuesta?.filas.filter((f) => f.puesto_nuevo !== f.puesto_actual) ?? []
  return (
    <>
      <Encabezado ojo="Calidad de Planta · decisión del gerente" titulo="Actualizar el" acento="modelo"
        bajada="Con los resultados que vuelven de la auditoría, la plataforma recomienda cuándo actualizar. Decide el gerente; la versión nueva rige desde la próxima hoja." />

      <section className="mb-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
        <Cifra rotulo="Versión vigente" valor={`v${v.numero}`} apoyo={`resultados hasta el Día ${v.entrenado_hasta}`} />
        <Cifra rotulo="Días desde la versión" valor={rec?.dias ?? '—'} apoyo={`se recomienda cada ${meta.regla.dias}`} />
        <Cifra rotulo="Resultados nuevos" valor={rec?.nuevos ?? '—'} acento apoyo={`utilizables (Día ≤ ${planta.dia - 5}); mínimo ${meta.regla.resultados}`} />
        <Cifra rotulo="Modelo" valor={<span className="text-2xl">{propuesta ? modelo(propuesta.modelo).corto : '—'}</span>} />
      </section>

      <section className={rec?.recomendar ? 'mb-10 rounded-lg bg-ford-blue p-6 text-white' : 'mb-10 rounded-lg bg-ford-gray p-6'} aria-live="polite">
        <p className="flex items-center gap-3 text-2xl"><Icono nombre={rec?.recomendar ? 'info' : 'check'} className="size-7" />
          {rec?.recomendar ? 'Recomendado actualizar' : 'Por ahora no hace falta actualizar'}</p>
        <p className="mt-2">{rec?.motivo}.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant={rec?.recomendar ? 'inverse' : 'default'} onClick={() => decidir('actualizar')}
            disabled={ocupado || !propuesta || propuesta.nuevos === 0}>
            <Icono nombre="check" />Actualizar a v{v.numero + 1} (resultados hasta el Día {planta.dia - 5})
          </Button>
          {rec?.recomendar && <Button variant="ghost" className="text-white hover:bg-ford-twilight" onClick={() => decidir('posponer')} disabled={ocupado}>Posponer</Button>}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-2xl">Qué cambiaría hoy</h2>
        <p className="mb-4">Códigos que hoy esperan en la playa, ordenados con la versión nueva. {propuesta && `${propuesta.nuevos} resultados nuevos · ${propuesta.suben} suben y ${propuesta.bajan} bajan.`}</p>
        {!propuesta ? <Skeleton className="h-64 w-full bg-ford-gray" /> : (
          <div className="max-h-[480px] overflow-auto rounded-lg">
            <Table>
              <TableHeader className="sticky top-0">
                <TableRow className="bg-ford-blue hover:bg-ford-blue">
                  {['Código', `Puesto v${v.numero}`, `Puesto v${v.numero + 1}`, `Tasa v${v.numero}`, `Tasa v${v.numero + 1}`, ''].map((c) => <TableHead key={c} className="text-white">{c}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {propuesta.filas.map((f) => {
                  const d = f.puesto_actual - f.puesto_nuevo
                  return (
                    <TableRow key={f.codigo} className="even:bg-ford-gray hover:bg-ford-gray">
                      <TableCell className="font-medium">{f.codigo}</TableCell>
                      <TableCell>{f.puesto_actual}</TableCell>
                      <TableCell className="font-medium">{f.puesto_nuevo}</TableCell>
                      <TableCell>{pct(f.tasa_actual)}</TableCell>
                      <TableCell>{pct(f.tasa_nueva)}</TableCell>
                      <TableCell>{d > 0 ? <Badge>sube {d}</Badge> : d < 0 ? <Badge variant="outline">baja {-d}</Badge> : ''}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {propuesta && cambian.length === 0 && <p className="mt-3">Con estos resultados el orden no cambia.</p>}
      </section>

      <section>
        <h2 className="mb-4 text-2xl">Historial de versiones</h2>
        <ol className="flex flex-col gap-4 border-l-2 border-ford-skyview pl-4">
          {datos?.versiones.map((x) => (
            <li key={x.numero}>
              <p className="font-medium">v{x.numero} · Día {x.dia}{x.numero === v.numero && <Badge className="ml-2">vigente</Badge>}</p>
              <p>Resultados hasta el Día {x.entrenado_hasta} · {x.resultados_usados} nuevos · {x.decidido_por}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
