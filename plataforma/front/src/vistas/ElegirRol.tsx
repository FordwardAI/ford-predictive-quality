import { Icono, type NombreIcono } from '@/components/iconos'
import type { Rol } from '@/lib/rol'

const ROLES: { rol: Rol; titulo: string; texto: string; donde: string; icono: NombreIcono }[] = [
  {
    rol: 'seleccion', titulo: 'Selección en la playa', icono: 'audito', donde: 'Tablet o celular',
    texto: 'Elijo qué unidades van a Auditoría Adicional: leo el código del parabrisas y la plataforma me dice si la envío.',
  },
  {
    rol: 'calidad', titulo: 'Calidad de Planta', icono: 'hoy', donde: 'Escritorio',
    texto: 'Preparo el día con el programa y el cupo, sigo el avance y reviso cómo rinde la selección.',
  },
]

// Primera pantalla del dispositivo: cada rol ve solo lo que necesita.
export function ElegirRol({ alElegir }: { alElegir: (r: Rol) => void }) {
  return (
    <div className="min-h-svh bg-ford-blue px-4 py-10 text-white md:px-12 md:py-16">
      <img src="ford-logo.png" alt="Ford" width={128} height={58} className="w-32" />
      <h1 className="mt-12 max-w-3xl text-3xl">¿Quién usa este dispositivo?</h1>
      <p className="mt-3 max-w-2xl">Se puede cambiar después desde el menú.</p>
      <ul className="mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
        {ROLES.map((r) => (
          <li key={r.rol}>
            <button type="button" onClick={() => alElegir(r.rol)}
              className="flex h-full w-full flex-col gap-4 rounded-lg bg-white p-8 text-left text-ford-blue transition-colors duration-300 hover:bg-ford-gray">
              <Icono nombre={r.icono} className="size-10" />
              <span className="text-2xl font-medium">{r.titulo}</span>
              <span>{r.texto}</span>
              <span className="mt-auto font-medium text-ford-skyview">{r.donde}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-16 text-2xl">FordwardAI</p>
    </div>
  )
}
