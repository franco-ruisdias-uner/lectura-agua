import { httpClient } from '@/api/client'

import type { ArchivoSubido, RespuestaUno } from '@/types/api'

function fileNameFromUri(uri: string): string {
  const last = uri.split('/').pop()
  return last && last.length > 0 ? last : 'foto.jpg'
}

function mimeFromName(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

export async function uploadImage(localUri: string): Promise<string> {
  const name = fileNameFromUri(localUri)
  const form = new FormData()
  form.append('archivo', {
    uri: localUri,
    name,
    type: mimeFromName(name),
  } as unknown as Blob)

  const response = await httpClient.post<RespuestaUno<ArchivoSubido>>('/archivos', form, {
    timeout: 60000,
  })
  return response.data.datos.url
}

export function isRemoteFileUrl(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://')
}
