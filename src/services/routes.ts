import { lecturas, medidores, novedades, rutas, suministros } from '@/mocks'

import type { Lectura, Medidor, MotivoNovedad, Novedad, Ruta, Suministro } from '@/types/entities'

const mockDelayMs = 400

const routeStore: Ruta[] = rutas.map((route) => ({
  ...route,
  suministroIds: [...route.suministroIds],
}))

const readingStore: Lectura[] = lecturas.map((reading) => ({ ...reading }))
const incidentStore = novedades.map((incident) => ({ ...incident }))

const suppliesById = new Map(suministros.map((supply) => [supply.id, supply]))
const metersById = new Map(medidores.map((meter) => [meter.id, meter]))

function wait(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, mockDelayMs)
  })
}

function findRoute(routeKey: string): Ruta | undefined {
  return routeStore.find((route) => route.id === routeKey || route.numero === routeKey)
}

function unsyncedCounts(routeId: string): { readings: number; incidents: number } {
  const readings = readingStore.filter(
    (reading) => reading.rutaId === routeId && !reading.sincronizada,
  ).length
  const incidents = incidentStore.filter(
    (incident) => incident.rutaId === routeId && !incident.sincronizada,
  ).length
  return { readings, incidents }
}

function unsyncedCount(routeId: string): number {
  const { readings, incidents } = unsyncedCounts(routeId)
  return readings + incidents
}

function latest<T extends { fechaHora: string }>(items: T[]): T | undefined {
  return items.reduce<T | undefined>(
    (best, item) => (!best || Date.parse(item.fechaHora) > Date.parse(best.fechaHora) ? item : best),
    undefined,
  )
}

export type CurrentResult =
  | { kind: 'reading'; lectura: Lectura }
  | { kind: 'incident'; novedad: Novedad }

// P-07: one current result per supply and route. A reading always beats an incident.
// Between two of the same kind, the latest fechaHora wins. Nothing is deleted.
export function currentResult(routeId: string, suministroId: string): CurrentResult | null {
  const reading = latest(
    readingStore.filter((item) => item.rutaId === routeId && item.suministroId === suministroId),
  )
  if (reading) return { kind: 'reading', lectura: reading }

  const incident = latest(
    incidentStore.filter((item) => item.rutaId === routeId && item.suministroId === suministroId),
  )
  return incident ? { kind: 'incident', novedad: incident } : null
}

function resultCounts(route: Ruta): { read: number; incidents: number } {
  let read = 0
  let incidents = 0
  for (const suministroId of route.suministroIds) {
    const result = currentResult(route.id, suministroId)
    if (result?.kind === 'reading') read += 1
    else if (result?.kind === 'incident') incidents += 1
  }
  return { read, incidents }
}

