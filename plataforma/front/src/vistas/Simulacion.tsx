import { useEffect, useMemo, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'

import { Ayuda, Cifra, Encabezado } from '@/components/comunes'
import { Icono } from '@/components/iconos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { api, type ClaveModelo, type Simulacion } from '@/lib/api'
import { useApp } from '@/lib/estado'
import { dec, entero, LECTURA, pct, rangoPct } from '@/lib/formato'

type Seleccion = ClaveModelo | 'todos'
const CLAVES: ClaveModelo[] = ['rf', 'catboost', 'tasa_fija']
// §9.3: serie principal Skyview, segunda Ford Blue, tercera Ford Blue punteada, azar Off-Black discontinuo.
const TRAZO = [
  { stroke: '#066FEF', strokeWidth: 4 },
  { stroke: '#00095B', strokeWidth: 3 },
  { stroke: '#00095B', strokeWidth: 2, strokeDasharray: '2 6' },
]

// «¿Le gana al azar?»: la validación día por día con el mismo cupo. Primero la respuesta (cifras y curva); la tabla
// por día y la comparación quedan en pestañas.
export function SimulacionBase() {
  const { hoja, meta, modelo } = useApp()
  const [sim, setSim] = useState<Simulacion | null>(null)
  const [sel, setSel] = useState<Seleccion>(hoja?.modelo ?? meta.modelos.find((m) => m.por_defecto)!.clave)
  const [idx, setIdx] = useState<number | null>(null)
  const [jugando, setJugando] = useState(false)
  const [vel, setVel] = useState('250')
  const timer = useRef<number | null>(null)

  useEffect(() => {
    let vivo = true
    const pedir = () => api<Simulacion>('simulacion').then((s) => {
      if (!vivo) return
      setSim(s)
      if (!s.lista) setTimeout(pedir, 2000)
    })
    pedir()
    return () => { vivo = false }
  }, [])

  const datos = useMemo(() => {
    if (!sim?.lista || !sim.modelos) return null
    const serie = sim.modelos.azar.serie
    const acum: Record<string, number> = {}
    return serie.map((p, i) => {
      const fila: Record<string, number> = { dia: p.dia, cupo: p.cupo }
      for (const c of CLAVES) fila[c] = acum[c] = (acum[c] ?? 0) + sim.modelos![c].serie[i].encontradas
      fila.azar = acum.azar = (acum.azar ?? 0) + sim.modelos![sel === 'todos' ? 'rf' : sel].serie[i].esperado_azar
      fila.k = acum.k = (acum.k ?? 0) + p.cupo
      return fila
    })
  }, [sim, sel])

  const fin = datos ? datos.length - 1 : 0
  const i = idx ?? fin
  useEffect(() => {
    if (!jugando) return
    timer.current = window.setInterval(() => setIdx((x) => {
      const n = (x ?? 0) + 1
      if (n >= fin) { setJugando(false); return fin }
      return n
    }), +vel)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [jugando, vel, fin])

  const claves = sel === 'todos' ? CLAVES : [sel]
  const principal = claves[0]

  return (
    <>
      <Encabezado ojo="Evaluación sobre la base" titulo="¿Le gana al" acento="azar?"
        bajada="Cada día de validación el modelo llena el cupo del 5 % con lo que se sabía cinco días antes. Se cuenta cuántas de las elegidas se calibraron." />

      <ToggleGroup type="single" variant="outline" value={sel} onValueChange={(v) => v && setSel(v as Seleccion)}
        className="mb-8 flex-wrap" aria-label="Modelo">
        {CLAVES.map((c) => <ToggleGroupItem key={c} value={c} className="h-12 px-5">{modelo(c).corto}</ToggleGroupItem>)}
        <ToggleGroupItem value="todos" className="h-12 px-5">Comparar los tres</ToggleGroupItem>
      </ToggleGroup>

      {!datos || !sim?.modelos ? (
        <div className="flex flex-col gap-4">
          <p>Calculando: se reentrenan los modelos día por día con cinco semillas (alrededor de un minuto la primera vez).</p>
          <Skeleton className="h-24 w-full bg-ford-gray" /><Skeleton className="h-96 w-full bg-ford-gray" />
        </div>
      ) : (() => {
        const m = sim.modelos[principal].metricas
        const enc = datos[i][principal], esp = datos[i].azar, k = datos[i].k
        const alFinal = i === fin
        return (
          <>
            <section className="mb-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
              <Cifra rotulo="Hasta el día" valor={datos[i].dia} apoyo={`${entero(k)} auditadas en ${i + 1} días`} />
              <Cifra rotulo={`Calibradas · ${modelo(principal).corto}`} valor={enc} acento apoyo={`${pct(enc / k)} de las elegidas`} />
              <Cifra rotulo="Al azar, esperado" valor={dec(esp, 1)} apoyo={`${pct(esp / k)} de las elegidas`} />
              <Cifra rotulo="Veces el azar" valor={dec(enc / esp)}
                apoyo={alFinal ? `rango ${dec(m.veces_azar_rango95[0])} a ${dec(m.veces_azar_rango95[1])} · ${LECTURA[m.lectura]}` : 'el rango aparece al final'}
                ayuda="Rango del 95 % por remuestreo de días (2.000 réplicas con semilla registrada)." />
            </section>

            <Card className="mb-8 rounded-lg border-2 py-0">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 p-6 pb-0">
                <CardTitle className="text-2xl">Calibradas encontradas, acumulado</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="icon" aria-label={jugando ? 'Pausa' : 'Reproducir'}
                    onClick={() => { if (!jugando && i >= fin) setIdx(0); setJugando(!jugando) }}>
                    <Icono nombre={jugando ? 'pausa' : 'play'} />
                  </Button>
                  <Button size="icon" variant="compact" aria-label="Avanzar un día"
                    onClick={() => { setJugando(false); setIdx(i >= fin ? 0 : i + 1) }}><Icono nombre="paso" /></Button>
                  <Button variant="compact" onClick={() => { setJugando(false); setIdx(null) }}>Ver todo</Button>
                  <Select value={vel} onValueChange={setVel}>
                    <SelectTrigger className="h-12 w-32" aria-label="Velocidad"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="600">Lenta</SelectItem><SelectItem value="250">Normal</SelectItem><SelectItem value="80">Rápida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4 flex flex-wrap gap-6" aria-hidden="true">
                  {claves.map((c, j) => (
                    <span key={c} className="flex items-center gap-2">
                      <svg width="32" height="8"><line x1="0" x2="32" y1="4" y2="4" {...TRAZO[j]} /></svg>{modelo(c).corto}
                    </span>
                  ))}
                  <span className="flex items-center gap-2"><svg width="32" height="8"><line x1="0" x2="32" y1="4" y2="4" stroke="#0F0F0F" strokeWidth="2" strokeDasharray="8 6" /></svg>Azar esperado</span>
                </div>
                <div className="h-[360px]" role="img" aria-label="Calibradas encontradas acumuladas, modelo frente al azar">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datos.slice(0, i + 1)} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                      <CartesianGrid stroke="#F0F0F0" vertical={false} />
                      <XAxis dataKey="dia" type="number" domain={[datos[0].dia, datos[fin].dia]} tickCount={8}
                        tick={{ fill: '#00095B', fontSize: 16 }} stroke="#00095B" />
                      <YAxis domain={[0, Math.ceil(Math.max(...CLAVES.map((c) => datos[fin][c]), datos[fin].azar) / 10) * 10]}
                        tick={{ fill: '#00095B', fontSize: 16 }} stroke="#00095B" width={48} />
                      <RTooltip contentStyle={{ border: '2px solid #066FEF', borderRadius: 16, boxShadow: 'none', color: '#00095B', fontSize: 16 }}
                        labelFormatter={(d) => `Día ${d}`}
                        formatter={(v, n) => [dec(Number(v), n === 'azar' ? 1 : 0), n === 'azar' ? 'Azar esperado' : modelo(n as ClaveModelo).corto]} />
                      {claves.map((c, j) => <Line key={c} dataKey={c} type="linear" dot={false} isAnimationActive={false} {...TRAZO[j]} />)}
                      <Line dataKey="azar" type="linear" dot={false} isAnimationActive={false} stroke="#0F0F0F" strokeWidth={2} strokeDasharray="8 6" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="comparacion">
              <TabsList className="mb-4">
                <TabsTrigger value="comparacion">Comparación</TabsTrigger>
                <TabsTrigger value="dias">Por día</TabsTrigger>
              </TabsList>
              <TabsContent value="comparacion">
                <div className="overflow-x-auto rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-ford-blue hover:bg-ford-blue">
                        {['Modelo', 'Calibradas', 'Precisión (rango 95 %)', 'Veces el azar', 'Prueba final registrada'].map((c) => <TableHead key={c} className="text-white">{c}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {CLAVES.map((c) => {
                        const mm = sim.modelos![c].metricas, s = sim.modelos![c].semillas, pf = modelo(c).prueba_final
                        return (
                          <TableRow key={c} className="even:bg-ford-gray hover:bg-ford-gray">
                            <TableCell className="font-medium">{modelo(c).corto}{c === principal && <Badge className="ml-2">elegido</Badge>}</TableCell>
                            <TableCell>{mm.calibrada_elegidas} de {mm.elegidos}{s && <span className="block">{s.min}–{s.max} con {s.n} semillas</span>}</TableCell>
                            <TableCell>{pct(mm.precision_cupo)}<span className="block">{rangoPct(mm.precision_rango95)}</span></TableCell>
                            <TableCell>{dec(mm.veces_azar)}<span className="block">{LECTURA[mm.lectura]}</span></TableCell>
                            <TableCell className="whitespace-normal">{pf ? <>{pct(pf.precision)} contra {pct(pf.azar)} al azar<span className="block">Días {pf.dias[0]}–{pf.dias[1]}</span></> : 'Sin lectura (no se relee)'}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="dias">
                <div className="max-h-[480px] overflow-auto rounded-lg">
                  <Table>
                    <TableHeader className="sticky top-0">
                      <TableRow className="bg-ford-blue hover:bg-ford-blue">
                        {['Día', 'Unidades', 'Cupo', ...claves.map((c) => modelo(c).corto), 'Azar esperado'].map((c) => <TableHead key={c} className="text-white">{c}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sim.modelos.azar.serie.slice(0, i + 1).map((p, j) => (
                        <TableRow key={p.dia} className="even:bg-ford-gray hover:bg-ford-gray">
                          <TableCell>{p.dia}</TableCell><TableCell>{entero(p.unidades)}</TableCell><TableCell>{p.cupo}</TableCell>
                          {claves.map((c) => <TableCell key={c}>{sim.modelos![c].serie[j].encontradas}</TableCell>)}
                          <TableCell>{dec(sim.modelos![principal].serie[j].esperado_azar, 1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>

            <p className="mt-6 flex items-center gap-2">{sim.calificador}.
              <Ayuda>{modelo(principal).advertencia} La prueba final se leyó una sola vez por modelo; acá no se recalcula.</Ayuda></p>
          </>
        )
      })()}
    </>
  )
}
