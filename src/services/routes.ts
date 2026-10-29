import { httpClient } from '@/api/client'
import { isApiRequestError, isMissingResource } from '@/api/errors'
import { isRemoteFileUrl, uploadImage } from '@/services/files'

import type { AvanceRuta, PaqueteRuta, RespuestaLista, RespuestaUno } from '@/types/api'
import type {
  Coordenadas,
  Lectura,
  Medidor,
  MotivoNovedad,
  Novedad,
  Ruta,
  Suministro,
} from '@/types/entities'

const packagesByRouteId = new Map<string, PaqueteRuta>()
const postedIdsByRoute = new Map<string, { lecturaIds: string[]; novedadIds: string[] }>()

export type CurrentResult =
  | { kind: 'reading'; lectura: Lectura }
  | { kind: 'incident'; novedad: Novedad }

export type RouteOverview = {
  route: Ruta
  supplyCount: number
  readCount: number
}

export type SupplyStopStatus = 'pending' | 'read' | 'incident'

export type SupplyStop = {
  suministro: Suministro
  // P-17: posición en el recorrido, no un campo de Suministro.
  position: number
  status: SupplyStopStatus
  reason: MotivoNovedad | null
}

export type RouteSupplies = {
  stops: SupplyStop[]
  unsynced: number
}

export type RouteDaySummary = {
  read: number
  incidents: number
  pending: number
  unsynced: number
}

export type ReadingContext = {
  route: Ruta
  suministro: Suministro
  medidor: Medidor
  lectura: Lectura | null
  nextSuministroId: string | null
}

export type SaveReadingResult =
  | { ok: true; lectura: Lectura; nextSuministroId: string | null }
  | { ok: false; reason: 'missing' | 'no-photo' | 'needs-confirmation' }

export type SaveIncidentResult =
  | { ok: true; novedad: Novedad; nextSuministroId: string | null }
  | { ok: false; reason: 'missing' | 'no-photo' | 'no-reason' }

export type CloseRouteResult =
  | { ok: true; route: Ruta; pending: number }
  | { ok: false; reason: 'missing' }
  | { ok: false; reason: 'closed'; cerradaEn: string | null; mensaje: string }
  | { ok: false; reason: 'unsynced'; readings: number; incidents: number; mensaje: string }

