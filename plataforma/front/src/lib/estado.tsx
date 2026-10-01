import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import { api, type ClaveModelo, type Estado, type Hoja, type Meta, type Modelo } from './api'

// Estado compartido de la sesión: metadatos, la hoja del día y su avance. La fuente de verdad es el servidor;
// acá solo se guarda la última copia y se vuelve a pedir después de cada acción.
interface Contexto {
  meta: Meta
  hoja: Hoja | null
  estado: Estado | null
  modelo: (clave: ClaveModelo) => Modelo
  armar: (cuerpo: { dia: number; cupo: number | null; modelo: ClaveModelo; programa: string | null }) => Promise<void>
  refrescar: () => Promise<Estado | null>
  setEstado: (e: Estado) => void
}

const Ctx = createContext<Contexto | null>(null)

export function ProveedorEstado({ children, cargando, error }: { children: ReactNode; cargando: ReactNode; error: (e: Error) => ReactNode }) {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [hoja, setHoja] = useState<Hoja | null>(null)
  const [estado, setEstado] = useState<Estado | null>(null)
  const [falla, setFalla] = useState<Error | null>(null)

  useEffect(() => {
    Promise.all([api<Meta>('meta'), api<{ hoja: Hoja | null; estado: Estado | null }>('hoja')])
      .then(([m, h]) => { setMeta(m); setHoja(h.hoja); setEstado(h.estado) })
      .catch(setFalla)
  }, [])

  const refrescar = useCallback(async () => {
    if (!hoja) return null
    const e = await api<Estado>('estado')
    setEstado(e)
    return e
  }, [hoja])

  const armar = useCallback<Contexto['armar']>(async (cuerpo) => {
    const r = await api<{ hoja: Hoja; estado: Estado }>('dia', cuerpo)
    setHoja(r.hoja)
    setEstado(r.estado)
  }, [])

  if (falla) return <>{error(falla)}</>
  if (!meta) return <>{cargando}</>
  const modelo = (clave: ClaveModelo) => meta.modelos.find((m) => m.clave === clave) ?? meta.modelos[0]
  return <Ctx.Provider value={{ meta, hoja, estado, modelo, armar, refrescar, setEstado }}>{children}</Ctx.Provider>
}

export function useApp() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp fuera del proveedor')
  return c
}

// Navegación por hash: #hoy, #hoja, #audito, #ronda, #simulacion.
export type Vista = 'hoy' | 'hoja' | 'audito' | 'ronda' | 'simulacion'
const VISTAS: Vista[] = ['hoy', 'hoja', 'audito', 'ronda', 'simulacion']

export function useVista(): [Vista, (v: Vista) => void] {
  const leer = () => {
    const h = location.hash.slice(1) as Vista
    return VISTAS.includes(h) ? h : 'hoy'
  }
  const [vista, setVista] = useState<Vista>(leer)
  useEffect(() => {
    const f = () => { setVista(leer()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return [vista, (v) => { location.hash = v }]
}
