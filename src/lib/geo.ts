import type { Coordenadas } from '@/types/entities'

const earthRadiusMeters = 6_371_000

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

export function distanceMeters(from: Coordenadas, to: Coordenadas): number {
  const lat1 = toRadians(from.latitud)
  const lat2 = toRadians(to.latitud)
  const dLat = toRadians(to.latitud - from.latitud)
  const dLng = toRadians(to.longitud - from.longitud)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusMeters * c
}

/** Initial bearing from `from` to `to`, in degrees clockwise from north. */
export function bearingDegrees(from: Coordenadas, to: Coordenadas): number {
  const lat1 = toRadians(from.latitud)
  const lat2 = toRadians(to.latitud)
  const dLng = toRadians(to.longitud - from.longitud)

  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

  return (toDegrees(Math.atan2(y, x)) + 360) % 360
}

/** Device heading from magnetometer x/y, in degrees clockwise from north. */
export function headingFromMagnetometer(x: number, y: number): number {
  return (toDegrees(Math.atan2(y, x)) + 360) % 360
}

/** Arrow rotation so 0° points toward the supply when the phone faces north. */
export function arrowRotationDegrees(bearing: number, heading: number): number {
  return ((bearing - heading) + 360) % 360
}

export type MapRegion = {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

export function regionForCoordinates(points: Coordenadas[]): MapRegion | null {
  if (points.length === 0) return null

  let minLat = points[0].latitud
  let maxLat = points[0].latitud
  let minLng = points[0].longitud
  let maxLng = points[0].longitud

  for (const point of points) {
    minLat = Math.min(minLat, point.latitud)
    maxLat = Math.max(maxLat, point.latitud)
    minLng = Math.min(minLng, point.longitud)
    maxLng = Math.max(maxLng, point.longitud)
  }

  const latitude = (minLat + maxLat) / 2
  const longitude = (minLng + maxLng) / 2
  const latitudeDelta = Math.max((maxLat - minLat) * 1.4, 0.008)
  const longitudeDelta = Math.max((maxLng - minLng) * 1.4, 0.008)

  return { latitude, longitude, latitudeDelta, longitudeDelta }
}
