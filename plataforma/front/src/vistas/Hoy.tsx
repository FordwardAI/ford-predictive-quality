import { useEffect, useRef, useState } from 'react'

import { Ayuda, Encabezado } from '@/components/comunes'
import { Icono } from '@/components/iconos'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { api, type ClaveModelo, type Simulacion } from '@/lib/api'
import { useApp } from '@/lib/estado'
import { entero, pct, veces } from '@/lib/formato'

// Calidad de Planta, al inicio del día: cuatro decisiones (día, cupo, programa y modelo) y un solo botón.
export function Hoy() {
  const { meta, hoja, estado, armar, modelo } = useApp()
  const [dia, setDia] = useState(String(hoja?.dia ?? meta.dia_inicial))
  const [cupo, setCupo] = useState('')
  const [fuente, setFuente] = useState<'simulado' | 'archivo'>('simulado')
  const [clave, setClave] = useState<ClaveModelo>(hoja?.modelo ?? meta.modelos.find((m) => m.por_defecto)!.clave)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [sim, setSim] = useState<Simulacion | null>(null)
  const inputArchivo = useRef<HTMLInputElement>(null)

  useEffect(() => { api<Simulacion>('simulacion').then(setSim).catch(() => {}) }, [])

  const datoDia = meta.dias.find((d) => String(d.dia) === dia)!
  const elegido = modelo(clave)
  const m = sim?.lista ? sim.modelos?.[clave].metricas : null

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (fuente === 'archivo' && !archivo) return setError('Elegí el archivo del programa (columnas unidad,codigo).')
    setEnviando(true)
    try {
      await armar({ dia: +dia, cupo: cupo ? +cupo : null, modelo: clave, programa: archivo && fuente === 'archivo' ? await archivo.text() : null })
      location.hash = 'hoja'
    } catch (err) {
      setError((err as Error).message)
      setEnviando(false)
    }
  }

  return (
    <>
      <Encabezado ojo="Calidad de Planta · inicio del día" titulo="Preparar el" acento="día"
        bajada="La plataforma ordena los códigos programados y reparte el cupo. Usa solo resultados ya conocidos." />

      {hoja && estado && (
        <section className="mb-8 flex flex-wrap items-center justify-between gap-6 rounded-lg bg-ford-gray p-6">
          <div className="min-w-64 flex-1">
            <h2 className="text-2xl">Día {hoja.dia} en curso</h2>
            <p className="mt-2">{estado.tomadas} de {estado.cupo} unidades enviadas a auditoría · {modelo(hoja.modelo).nombre}</p>
            <Progress value={(100 * estado.tomadas) / Math.max(1, estado.cupo)} className="mt-3 max-w-md" aria-label="Cupo cubierto" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild><a href="#hoja">Ver la hoja</a></Button>
            <Button asChild><a href="#seguimiento"><Icono nombre="ronda" />Ver el seguimiento</a></Button>
          </div>
        </section>
      )}

      <Card className="max-w-4xl rounded-lg border-2 py-0">
        <CardContent className="p-8">
          <form onSubmit={enviar} className="grid gap-8 md:grid-cols-2" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dia">Día del VIN</Label>
              <Select value={dia} onValueChange={setDia}>
                <SelectTrigger id="dia" className="h-12 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meta.dias.map((d) => <SelectItem key={d.dia} value={String(d.dia)}>Día {d.dia} · {entero(d.unidades)} unidades</SelectItem>)}
                </SelectContent>
              </Select>
              <p>Días de validación {meta.validacion[0]}–{meta.validacion[1]}. La prueba final no se relee.</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="cupo">Cupo del día</Label>
              <Input id="cupo" className="h-12" type="number" min={1} inputMode="numeric" placeholder={String(datoDia.cupo)}
                value={cupo} onChange={(e) => setCupo(e.target.value)} />
              <p>Lo fija Calidad de Planta. Vacío: 5 % del programa ({datoDia.cupo}).</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Programa de producción</Label>
              <ToggleGroup type="single" variant="outline" value={fuente} className="w-full"
                onValueChange={(v) => v && setFuente(v as typeof fuente)}>
                <ToggleGroupItem value="simulado" className="h-12 flex-1">Simulado con la base</ToggleGroupItem>
                <ToggleGroupItem value="archivo" className="h-12 flex-1">Subir CSV</ToggleGroupItem>
              </ToggleGroup>
              {fuente === 'archivo' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <input ref={inputArchivo} type="file" accept=".csv,text/csv" className="sr-only" aria-label="Archivo del programa"
                    onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
                  <Button type="button" variant="compact" size="sm" onClick={() => inputArchivo.current?.click()}>Elegir archivo</Button>
                  <span className="min-w-0 truncate">{archivo ? archivo.name : 'Columnas unidad,codigo; sin VIN.'}</span>
                </div>
              ) : <p>Unidades de ese día con ids ficticios; permite ver el resultado al cerrar.</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="modelo" className="flex items-center gap-1">
                Modelo
                <Ayuda>{elegido.detalle} {elegido.origen} {elegido.advertencia}</Ayuda>
              </Label>
              <Select value={clave} onValueChange={(v) => setClave(v as ClaveModelo)}>
                <SelectTrigger id="modelo" className="h-12 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meta.modelos.map((x) => <SelectItem key={x.clave} value={x.clave}>{x.nombre}{x.por_defecto ? ' (recomendado)' : ''}</SelectItem>)}
                </SelectContent>
              </Select>
              <p>{m ? <>En validación: <b>{pct(m.precision_cupo)}</b> de las elegidas se calibraron, {veces(m.veces_azar)} el azar.</> : 'Calculando su resultado en validación…'}</p>
            </div>

            {error && (
              <Alert className="md:col-span-2 rounded-lg border-3 border-ford-skyview">
                <Icono nombre="info" />
                <AlertTitle>No se pudo armar la hoja</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="md:col-span-2">
              <Button type="submit" size="cta" disabled={enviando}><Icono nombre="hoja" />{enviando ? 'Armando…' : 'Armar la hoja'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