function nowIso(): string {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absolute = Math.abs(offsetMinutes)

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`
}

export type RouteOverview = {
  route: Ruta
  supplyCount: number
  readCount: number
}

export type SupplyStopStatus = 'pending' | 'read' | 'incident'

export type SupplyStop = {
  suministro: Suministro
  // P-17: this is the walk position, not a field on Suministro.
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

export type CloseRouteResult =
  | { ok: true; route: Ruta; pending: number }
  | { ok: false; reason: 'missing' }
  | { ok: false; reason: 'closed'; cerradaEn: string | null }
  | { ok: false; reason: 'unsynced'; readings: number; incidents: number }

// P-03: a new connection has no previous reading. A new meter starts at zero.
export function readingConsumption(
  valor: number,
  anterior: number | null,
  multiplicador: number,
): number {
  return (valor - (anterior ?? 0)) * multiplicador
}

// Out of the ordinary when consumption differs by more than 100 m³, up or down.
export const unusualDifferenceM3 = 100

export function isOutOfRange(consumo: number): boolean {
  return Math.abs(consumo) > unusualDifferenceM3
}

export async function listRouteOverviews(): Promise<RouteOverview[]> {
  await wait()

  return routeStore.map((route) => ({
    route,
    supplyCount: route.suministroIds.length,
    readCount: resultCounts(route).read,
  }))
}

export async function listRouteSupplies(routeKey: string): Promise<RouteSupplies | null> {
  await wait()
  const route = findRoute(routeKey)
  if (!route) return null

  const stops = route.suministroIds.map((suministroId, index) => {
    const suministro = suppliesById.get(suministroId)
    if (!suministro) {
      throw new Error(`Missing supply ${suministroId}`)
    }

    // P-07: a reading beats an incident; between two of the same kind, the latest wins.
    const result = currentResult(route.id, suministroId)
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

  return { stops, unsynced: unsyncedCount(route.id) }
}

export async function getRouteDaySummary(routeKey: string): Promise<RouteDaySummary | null> {
  await wait()
  const route = findRoute(routeKey)
  if (!route) return null

  const { read, incidents } = resultCounts(route)

  return {
    read,
    incidents,
    pending: route.suministroIds.length - read - incidents,
    unsynced: unsyncedCount(route.id),
  }
}

export async function getReadingContext(
  routeKey: string,
  suministroId: string,
): Promise<ReadingContext | null> {
  await wait()
  const route = findRoute(routeKey)
  const suministro = suppliesById.get(suministroId)
  if (!route || !suministro || !route.suministroIds.includes(suministroId)) return null

  const medidor = metersById.get(suministro.medidorId)
  if (!medidor) return null

  const position = route.suministroIds.indexOf(suministroId)
  const result = currentResult(route.id, suministroId)
  const lectura = result?.kind === 'reading' ? result.lectura : null

  return {
    route,
    suministro,
    medidor,
    lectura,
    nextSuministroId: route.suministroIds[position + 1] ?? null,
  }
}

export async function saveReading(input: {
  routeKey: string
  suministroId: string
  valor: number
  fotoUri: string
  // P-01: true when the reader saw the warning and confirmed the number.
  confirmed: boolean
}): Promise<SaveReadingResult> {
  await wait()

  if (input.fotoUri.length === 0) return { ok: false, reason: 'no-photo' }

  const route = findRoute(input.routeKey)
  const suministro = suppliesById.get(input.suministroId)
  const medidor = suministro ? metersById.get(suministro.medidorId) : undefined
  if (!route || !suministro || !medidor) return { ok: false, reason: 'missing' }

  const consumo = readingConsumption(
    input.valor,
    suministro.lecturaAnterior,
    medidor.multiplicador,
  )
  // Out of range never blocks, but it needs the reader's confirmation first.
  const fueraDeRango = isOutOfRange(consumo)
  if (fueraDeRango && !input.confirmed) return { ok: false, reason: 'needs-confirmation' }

  const lectura: Lectura = {
    // P-12: the phone invents this id. The API id is not decided.
    id: `lec-${Date.now()}`,
    rutaId: route.id,
    suministroId: suministro.id,
    lectorId: route.lectorId,
    valor: input.valor,
    consumo,
    fotoUri: input.fotoUri,
    // P-21: a coordinate saved with the reading is not decided here.
    coordenadas: null,
    fueraDeRango,
    confirmadaPorLector: fueraDeRango && input.confirmed,
    fechaHora: nowIso(),
    sincronizada: false,
  }

  // P-07: correcting a reading means entering it again. The earlier one is kept, not overwritten.
  readingStore.push(lectura)

  const position = route.suministroIds.indexOf(suministro.id)
  return {
    ok: true,
    lectura,
    nextSuministroId: route.suministroIds[position + 1] ?? null,
  }
}

// P-08: a route can close with supplies still pending; they are billed by average.
// P-09: it cannot close while anything entered on the phone is unsent. That is a block, not a warning.
export async function closeRoute(routeKey: string): Promise<CloseRouteResult> {
  await wait()
  const route = findRoute(routeKey)
  if (!route) return { ok: false, reason: 'missing' }
  if (route.estado === 'cerrada') return { ok: false, reason: 'closed', cerradaEn: route.cerradaEn }

  const unsynced = unsyncedCounts(route.id)
  if (unsynced.readings + unsynced.incidents > 0) {
    return { ok: false, reason: 'unsynced', ...unsynced }
  }

  const { read, incidents } = resultCounts(route)
  route.estado = 'cerrada'
  route.cerradaEn = nowIso()
  return { ok: true, route, pending: route.suministroIds.length - read - incidents }
}
