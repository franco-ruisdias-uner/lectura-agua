import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { router, useGlobalSearchParams, useIsFocused } from 'expo-router'
import * as Location from 'expo-location'
import { Magnetometer } from 'expo-sensors'
import MapView, { Marker } from 'react-native-maps'
import Ionicons from '@react-native-vector-icons/ionicons'

import { Button } from '@/components/Button'
import { ErrorView } from '@/components/ErrorView'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { StatusBadge } from '@/components/StatusBadge'
import { useRouteSupplies } from '@/hooks/use-route-data'
import {
  arrowRotationDegrees,
  bearingDegrees,
  distanceMeters,
  headingFromMagnetometer,
  regionForCoordinates,
} from '@/lib/geo'
import { colors } from '@/theme/colors'

import type { SupplyStop } from '@/services/routes'
import type { Coordenadas } from '@/types/entities'
import type { StatusTone } from '@/components/StatusBadge'

const statusLabel: Record<SupplyStop['status'], string | undefined> = {
  pending: undefined,
  read: 'LEÍDO',
  incident: 'NOVEDAD',
}

const statusTone: Record<SupplyStop['status'], StatusTone | undefined> = {
  pending: undefined,
  read: 'read',
  incident: 'incident',
}

const markerColor: Record<SupplyStop['status'], string> = {
  pending: colors.accent,
  read: '#4caf7a',
  incident: '#d4a017',
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `A ${Math.round(meters)} m`
  return `A ${(meters / 1000).toFixed(1)} km`
}

export default function RouteMapScreen() {
  // El id está en el segmento padre: un tab no lo recibe por useLocalSearchParams.
  const { id } = useGlobalSearchParams<{ id: string }>()
  const routeKey = typeof id === 'string' ? id : ''
  const isFocused = useIsFocused()
  const { supplies, status, error } = useRouteSupplies(routeKey)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [readerPosition, setReaderPosition] = useState<Coordenadas | null>(null)
  const [heading, setHeading] = useState<number | null>(null)

  const stops = supplies?.stops ?? []
  const selected = stops.find((stop) => stop.suministro.id === selectedId) ?? null

  const initialRegion = useMemo(() => {
    if (!supplies?.stops.length) return null
    return regionForCoordinates(supplies.stops.map((stop) => stop.suministro.coordenadas))
  }, [supplies])

  // P-21: GPS sólo mientras el mapa está enfocado.
  useEffect(() => {
    if (!isFocused) {
      setReaderPosition(null)
      return
    }

    let subscription: Location.LocationSubscription | null = null
    let cancelled = false

    const start = async () => {
      const { status: permission } = await Location.requestForegroundPermissionsAsync()
      if (cancelled || permission !== 'granted') return

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 5,
        },
        (position) => {
          setReaderPosition({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
          })
        },
      )
    }

    void start()

    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [isFocused])

  // RF-25: magnetómetro sólo con el mapa enfocado y un suministro elegido.
  useEffect(() => {
    if (!isFocused || !selected) {
      setHeading(null)
      return
    }

    let subscription: { remove: () => void } | null = null
    let cancelled = false

    const start = async () => {
      const available = await Magnetometer.isAvailableAsync()
      if (cancelled || !available) return

      Magnetometer.setUpdateInterval(200)
      subscription = Magnetometer.addListener(({ x, y }) => {
        setHeading(headingFromMagnetometer(x, y))
      })
    }

    void start()

    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [isFocused, selected])

  const distance =
    readerPosition && selected
      ? distanceMeters(readerPosition, selected.suministro.coordenadas)
      : null

  const arrowDegrees =
    readerPosition && selected && heading != null
      ? arrowRotationDegrees(
          bearingDegrees(readerPosition, selected.suministro.coordenadas),
          heading,
        )
      : null

  const selectedLabel = selected ? statusLabel[selected.status] : undefined
  const selectedTone = selected ? statusTone[selected.status] : undefined

  return (
    <View style={styles.screen}>
      {initialRegion ? (
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={isFocused}
          showsMyLocationButton={isFocused}
          // RF-27: el pin azul es evidencia de la visita, no control del lector.
        >
          {stops.map((stop) => (
            <Marker
              key={stop.suministro.id}
              coordinate={{
                latitude: stop.suministro.coordenadas.latitud,
                longitude: stop.suministro.coordenadas.longitud,
              }}
              pinColor={markerColor[stop.status]}
              onPress={() => setSelectedId(stop.suministro.id)}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.emptyMap}>
          {status === 'ready' ? (
            <Text style={styles.message}>Esta ruta no tiene suministros</Text>
          ) : status === 'missing' ? (
            <ErrorView label="No encontramos esa ruta" />
          ) : status === 'error' ? (
            <ErrorView label={error ?? 'No se pudo cargar el mapa'} />
          ) : null}
        </View>
      )}

      {selected ? (
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetText}>
              <Text style={styles.address}>{selected.suministro.direccion}</Text>
              <Text style={styles.holder}>{selected.suministro.titular}</Text>
            </View>
            {selectedLabel && selectedTone ? (
              <StatusBadge label={selectedLabel} tone={selectedTone} />
            ) : null}
          </View>

          {distance != null ? <Text style={styles.distance}>{formatDistance(distance)}</Text> : null}

          {arrowDegrees != null ? (
            <View style={styles.arrowRow}>
              <View style={[styles.arrow, { transform: [{ rotate: `${arrowDegrees}deg` }] }]}>
                <Ionicons name="navigate" size={36} color={colors.accent} />
              </View>
              <Text style={styles.arrowHint}>Hacia el medidor</Text>
            </View>
          ) : null}

          <Button
            label="Abrir lectura"
            onPress={() =>
              router.push({
                pathname: '/rutas/[id]/lectura/[suministroId]',
                params: { id: routeKey, suministroId: selected.suministro.id },
              })
            }
          />
        </View>
      ) : null}

      <LoadingOverlay visible={status === 'loading'} label="Cargando mapa" />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  emptyMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  message: {
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  sheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetText: {
    flex: 1,
    gap: 4,
  },
  address: {
    color: colors.text,
    fontSize: 18,
  },
  holder: {
    color: colors.muted,
    fontSize: 15,
  },
  distance: {
    color: colors.text,
    fontSize: 16,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  arrow: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowHint: {
    color: colors.muted,
    fontSize: 15,
  },
})
