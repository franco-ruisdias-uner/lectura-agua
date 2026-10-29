import type { ApiError } from '@/types/api'

export class ApiRequestError extends Error {
  readonly codigo: string

  constructor(codigo: string, mensaje: string) {
    super(mensaje)
    this.name = 'ApiRequestError'
    this.codigo = codigo
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError
}

export function isApiErrorBody(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false
  const body = value.error
  if (typeof body !== 'object' || body === null) return false
  return (
    'codigo' in body &&
    'mensaje' in body &&
    typeof body.codigo === 'string' &&
    typeof body.mensaje === 'string'
  )
}

export function isMissingResource(error: unknown): boolean {
  return (
    isApiRequestError(error) &&
    (error.codigo === 'RUTA_NO_ENCONTRADA' ||
      error.codigo === 'SUMINISTRO_NO_ENCONTRADO' ||
      error.codigo === 'MEDIDOR_NO_ENCONTRADO' ||
      error.codigo === 'RECURSO_NO_ENCONTRADO')
  )
}

export function apiErrorMessage(
  error: unknown,
  fallback = 'No se pudo completar el pedido',
): string {
  if (isApiRequestError(error)) return error.message
  if (error instanceof Error && error.message.length > 0) return error.message
  return fallback
}
