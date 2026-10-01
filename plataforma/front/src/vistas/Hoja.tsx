import { ChevronDown, ChevronRight } from 'lucide-react'
import { Fragment, useState } from 'react'

import { Cifra, Encabezado, Vacio } from '@/components/comunes'
import { Icono } from '@/components/iconos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Fila, Hoja } from '@/lib/api'
import { useApp, useSincronizar } from '@/lib/estado'
import { dec, entero, pct, rangoPct } from '@/lib/formato'

// La hoja responde una pregunta: qué códigos auditar hoy y cuántas unidades de cada uno. El ranking completo, el
// detalle de cada código y la metodología quedan a un clic.
export function HojaDelDia({ soloLectura = false }: { soloLectura?: boolean }) {
  const { hoja, estado, modelo, refrescar } = useApp()
  const [detalle, setDetalle] = useState<Fila | null>(null)
  useSincronizar(refrescar)
  if (!hoja || !estado) {
    return (
      <>
        <Encabezado titulo="Hoja del" acento="día" />
        <Vacio titulo="Todavía no hay hoja para hoy" texto="Calidad de Planta la arma al inicio del día con el programa de producción y el cupo."
          accion={soloLectura ? undefined : <Button asChild size="cta"><a href="#hoy"><Icono nombre="hoy" />Preparar el día</a></Button>} />
      </>
    )
  }

  const m = modelo(hoja.modelo)
  const motivo = (c: string) => estado.pendientes.find((p) => p.codigo === c)?.motivo
    ?? hoja.unidades.find((u) => u.codigo === c)?.motivo ?? 'Prioridad'
  // Cantidad vigente: lo pendiente más lo tomado. Cambia si una ronda reasigna lo de un código que no llegó.
  const tomadas = (c: string) => estado.tomadas_por_codigo[c]?.length ?? 0
  const sugeridas = (f: Fila) => (estado.pendientes.find((p) => p.codigo === f.codigo)?.pendiente ?? 0) + tomadas(f.codigo)
  const aAuditar = hoja.filas.filter((f) => sugeridas(f) > 0)
  const ultimo = hoja.filas.map((f) => sugeridas(f) > 0).lastIndexOf(true)

  return (
    <>
      <Encabezado ojo={soloLectura ? 'Prioridades del día' : `Hoja del día · ${m.nombre}`} titulo={`Día ${hoja.dia}:`} acento="qué auditar"
        bajada="Se priorizan códigos, no vehículos: dentro de un código cualquier unidad sirve."
        acciones={soloLectura ? undefined :
          <>
            <ComoLeer hoja={hoja} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><Icono nombre="descarga" />Descargar<ChevronDown /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild><a href="/api/descarga?formato=xlsx">Planilla Excel</a></DropdownMenuItem>
                <DropdownMenuItem asChild><a href="/api/descarga?formato=html">Imprimible (una página)</a></DropdownMenuItem>
                <DropdownMenuItem asChild><a href="/api/descarga?formato=csv">CSV</a></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        } />

      <section className="mb-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
        <Cifra rotulo="Cupo del día" valor={hoja.cupo} acento apoyo={`${entero(hoja.programadas)} en la playa`} />
        <Cifra rotulo="Códigos a auditar" valor={aAuditar.length} apoyo={`de ${hoja.filas.length} programados`} />
        <Cifra rotulo="Modelo" valor={<span className="text-2xl">{m.corto} v{hoja.version.numero}</span>}
          apoyo={`resultados hasta el Día ${hoja.version.entrenado_hasta}`} />
        <div className="flex flex-col gap-1">
          <span>Avance</span>
          <span className="text-3xl leading-tight font-medium tracking-tight">{estado.tomadas}<span className="text-2xl"> / {estado.cupo}</span></span>
          <Progress value={(100 * estado.tomadas) / Math.max(1, estado.cupo)} className="mt-2" aria-label="Cupo cubierto" />
        </div>
      </section>

      <Tabs defaultValue="auditar">
        <TabsList className="mb-4">
          <TabsTrigger value="auditar">A auditar ({aAuditar.length})</TabsTrigger>
          <TabsTrigger value="ranking">Ranking completo ({hoja.filas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="auditar">
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aAuditar.map((f) => {
              const q = sugeridas(f), t = tomadas(f.codigo)
              return (
                <li key={f.codigo}>
                  <button type="button" onClick={() => setDetalle(f)}
                    className="flex w-full flex-col gap-4 rounded-lg border-2 border-ford-gray p-6 text-left transition-colors duration-300 hover:border-ford-skyview">
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-3xl font-medium tracking-tight">{f.codigo}</span>
                      <Badge variant={motivo(f.codigo) === 'Prioridad' ? 'default' : 'outline'}>{motivo(f.codigo)}</Badge>
                    </span>
                    <span className="flex items-baseline gap-2"><b className="text-2xl">{q}</b> {q === 1 ? 'unidad' : 'unidades'} · {t} tomadas</span>
                    <Progress value={(100 * t) / q} aria-label={`Avance de ${f.codigo}`} />
                    <span className="flex items-center justify-between">
                      Tasa estimada {pct(f.tasa)}
                      <span className="flex items-center gap-1 text-ford-skyview">Detalle<ChevronRight className="size-5" /></span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {hoja.sin_cubrir > 0 && <p className="mt-4"><b>El programa no alcanza para el cupo:</b> faltan {hoja.sin_cubrir}; completar al azar.</p>}
        </TabsContent>

        <TabsContent value="ranking">
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-ford-blue hover:bg-ford-blue">
                  {['#', 'Código', 'A auditar', 'Tasa estimada', 'Observada', 'Mercado', ''].map((c, i) => (
                    <TableHead key={i} className={i === 0 || (i >= 2 && i <= 4) ? 'text-right text-white' : 'text-white'}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {hoja.filas.map((f, i) => (
                  <Fragment key={f.codigo}>
                    <TableRow onClick={() => setDetalle(f)} className="cursor-pointer even:bg-ford-gray hover:bg-ford-gray">
                      <TableCell className="text-right">{i + 1}</TableCell>
                      <TableCell className="font-medium">{f.codigo}</TableCell>
                      <TableCell className="text-right">{sugeridas(f) || ''}{f.minimo && <Badge variant="outline" className="ml-2">mínimo</Badge>}</TableCell>
                      <TableCell className="text-right">{pct(f.tasa)}</TableCell>
                      <TableCell className="text-right">{f.n ? `${pct(f.cal / f.n)} · n ${entero(f.n)}` : 'sin resultados'}</TableCell>
                      <TableCell>{f.mercado}</TableCell>
                      <TableCell className="w-8"><ChevronRight className="size-5" aria-label="Ver detalle" /></TableCell>
                    </TableRow>
                    {i === ultimo && (
                      <TableRow className="hover:bg-white">
                        <TableCell colSpan={7} className="border-y-2 border-ford-skyview whitespace-normal">
                          Hasta acá se llena el cupo del día ({hoja.cupo}). Más abajo, sin cantidad.
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <DetalleCodigo fila={detalle} hoja={hoja} tomadas={detalle ? estado.tomadas_por_codigo[detalle.codigo] ?? [] : []}
        alCerrar={() => setDetalle(null)} />
    </>
  )
}

function DetalleCodigo({ fila, hoja, tomadas, alCerrar }: { fila: Fila | null; hoja: Hoja; tomadas: string[]; alCerrar: () => void }) {
  const porQue = fila && hoja.por_que.find((p) => p.codigo === fila.codigo)
  const unidades = fila ? hoja.unidades.filter((u) => u.codigo === fila.codigo).flatMap((u) => u.ids) : []
  const minimo = fila && hoja.exploracion.find((x) => x.codigo === fila.codigo)
  return (
    <Sheet open={!!fila} onOpenChange={(o) => !o && alCerrar()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {fila && (
          <>
            <SheetHeader className="p-6 pb-0">
              <SheetTitle className="text-3xl">{fila.codigo}</SheetTitle>
              <SheetDescription>Puesto {hoja.filas.indexOf(fila) + 1} de {hoja.filas.length} · {fila.programadas} en la playa hoy</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-8 p-6">
              <div className="grid grid-cols-2 gap-6">
                <Cifra rotulo="Tasa estimada" valor={pct(fila.tasa)} acento ayuda="La que ordena el ranking: calculada por el modelo con resultados de Día ≤ t − 5." />
                <Cifra rotulo="Veces la general" valor={dec(fila.veces)} />
                <Cifra rotulo="Observada" valor={fila.n ? pct(fila.cal / fila.n) : '—'}
                  apoyo={fila.n ? `${fila.cal} de ${entero(fila.n)} auditadas` : 'Sin resultados propios'} />
                <Cifra rotulo="Rango del 95 %" valor={<span className="text-2xl">{rangoPct(fila.rango)}</span>} />
              </div>
              <div className="flex flex-wrap gap-2">
                {[fila.mercado, fila.version, fila.motor, fila.traccion].map((a, i) => <Badge key={i} variant="secondary">{a}</Badge>)}
              </div>
              {porQue && <section><h3 className="mb-2 text-lg">Por qué este código</h3><p>{porQue.texto}</p></section>}
              {minimo && (
                <section><h3 className="mb-2 text-lg">Mínimo por código</h3>
                  <p>Recibe una unidad para mantener su tasa al día: último resultado conocido {minimo.ultimo == null ? 'ninguno' : `del Día ${minimo.ultimo}`}.</p></section>
              )}
              {unidades.length > 0 && (
                <section><h3 className="mb-2 text-lg">Unidades sugeridas</h3>
                  <div className="flex flex-wrap gap-2">
                    {unidades.map((u) => <Badge key={u} variant={tomadas.includes(u) ? 'default' : 'outline'}>{u}{tomadas.includes(u) ? ' · tomada' : ''}</Badge>)}
                  </div>
                  <p className="mt-2">Cualquier unidad del código sirve: la lista es una sugerencia del programa.</p></section>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ComoLeer({ hoja }: { hoja: Hoja }) {
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="ghost"><Icono nombre="info" />Cómo leerla</Button></DialogTrigger>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Cómo leer la hoja</DialogTitle>
          <DialogDescription>Uso, cifras y límites de la recomendación.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <section><h3 className="mb-2 text-lg">Cómo se usa</h3><ol className="list-decimal space-y-1 pl-6">{hoja.textos.uso.map((x) => <li key={x}>{x}</li>)}</ol></section>
          <section><h3 className="mb-2 text-lg">Modelo y cupo</h3><p>{hoja.textos.evaluacion}</p><p className="mt-2">{hoja.textos.corte}</p></section>
          <section><h3 className="mb-2 text-lg">Tasas</h3><p>{hoja.textos.tasa}</p><p className="mt-2">{hoja.textos.minimo}</p></section>
          <section><h3 className="mb-2 text-lg">Límites</h3><ul className="list-disc space-y-1 pl-6">{hoja.limites.map((x) => <li key={x}>{x}</li>)}</ul></section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
