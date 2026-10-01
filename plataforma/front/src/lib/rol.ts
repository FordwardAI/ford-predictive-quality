import { useState } from 'react'

// Quién usa la plataforma en este dispositivo. Es una comodidad del dispositivo, no un permiso: se guarda en el
// navegador y puede faltar (ventana privada, datos borrados), así que todo funciona sin él.
export type Rol = 'seleccion' | 'calidad'
const CLAVE = 'plataforma-fordwardai-rol'

function leer(): Rol | null {
  // Un acceso directo (?rol=seleccion en la tablet de la playa) fija el rol del dispositivo.
  const pedido = new URLSearchParams(location.search).get('rol')
  if (pedido === 'seleccion' || pedido === 'calidad') {
    try { localStorage.setItem(CLAVE, pedido) } catch { /* sin almacenamiento */ }
    return pedido
  }
  try {
    const v = localStorage.getItem(CLAVE)
    return v === 'seleccion' || v === 'calidad' ? v : null
  } catch {
    return null
  }
}

export function useRol(): [Rol | null, (r: Rol | null) => void] {
  const [rol, setRol] = useState<Rol | null>(leer)
  return [rol, (r) => {
    try { if (r) localStorage.setItem(CLAVE, r); else localStorage.removeItem(CLAVE) } catch { /* sin almacenamiento */ }
    setRol(r)
  }]
}
