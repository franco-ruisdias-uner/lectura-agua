import axios from 'axios'

import { ApiRequestError, isApiErrorBody } from '@/api/errors'
import { getJwtToken } from '@/lib/secure-store'

export const httpClient = axios.create({
  baseURL: 'http://localhost:3500',
  timeout: 10000,
})

httpClient.interceptors.request.use(async (config) => {
  const token = await getJwtToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // POST /archivos es multipart: si forzamos JSON, se pierde el boundary.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }

  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (isApiErrorBody(error.response?.data)) {
        const { codigo, mensaje } = error.response.data.error
        return Promise.reject(new ApiRequestError(codigo, mensaje))
      }

      if (!error.response) {
        return Promise.reject(new ApiRequestError('', 'Sin conexión. Probá de nuevo.'))
      }
    }

    return Promise.reject(new ApiRequestError('', 'No se pudo completar el pedido'))
  },
)