function nowIso(): string {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absolute = Math.abs(offsetMinutes)

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`
}

function latest<T extends { fechaHora: string }>(items: T[]): T | undefined {
  return items.reduce<T | undefined>(
    (best, item) => (!best || Date.parse(item.fechaHora) > Date.parse(best.fechaHora) ? item : best),
    undefined,
  )
}

function rememberPosted(routeId: string, kind: 'lectura' | 'novedad', id: string) {
  const current = postedIdsByRoute.get(routeId) ?? { lecturaIds: [], novedadIds: [] }
  if (kind === 'lectura') {
    current.lecturaIds = [...current.lecturaIds, id]
  } else {
    current.novedadIds = [...current.novedadIds, id]
  }
  postedIdsByRoute.set(routeId, current)
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)]
}

function nextSupplyId(route: Ruta, suministroId: string): string | null {
  const position = route.suministroIds.indexOf(suministroId)
  if (position < 0) return null
  return route.suministroIds[position + 1] ?? null
}

function meterForSupply(pkg: PaqueteRuta, suministro: Suministro): Medidor | undefined {
  const index = pkg.suministros.findIndex((item) => item.id === suministro.id)
  if (index >= 0) return pkg.medidores[index]
  return pkg.medidores.find((meter) => meter.id === suministro.medidorId)
}

// P-07: un resultado vigente por suministro. Una lectura le gana a una novedad.
export function currentResult(pkg: PaqueteRuta, suministroId: string): CurrentResult | null {
  const reading = latest(pkg.lecturas.filter((item) => item.suministroId === suministroId))
  if (reading) return { kind: 'reading', lectura: reading }

  const incident = latest(pkg.novedades.filter((item) => item.suministroId === suministroId))
  return incident ? { kind: 'incident', novedad: incident } : null
}

function stopsFromPackage(pkg: PaqueteRuta): SupplyStop[] {
  return pkg.suministros.map((suministro, index) => {
    const result = currentResult(pkg, suministro.id)
    let status: SupplyStopStatus = 'pending'
    let reason: MotivoNovedad | null = null
    if (result?.kind === 'reading') {
      status = 'read'
    } else if (result?.kind === 'incident') {
      status = 'incident'
      reason = result.novedad.motivo
    }

    return {
      suministro,
      position: index + 1,
      status,
      reason,
    }
  })
}

async function downloadRoute(routeId: string): Promise<PaqueteRuta> {
  const response = await httpClient.post<RespuestaUno<PaqueteRuta>>(`/rutas/${routeId}/descarga`)
  const pkg = response.data.datos
  packagesByRouteId.set(pkg.ruta.id, pkg)
  return pkg
}

async function resolvePhotoUri(fotoUri: string): Promise<string> {
  if (isRemoteFileUrl(fotoUri)) return fotoUri
  return uploadImage(fotoUri)
}

// P-03: conexión nueva, el medidor arranca en cero.
export function readingConsumption(
  valor: number,
  anterior: number | null,
  multiplicador: number,
): number {
  return (valor - (anterior ?? 0)) * multiplicador
}

// P-01: negativo, o más de 3 veces la referencia (promedio con piso 5, o 20 si no hay promedio).
export function isOutOfRange(consumo: number, consumoPromedio: number | null): boolean {
  if (consumo < 0) return true
  const reference = consumoPromedio == null ? 20 : Math.max(consumoPromedio, 5)
  return consumo > 3 * reference
}

export async function listRouteOverviews(): Promise<RouteOverview[]> {
  const response = await httpClient.get<RespuestaLista<Ruta>>('/yo/rutas')
  const routes = response.data.datos

  return Promise.all(
    routes.map(async (route) => {
      const avance = await httpClient.get<RespuestaUno<AvanceRuta>>(`/rutas/${route.id}/avance`)
      return {
        route,
        supplyCount: avance.data.datos.suministros,
        readCount: avance.data.datos.leidos,
      }
    }),
  )
}

export async function listRouteSupplies(routeKey: string): Promise<RouteSupplies | null> {
  try {
    const pkg = await downloadRoute(routeKey)
    return {
      stops: stopsFromPackage(pkg),
      // B-13: sin cola offline, lo que se guarda ya está en el servidor.
      unsynced: 0,
    }
  } catch (error) {
    if (isMissingResource(error)) return null
    throw error
  }
}

export async function getRouteDaySummary(routeKey: string): Promise<RouteDaySummary | null> {
  try {
    const response = await httpClient.get<RespuestaUno<AvanceRuta>>(`/rutas/${routeKey}/avance`)
    const avance = response.data.datos
    return {
      read: avance.leidos,
      incidents: avance.conNovedad,
      pending: avance.pendientes,
      unsynced: 0,
    }
  } catch (error) {
    if (isMissingResource(error)) return null
    throw error
  }
}

export async function getReadingContext(
  routeKey: string,
  suministroId: string,
): Promise<ReadingContext | null> {
  try {
    const pkg = await downloadRoute(routeKey)
    const suministro = pkg.suministros.find((item) => item.id === suministroId)
    if (!suministro) return null

    const medidor = meterForSupply(pkg, suministro)
    if (!medidor) return null

    const result = currentResult(pkg, suministroId)
    const lectura = result?.kind === 'reading' ? result.lectura : null

    return {
      route: pkg.ruta,
      suministro,
      medidor,
      lectura,
      nextSuministroId: nextSupplyId(pkg.ruta, suministroId),
    }
  } catch (error) {
    if (isMissingResource(error)) return null
    throw error
  }
}

export async function saveReading(input: {
  routeKey: string
  suministroId: string
  valor: number
  fotoUri: string
  // P-01: true cuando el lector vio el aviso y confirmó el número.
  confirmed: boolean
  // P-21: un fix al guardar. null si no hay permiso o falla el GPS.
  coordenadas: Coordenadas | null
}): Promise<SaveReadingResult> {
  if (input.fotoUri.length === 0) return { ok: false, reason: 'no-photo' }

  const pkg = await downloadRoute(input.routeKey)
  const suministro = pkg.suministros.find((item) => item.id === input.suministroId)
  const medidor = suministro ? meterForSupply(pkg, suministro) : undefined
  if (!suministro || !medidor) return { ok: false, reason: 'missing' }

  const consumo = readingConsumption(
    input.valor,
    suministro.lecturaAnterior,
    medidor.multiplicador,
  )
  const fueraDeRango = isOutOfRange(consumo, suministro.consumoPromedio)
  if (fueraDeRango && !input.confirmed) return { ok: false, reason: 'needs-confirmation' }

  const fotoUri = await resolvePhotoUri(input.fotoUri)
  // P-12: el teléfono inventa el id; el servidor lo respeta.
  const id = `lec-${Date.now()}`
  const body: Lectura = {
    id,
    rutaId: pkg.ruta.id,
    suministroId: suministro.id,
    lectorId: pkg.ruta.lectorId,
    valor: input.valor,
    consumo,
    fotoUri,
    coordenadas: input.coordenadas,
    fueraDeRango,
    confirmadaPorLector: fueraDeRango && input.confirmed,
    fechaHora: nowIso(),
    sincronizada: false,
  }

  const response = await httpClient.post<RespuestaUno<Lectura>>('/lecturas', body)
  const lectura = response.data.datos
  rememberPosted(pkg.ruta.id, 'lectura', lectura.id)

  return {
    ok: true,
    lectura,
    nextSuministroId: nextSupplyId(pkg.ruta, suministro.id),
  }
}

export async function saveIncident(input: {
  routeKey: string
  suministroId: string
  motivo: MotivoNovedad | null
  comentario: string
  fotoUri: string
}): Promise<SaveIncidentResult> {
  if (!input.motivo) return { ok: false, reason: 'no-reason' }
  if (input.fotoUri.length === 0) return { ok: false, reason: 'no-photo' }

  const pkg = await downloadRoute(input.routeKey)
  const suministro = pkg.suministros.find((item) => item.id === input.suministroId)
  if (!suministro) return { ok: false, reason: 'missing' }

  const fotoUri = await resolvePhotoUri(input.fotoUri)
  const trimmed = input.comentario.trim()
  const id = `nov-${Date.now()}`
  const body: Novedad = {
    id,
    rutaId: pkg.ruta.id,
    suministroId: suministro.id,
    lectorId: pkg.ruta.lectorId,
    motivo: input.motivo,
    comentario: trimmed.length > 0 ? trimmed : null,
    audioUri: null,
    fotoUri,
    fechaHora: nowIso(),
    sincronizada: false,
  }

  const response = await httpClient.post<RespuestaUno<Novedad>>('/novedades', body)
  const novedad = response.data.datos
  rememberPosted(pkg.ruta.id, 'novedad', novedad.id)

  return {
    ok: true,
    novedad,
    nextSuministroId: nextSupplyId(pkg.ruta, suministro.id),
  }
}

// P-08: se puede cerrar con pendientes. P-09: no se cierra si al servidor le falta algo.
export async function closeRoute(routeKey: string): Promise<CloseRouteResult> {
  try {
    const pkg = await downloadRoute(routeKey)
    const posted = postedIdsByRoute.get(pkg.ruta.id) ?? { lecturaIds: [], novedadIds: [] }
    const lecturaIds = uniqueIds([...pkg.lecturas.map((item) => item.id), ...posted.lecturaIds])
    const novedadIds = uniqueIds([...pkg.novedades.map((item) => item.id), ...posted.novedadIds])

    const response = await httpClient.post<RespuestaUno<Ruta>>(`/rutas/${pkg.ruta.id}/cierre`, {
      lecturaIds,
      novedadIds,
    })
    const route = response.data.datos
    postedIdsByRoute.delete(pkg.ruta.id)
    packagesByRouteId.delete(pkg.ruta.id)

    const pending = Math.max(0, route.suministroIds.length - pkg.lecturas.length - pkg.novedades.length)
    return { ok: true, route, pending }
  } catch (error) {
    if (isMissingResource(error)) return { ok: false, reason: 'missing' }

    if (isApiRequestError(error) && error.codigo === 'RUTA_YA_CERRADA') {
      return {
        ok: false,
        reason: 'closed',
        cerradaEn: packagesByRouteId.get(routeKey)?.ruta.cerradaEn ?? null,
        mensaje: error.message,
      }
    }

    if (isApiRequestError(error) && error.codigo === 'HAY_DATOS_SIN_SUBIR') {
      return {
        ok: false,
        reason: 'unsynced',
        readings: 0,
        incidents: 0,
        mensaje: error.message,
      }
    }

    throw error
  }
}
