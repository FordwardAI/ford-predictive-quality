const AR = 'es-AR'

export const entero = (n: number) => Math.round(n).toLocaleString(AR)
export const dec = (x: number | null | undefined, d = 2) =>
  x == null || !Number.isFinite(x) ? '—' : x.toLocaleString(AR, { minimumFractionDigits: d, maximumFractionDigits: d })
export const pct = (x: number | null | undefined, d = 1) => (x == null || !Number.isFinite(x) ? '—' : `${dec(100 * x, d)} %`)
export const rangoPct = (r: [number, number] | null | undefined) => (r ? `${pct(r[0])} a ${pct(r[1])}` : '—')
export const veces = (x: number | null | undefined) => (x == null ? '—' : `${dec(x)}×`)
export const LECTURA = { mejora: 'Mejor que el azar', inconcluso: 'No se distingue del azar', peor: 'Peor que el azar' } as const
