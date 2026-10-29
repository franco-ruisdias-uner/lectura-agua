import type { Lectura, Medidor, MotivoNovedad, Novedad, Ruta, Suministro, Usuario } from '@/types/entities'

/** Paginación de toda respuesta de lista. */
export interface Meta {
  total: number
  pagina: number
  porPagina: number
}

/** Éxito con una lista: { datos: [...], meta: {...} }. */
export interface RespuestaLista<T> {
  datos: T[]
  meta: Meta
}

/** Éxito con un solo recurso: { datos: {...}, meta: null }. */
export interface RespuestaUno<T> {
  datos: T
  meta: null
}

/** Error: { error: { codigo, mensaje } } — sin otros campos. */
export interface ApiError {
  error: {
    codigo: string
    mensaje: string
  }
}

/** Respuesta de POST /auth/ingreso. La API no manda refreshToken. */
export interface Sesion {
  token: string
  usuario: Usuario
}

/** Respuesta de POST /archivos. */
export interface ArchivoSubido {
  url: string
  tipo: 'imagen' | 'audio' | 'video'
  bytes: number
}

/** Respuesta de POST /rutas/:id/descarga: la jornada completa, sin paginar. */
export interface PaqueteRuta {
  ruta: Ruta
  suministros: Suministro[]
  medidores: Medidor[]
  lecturas: Lectura[]
  novedades: Novedad[]
}

/** Respuesta de GET /rutas/:id/avance: lo que el servidor ya recibió. */
export interface AvanceRuta {
  rutaId: string
  suministros: number
  leidos: number
  conNovedad: number
  pendientes: number
  fueraDeRango: number
}

/** Un renglón de GET /novedades/resumen (administración; acá no se usa). */
export interface ResumenNovedades {
  motivo: MotivoNovedad
  zona: string
  cantidad: number
}
