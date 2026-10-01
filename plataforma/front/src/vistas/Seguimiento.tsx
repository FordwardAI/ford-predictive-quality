import { Cifra, Encabezado, Vacio } from '@/components/comunes'
import { Icono } from '@/components/iconos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useApp, useSincronizar } from '@/lib/estado'

// Calidad de Planta sigue el día desde el escritorio: cuánto se envió de cada código y qué pasó en cada ronda.
// Se actualiza solo con lo que registra la tablet de la playa.
export function Seguimiento() {
  const { hoja, estado, refrescar, planta } = useApp()
  useSincronizar(refrescar)

  if (!hoja || !estado) {
    return (
      <>
        <Encabezado titulo="Seguimiento del" acento="día" />
        <Vacio titulo="Todavía no hay hoja para hoy" texto="El seguimiento empieza cuando se arma la hoja del día."
          accion={<Button asChild size="cta"><a href="#hoy"><Icono nombre="hoy" />Preparar el día</a></Button>} />
      </>
    )
  }

  const tomadas = (c: string) => estado.tomadas_por_codigo[c]?.length ?? 0
  const pendiente = (c: string) => estado.pendientes.find((p) => p.codigo === c)?.pendiente ?? 0
  const codigos = hoja.filas.filter((f) => pendiente(f.codigo) + tomadas(f.codigo) > 0)
  const pendientes = estado.pendientes.reduce((a, p) => a + p.pendiente, 0)

  return (
    <>
      <Encabezado ojo={`Calidad de Planta · Día ${hoja.dia}`} titulo="Seguimiento del" acento="día"
        bajada="Lo que registra el responsable de la selección en la playa, actualizado cada 15 segundos."
        acciones={<Button variant="outline" asChild><a href="#resultados"><Icono nombre="check" />Ver resultados</a></Button>} />

      <section className="mb-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
        <Cifra rotulo="Enviadas" valor={estado.tomadas} acento apoyo={`de un cupo de ${estado.cupo}`} />
        <Cifra rotulo="Pendientes" valor={pendientes} />
        <Cifra rotulo="Resultados recibidos" valor={planta.con_resultado} apoyo={`de ${planta.enviadas_total} enviadas en total`} />
        <Cifra rotulo="Al azar" valor={estado.azar} apoyo={estado.azar ? 'se agotó el ranking' : 'no hizo falta'} />
      </section>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <h2 className="mb-4 text-2xl">Por código</h2>
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-ford-blue hover:bg-ford-blue">
                  {['Código', 'Motivo', 'Enviadas', 'Avance'].map((c) => <TableHead key={c} className="text-white">{c}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {codigos.map((f) => {
                  const t = tomadas(f.codigo), q = t + pendiente(f.codigo)
                  const motivo = estado.pendientes.find((p) => p.codigo === f.codigo)?.motivo
                    ?? hoja.unidades.find((u) => u.codigo === f.codigo)?.motivo ?? 'Prioridad'
                  return (
                    <TableRow key={f.codigo} className="even:bg-ford-gray hover:bg-ford-gray">
                      <TableCell className="text-lg font-medium">{f.codigo}</TableCell>
                      <TableCell>{motivo}</TableCell>
                      <TableCell>{t} de {q}</TableCell>
                      <TableCell className="w-48">
                        {t >= q ? <Badge>completo</Badge> : <Progress value={(100 * t) / q} aria-label={`Avance de ${f.codigo}`} />}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </section>

        <aside>
          <h2 className="mb-4 text-2xl">Rondas</h2>
          {estado.rondas.length ? (
            <ol className="flex flex-col gap-4 border-l-2 border-ford-skyview pl-4">
              {estado.rondas.slice().reverse().map((r) => (
                <li key={r.numero}>
                  <p className="font-medium">Ronda {r.numero} · {r.tomadas} enviadas al terminar</p>
                  {r.cambios.length ? r.cambios.map((c) => (
                    <p key={c.codigo}>{c.codigo}: {c.antes} → {c.despues} <Badge variant="outline">{c.despues > c.antes ? 'recibe' : 'no llegó'}</Badge></p>
                  )) : <p>Encontró todo lo que buscaba.</p>}
                  {r.azar > 0 && <p><b>{r.azar} al azar:</b> se agotó el ranking.</p>}
                </li>
              ))}
            </ol>
          ) : <p>Todavía no se terminó ninguna ronda.</p>}
        </aside>
      </div>

    </>
  )
}
