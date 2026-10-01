import { useCallback, useEffect, useState } from 'react'

import { Cifra, Encabezado, Vacio } from '@/components/comunes'
import { Icono } from '@/components/iconos'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { api, type Envio } from '@/lib/api'
import { useSincronizar } from '@/lib/estado'
import { pct } from '@/lib/formato'

type Filtro = 'todas' | 'CALIBRADA' | 'OK' | 'pendiente'

// ¿Fue acertada la elección? Unidad por unidad: CALIBRADA es un acierto (había algo que calibrar), OK no.
export function Resultados() {
  const [datos, setDatos] = useState<{ envios: Envio[]; cifras: { enviadas: number; con_resultado: number; calibradas: number; pendientes: number; precision: number | null } } | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const pedir = useCallback(() => api<typeof datos>('envios').then(setDatos), [])
  useSincronizar(pedir)
  useEffect(() => { pedir() }, [pedir])

  if (!datos) return <p>Cargando…</p>
  const { envios, cifras } = datos
  const visibles = envios.filter((e) => filtro === 'todas' || (filtro === 'pendiente' ? !e.resultado : e.resultado === filtro))

  return (
    <>
      <Encabezado ojo="Calidad de Planta · retorno de la auditoría" titulo="¿Fue" acento="acertada?"
        bajada="Cada unidad enviada, con la tasa que el modelo le asignaba al elegirla y lo que encontró la Auditoría Adicional." />

      <section className="mb-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
        <Cifra rotulo="Enviadas" valor={cifras.enviadas} />
        <Cifra rotulo="Con resultado" valor={cifras.con_resultado} apoyo={`${cifras.pendientes} pendientes`} />
        <Cifra rotulo="Aciertos (CALIBRADA)" valor={cifras.calibradas} acento />
        <Cifra rotulo="Precisión de lo enviado" valor={pct(cifras.precision)} apoyo="calibradas sobre auditadas con resultado"
          ayuda="Entre las unidades que la plataforma envió y ya tienen resultado. No es la tasa de toda la producción. Para compararla con el azar con incertidumbre, ver Evaluación." />
      </section>

      {envios.length === 0 ? (
        <Vacio titulo="Todavía no se envió ninguna unidad" texto="Los resultados aparecen acá cuando vuelve la exportación de QLS con lo auditado." />
      ) : (
        <>
          <ToggleGroup type="single" variant="outline" value={filtro} onValueChange={(v) => v && setFiltro(v as Filtro)} className="mb-4 flex-wrap" aria-label="Filtrar por resultado">
            <ToggleGroupItem value="todas" className="h-12 px-5">Todas ({envios.length})</ToggleGroupItem>
            <ToggleGroupItem value="CALIBRADA" className="h-12 px-5">Aciertos ({cifras.calibradas})</ToggleGroupItem>
            <ToggleGroupItem value="OK" className="h-12 px-5">OK ({cifras.con_resultado - cifras.calibradas})</ToggleGroupItem>
            <ToggleGroupItem value="pendiente" className="h-12 px-5">Pendientes ({cifras.pendientes})</ToggleGroupItem>
          </ToggleGroup>
          <div className="max-h-[640px] overflow-auto rounded-lg">
            <Table>
              <TableHeader className="sticky top-0">
                <TableRow className="bg-ford-blue hover:bg-ford-blue">
                  {['Unidad', 'Código', 'Enviada', 'Tasa al enviar', 'Modelo', 'Resultado'].map((c) => <TableHead key={c} className="text-white">{c}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.map((e) => (
                  <TableRow key={e.unidad} className="even:bg-ford-gray hover:bg-ford-gray">
                    <TableCell>{e.unidad}<span className="block">Gate Release Día {e.dia_gr}</span></TableCell>
                    <TableCell className="font-medium">{e.codigo}<span className="block font-normal">puesto {e.posicion}</span></TableCell>
                    <TableCell>Día {e.dia} · ronda {e.ronda}</TableCell>
                    <TableCell>{pct(e.tasa)}</TableCell>
                    <TableCell>v{e.version}</TableCell>
                    <TableCell><ResultadoBadge e={e} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  )
}

export function ResultadoBadge({ e }: { e: Pick<Envio, 'resultado' | 'componente' | 'dia_resultado'> }) {
  if (!e.resultado) return <span>Pendiente</span>
  if (e.resultado === 'CALIBRADA') {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <Badge><Icono nombre="check" className="size-4" />CALIBRADA · acierto</Badge>
        {e.componente && <span>{e.componente}</span>}
      </span>
    )
  }
  return <Badge variant="outline"><Icono nombre="menos" className="size-4" />OK</Badge>
}
