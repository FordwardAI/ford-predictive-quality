import { useCallback, useEffect, useState } from 'react'

import { Cifra, Encabezado } from '@/components/comunes'
import { Icono } from '@/components/iconos'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api, type Cambios, type Programa, type Version } from '@/lib/api'
import { useApp } from '@/lib/estado'
import { pct } from '@/lib/formato'

// El modelo se actualiza solo, con un calendario fijo. Nadie elige el momento mirando los resultados: eso sería una
// forma de sobreajuste, y los resultados que vuelven son solo de lo que el propio modelo eligió.
export function Modelo() {
  const { planta, modelo } = useApp()
  const [datos, setDatos] = useState<{ versiones: Version[]; programa: Programa; cambios: Cambios | null } | null>(null)
  const pedir = useCallback(() => { api<typeof datos>('modelo').then(setDatos) }, [])
  useEffect(() => { pedir() }, [pedir, planta.dia])

  const v = planta.version
  const prog = planta.programa
  const c = datos?.cambios
  return (
    <>
      <Encabezado ojo="Calidad de Planta · automático" titulo="Actualización del" acento="modelo"
        bajada="La plataforma actualiza el modelo sola, en días fijos, con los resultados que vuelven de la auditoría." />

      <section className="mb-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
        <Cifra rotulo="Versión vigente" valor={`v${v.numero}`} apoyo={`resultados hasta el Día ${v.entrenado_hasta}`} />
        <Cifra rotulo="Próxima actualización" valor={`Día ${prog.proxima}`} acento apoyo={`en ${prog.proxima - planta.dia} día(s)`} />
        <Cifra rotulo="Resultados nuevos" valor={prog.nuevos} apoyo="entrarán en la próxima versión" />
        <Cifra rotulo="Modelo" valor={<span className="text-2xl">{c ? modelo(c.modelo).corto : modelo('rf').corto}</span>} />
      </section>

      <section className="mb-10 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg bg-ford-blue p-6 text-white lg:col-span-2">
          <p className="flex items-center gap-3 text-2xl"><Icono nombre="programa" className="size-7" />Calendario fijo</p>
          <p className="mt-3">Cada {prog.cada} días desde el Día {prog.desde} (próximas: Día {prog.proxima} y Día {prog.proxima + prog.cada}),
            con los resultados de Día ≤ t − 5. La versión nueva rige desde la hoja de ese día.</p>
          {prog.hoy && <p className="mt-3"><b>Hoy se actualizó a v{v.numero}.</b></p>}
        </div>
        <div className="rounded-lg bg-ford-gray p-6">
          <p className="flex items-center gap-2 text-lg font-medium"><Icono nombre="info" className="size-5" />Por qué automático</p>
          <p className="mt-2">Elegir cuándo actualizar mirando los resultados es sobreajustar. El calendario es el mismo que se
            evaluó en validación para los modelos reentrenados, y está fijo en el código: no se cambia desde la pantalla.</p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-2xl">Qué cambió en la última actualización</h2>
        {!datos ? <Skeleton className="h-64 w-full bg-ford-gray" /> : !c ? (
          <p>Todavía rige la versión inicial (histórico de auditorías al azar). La primera actualización es el Día {prog.proxima}.</p>
        ) : (
          <>
            <p className="mb-4">De v{c.anterior.numero} a v{c.nueva.numero}, para los códigos que hoy esperan en la playa: {c.suben} suben y {c.bajan} bajan.</p>
            <div className="max-h-[480px] overflow-auto rounded-lg">
              <Table>
                <TableHeader className="sticky top-0">
                  <TableRow className="bg-ford-blue hover:bg-ford-blue">
                    {['Código', `Puesto v${c.anterior.numero}`, `Puesto v${c.nueva.numero}`, `Tasa v${c.anterior.numero}`, `Tasa v${c.nueva.numero}`, ''].map((x) => <TableHead key={x} className="text-white">{x}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {c.filas.map((f) => {
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
          </>
        )}
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
