// Contrato de la API local (plataforma/servidor.py). Ninguna respuesta lleva un VIN: las unidades son ids U-….
export type Par = [number, number]

export interface PruebaFinal {
  precision: number; rango: Par; azar: number; veces_azar: number; elegidos: number; calibrada_elegidas: number
  dias: Par; calificador: string; azar_simulado: number | null; fecha: string
}
export interface Modelo {
  clave: ClaveModelo; nombre: string; corto: string; detalle: string; origen: string; advertencia: string
  prueba_final: PruebaFinal | null; por_defecto: boolean
}
export type ClaveModelo = 'rf' | 'catboost' | 'tasa_fija'
export interface Meta {
  dias: { dia: number; unidades: number; cupo: number }[]; dia_inicial: number; validacion: Par
  modelos: Modelo[]; fuente: { csv: string; catalogo: string }; simulacion_lista: boolean; dia_activo: number | null
}
export interface Fila {
  codigo: string; sugerida: number; tasa: number; rango: Par | null; n: number; cal: number; veces: number | null
  programadas: number; acumulado: number; mercado: string; version: string; motor: string; traccion: string; minimo: boolean
}
export interface PorQue { codigo: string; texto: string; tasa_mercado: number | null; mercado: string }
export interface Hoja {
  dia: number; cupo: number; cupo_5: number; programadas: number; modelo: ClaveModelo; predictor: string
  programa_simulado: boolean; general: number; n_ventana: number; ventana: [number | null, number]; sin_cubrir: number
  minimo: { P: number; origen: string }; filas: Fila[]; exploracion: { codigo: string; ultimo: number | null }[]
  unidades: { codigo: string; motivo: string; ids: string[] }[]; por_que: PorQue[]; agrupaciones: string
  textos: { evaluacion: string; corte: string; tasa: string; minimo: string; uso: string[] }; limites: string[]
}
export interface Pendiente { codigo: string; pendiente: number; motivo: string; posicion: number; programadas: number; tomadas: string[] }
export interface Ronda { numero: number; en_playa: Record<string, number>; cambios: { codigo: string; antes: number; despues: number }[]; azar: number; tomadas: number }
export interface Estado {
  dia: number; cupo: number; modelo: ClaveModelo; tomadas: number; pendientes: Pendiente[]
  tomadas_por_codigo: Record<string, string[]>; rondas: Ronda[]; azar: number
}
export type TipoDecision = 'auditar' | 'no_auditar' | 'fuera_del_programa'
export interface Decision {
  codigo: string; tomadas: number; cupo: number; decision: TipoDecision; motivo: string
  quedan?: number; posicion?: number; programadas?: number
}
export interface Cierre {
  disponible: boolean; motivo?: string; dia?: number; tomadas?: number; cupo?: number; calibradas?: number
  esperado_azar?: number; tasa_dia?: number; unidades_dia?: number; aclaracion?: string
}
export interface Punto { dia: number; unidades: number; cupo: number; calibrada_dia: number; encontradas: number; esperado_azar: number }
export interface Metricas {
  dias: number; vins: number; elegidos: number; calibrada_elegidas: number; calibrada_tramo: number; precision_cupo: number
  precision_rango95: Par; azar_mismo_cupo: number; veces_azar: number; veces_azar_rango95: Par; lectura: 'mejora' | 'inconcluso' | 'peor'
}
export interface Simulacion {
  lista: boolean; tramo?: string; calificador?: string
  modelos?: Record<ClaveModelo | 'azar', { serie: Punto[]; metricas: Metricas; semillas?: { n: number; min: number; max: number } }>
}

export async function api<T>(ruta: string, cuerpo?: unknown): Promise<T> {
  const r = await fetch(`/api/${ruta}`, cuerpo === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo),
  })
  const datos = await r.json()
  if (!r.ok) throw new Error(datos.error || `Error ${r.status}`)
  return datos as T
}
