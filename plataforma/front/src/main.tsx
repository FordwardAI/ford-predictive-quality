import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProveedorEstado } from '@/lib/estado'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider delayDuration={200}>
      <ProveedorEstado
        cargando={<p className="p-12 text-2xl">Cargando la plataforma…</p>}
        error={(e) => (
          <div className="p-12">
            <h1 className="text-3xl">No se pudo conectar</h1>
            <p className="mt-3">{e.message}. ¿Está corriendo <code>python -m plataforma.servidor</code>?</p>
          </div>
        )}>
        <App />
      </ProveedorEstado>
    </TooltipProvider>
  </StrictMode>,
)
