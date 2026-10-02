import { useCallback, useState } from 'react'

import { Cifra, Encabezado, Vacio } from '@/components/comunes'
import { Icono } from '@/components/iconos'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, type Grupo, type Linea } from '@/lib/api'
import { useApp, useSincronizar } from '@/lib/estado'
import { entero, pct } from '@/lib/formato'

// Lo que vuelve de la auditoría, devuelto a producción: dónde se calibra más y qué componentes, para mejorar la línea.
// El componente calibrado no se usa para predecir (es el resultado); acá es información de retorno.
export function ReporteLinea() {
  const { meta } = useApp()
  const [rep, setRep] = useState<Linea | null>(null)
  const pedir = useCallback(() => api<Linea>('linea').then(setRep), [])
  useSincronizar(pedir, 30000)

  return (
    <>
      <Encabezado ojo="Retorno a producción" titulo="Reporte para la" acento="línea"
        bajada="Qué se calibra y dónde, entre las unidades auditadas con resultado."
        acciones={<Button variant="outline" asChild><a href="/api/linea.csv"><Icono nombre="descarga" />Descargar CSV</a></Button>} />

      <p className="mb-8 max-w-3xl rounded-lg bg-ford-gray p-4">
        <b>Entre lo auditado.</b> La selección prioriza los códigos de mayor riesgo, así que estas tasas no son las de toda la
        producción: sirven para ver dónde mirar en la línea, no para medir la planta. {meta.demo ? 'Demo sintética' : 'Base ficticia'}; componentes anonimizados.
      </p>

      {!rep ? <p>Cargando…</p> : rep.auditadas === 0 ? (
        <Vacio titulo="Todavía no volvió ningún resultado" texto="El reporte se arma con los resultados de Auditoría Adicional de las unidades enviadas." />
      ) : (
        <>
          <section className="mb-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
            <Cifra rotulo="Auditadas con resultado" valor={entero(rep.auditadas)} />
            <Cifra rotulo="Calibradas" valor={entero(rep.calibradas)} acento apoyo={pct(rep.calibradas / rep.auditadas)} />
            <Cifra rotulo="Componente más calibrado" valor={rep.componentes[0]?.componente ?? '—'}
              apoyo={rep.componentes[0] ? `${pct(rep.componentes[0].parte)} de las calibraciones` : undefined} />
            <Cifra rotulo="Código con más calibraciones" valor={masCalibraciones(rep.por_codigo)?.grupo ?? '—'}
              apoyo={masCalibraciones(rep.por_codigo) ? `${masCalibraciones(rep.por_codigo)!.calibradas} calibradas` : undefined} />
          </section>

          <div className="mb-10 grid gap-10 xl:grid-cols-2">
            <section>
              <h2 className="mb-4 text-2xl">Componentes más calibrados</h2>
              <ul className="flex flex-col gap-3">
                {rep.componentes.map((c) => (
                  <li key={c.componente} className="grid grid-cols-[96px_minmax(0,1fr)_120px] items-center gap-3">
                    <b>{c.componente}</b>
                    <Progress value={100 * c.parte} aria-label={`${c.componente}: ${pct(c.parte)}`} />
                    <span>{c.n} · {pct(c.parte)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="mb-4 text-2xl">Tendencia por semana</h2>
              <TablaGrupos filas={rep.semanas} rotulo="Semana" formato={(g) => `Días ${g.desde}–${g.hasta}`} />
            </section>
          </div>

          <Tabs defaultValue="codigo">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="codigo">Por código</TabsTrigger>
              <TabsTrigger value="version">Por versión</TabsTrigger>
              <TabsTrigger value="motor">Por motor</TabsTrigger>
              <TabsTrigger value="mercado">Por mercado</TabsTrigger>
            </TabsList>
            <TabsContent value="codigo"><TablaGrupos filas={rep.por_codigo} rotulo="Código" conComponentes /></TabsContent>
            <TabsContent value="version"><TablaGrupos filas={rep.por_version} rotulo="Versión (dominante)" /></TabsContent>
            <TabsContent value="motor"><TablaGrupos filas={rep.por_motor} rotulo="Motor (dominante)" /></TabsContent>
            <TabsContent value="mercado"><TablaGrupos filas={rep.por_mercado} rotulo="Mercado de destino" /></TabsContent>
          </Tabs>
        </>
      )}
    </>
  )
}

const masCalibraciones = (g: Grupo[]) => g.slice().sort((a, b) => b.calibradas - a.calibradas)[0]

function TablaGrupos({ filas, rotulo, conComponentes, formato }: {
  filas: Grupo[]; rotulo: string; conComponentes?: boolean; formato?: (g: Grupo) => string
}) {
  return (
    <div className="max-h-[480px] overflow-auto rounded-lg">
      <Table>
        <TableHeader className="sticky top-0">
          <TableRow className="bg-ford-blue hover:bg-ford-blue">
            {[rotulo, 'Auditadas', 'Calibradas', 'Tasa', ...(conComponentes ? ['Componentes'] : [])].map((c) => <TableHead key={c} className="text-white">{c}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((g) => (
            <TableRow key={String(g.grupo)} className="even:bg-ford-gray hover:bg-ford-gray">
              <TableCell className="font-medium">{formato ? formato(g) : g.grupo}</TableCell>
              <TableCell>{entero(g.n)}</TableCell>
              <TableCell>{entero(g.calibradas)}</TableCell>
              <TableCell>{pct(g.tasa)}{g.n < 10 && <span className="block">n chico</span>}</TableCell>
              {conComponentes && <TableCell className="whitespace-normal">{g.componentes?.map((c) => `${c.componente} (${c.n})`).join(', ') || '—'}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
