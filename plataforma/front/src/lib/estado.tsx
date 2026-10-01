import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import { api, type ClaveModelo, type Estado, type Hoja, type Meta, type Modelo, type Planta } from './api'

// Estado compartido de la sesión: metadatos, la hoja del día y su avance. La fuente de verdad es el servidor;
// acá solo se guarda la última copia y se vuelve a pedir después de cada acción.
interface Contexto {
  meta: Meta
  planta: Planta
  setPlanta: (p: Planta) => void
  refrescarPlanta: () => Promise<Planta>
  hoja: Hoja | null
  estado: Estado | null
  modelo: (clave: ClaveModelo) => Modelo
  armar: (cuerpo: { cupo: number | null; modelo: ClaveModelo }) => Promise<void>
  refrescar: () => Promise<Estado | null>
  setEstado: (e: Estado) => void
}

const Ctx = createContext<Contexto | null>(null)

export function ProveedorEstado({ children, cargando, error }: { children: ReactNode; cargando: ReactNode; error: (e: Error) => ReactNode }) {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [planta, setPlanta] = useState<Planta | null>(null)
  const [hoja, setHoja] = useState<Hoja | null>(null)
  const [estado, setEstado] = useState<Estado | null>(null)
  const [falla, setFalla] = useState<Error | null>(null)

  useEffect(() => {
    Promise.all([api<Meta>('meta'), api<Planta>('planta'), api<{ hoja: Hoja | null; estado: Estado | null }>('hoja')])
      .then(([m, p, h]) => { setMeta(m); setPlanta(p); setHoja(h.hoja); setEstado(h.estado) })
      .catch(setFalla)
  }, [])

  // Trae el avance; si todavía no había hoja o Calidad armó otro día desde otro dispositivo, trae también la hoja.
  const refrescar = useCallback(async () => {
    if (hoja) {
      const e = await api<Estado>('estado').catch(() => null)
      if (e && e.dia === hoja.dia && e.modelo === hoja.modelo && e.cupo === hoja.cupo) { setEstado(e); return e }
    }
    const r = await api<{ hoja: Hoja | null; estado: Estado | null }>('hoja')
    setHoja(r.hoja)
    setEstado(r.estado)
    return r.estado
  }, [hoja])

  const armar = useCallback<Contexto['armar']>(async (cuerpo) => {
    const r = await api<{ hoja: Hoja; estado: Estado }>('dia', cuerpo)
    setHoja(r.hoja)
    setEstado(r.estado)
    setPlanta(await api<Planta>('planta'))
  }, [])

  const refrescarPlanta = useCallback(async () => {
    const p = await api<Planta>('planta')
    setPlanta(p)
    return p
  }, [])

  if (falla) return <>{error(falla)}</>
  if (!meta || !planta) return <>{cargando}</>
  const modelo = (clave: ClaveModelo) => meta.modelos.find((m) => m.clave === clave) ?? meta.modelos[0]
  return <Ctx.Provider value={{ meta, planta, setPlanta, refrescarPlanta, hoja, estado, modelo, armar, refrescar, setEstado }}>{children}</Ctx.Provider>
}

export function useApp() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp fuera del proveedor')
  return c
}

// Navegación por hash. Cada rol tiene sus vistas; una vista ajena al rol lleva a la principal del rol.
export type Vista = 'seleccion' | 'prioridades' | 'hoy' | 'hoja' | 'seguimiento' | 'resultados' | 'modelo' | 'linea' | 'simulacion'
const VISTAS: Vista[] = ['seleccion', 'prioridades', 'hoy', 'hoja', 'seguimiento', 'resultados', 'modelo', 'linea', 'simulacion']

export function useVista(): Vista | null {
  const leer = () => {
    const h = location.hash.slice(1) as Vista
    return VISTAS.includes(h) ? h : null
  }
  const [vista, setVista] = useState<Vista | null>(leer)
  useEffect(() => {
    const f = () => { setVista(leer()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return vista
}

// La tablet de la playa y el escritorio de Calidad comparten el día: se vuelve a pedir el estado cada 15 s y al
// volver a la pestaña.
export function useSincronizar(refrescar: () => Promise<unknown>, cada = 15000) {
  useEffect(() => {
    refrescar()
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') refrescar() }, cada)
    const alVolver = () => { if (document.visibilityState === 'visible') refrescar() }
    document.addEventListener('visibilitychange', alVolver)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', alVolver) }
  }, [refrescar, cada])
}
