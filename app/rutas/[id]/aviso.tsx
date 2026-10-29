import { StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'

import { Button } from '@/components/Button'
import { ErrorView } from '@/components/ErrorView'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { useReading } from '@/hooks/use-route-data'
import { useSaveReading } from '@/hooks/use-save-reading'
import { readingConsumption } from '@/services/routes'
import { colors } from '@/theme/colors'

import type { Coordenadas } from '@/types/entities'

function formatMeters(value: number): string {
  return new Intl.NumberFormat('es-AR').format(value)
}

function parseCoordinates(latitud: string | undefined, longitud: string | undefined): Coordenadas | null {
  if (typeof latitud !== 'string' || typeof longitud !== 'string') return null
  const lat = Number(latitud)
  const lng = Number(longitud)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { latitud: lat, longitud: lng }
}

// P-01, P-04: aviso cuando el número está fuera de rango. Nunca bloquea: corregir o confirmar.
export default function ConsumptionWarningScreen() {
  const { id, suministroId, valor, fotoUri, latitud, longitud } = useLocalSearchParams<{
    id: string
    suministroId: string
    valor: string
    fotoUri: string
    latitud?: string
    longitud?: string
  }>()
  const routeKey = typeof id === 'string' ? id : ''
  const supplyId = typeof suministroId === 'string' ? suministroId : ''
  const value = Number(valor)
  const photo = typeof fotoUri === 'string' ? fotoUri : ''
  // P-21: reusa el fix de antes de abrir esta pantalla. No pide GPS de nuevo.
  const coordenadas = parseCoordinates(
    typeof latitud === 'string' ? latitud : undefined,
    typeof longitud === 'string' ? longitud : undefined,
  )

  const { context, status, error: loadError } = useReading(routeKey, supplyId)
  const { run, saving, error: saveError, setError: setSaveError } = useSaveReading()

  const consumo = context
    ? readingConsumption(value, context.suministro.lecturaAnterior, context.medidor.multiplicador)
    : null
  const promedio = context?.suministro.consumoPromedio ?? null

  const confirm = async () => {
    if (saving) return
    setSaveError(null)

    const result = await run({
      routeKey,
      suministroId: supplyId,
      valor: value,
      fotoUri: photo,
      confirmed: true,
      coordenadas,
    })

    if (!result) return

    if (!result.ok) {
      setSaveError('No se pudo guardar la lectura')
      return
    }

    if (result.nextSuministroId) {
      router.replace({
        pathname: '/rutas/[id]/lectura/[suministroId]',
        params: { id: routeKey, suministroId: result.nextSuministroId },
      })
    } else {
      router.replace({ pathname: '/rutas/[id]', params: { id: routeKey } })
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Revisá este número</Text>
      {consumo !== null ? (
        <>
          <Text style={styles.body}>Cargaste {valor}.</Text>
          {consumo < 0 ? (
            <Text style={styles.body}>
              Eso da un consumo negativo: {formatMeters(consumo)} m³. ¿Cambiaron el medidor?
            </Text>
          ) : (
            <Text style={styles.body}>Eso da un consumo de {formatMeters(consumo)} m³.</Text>
          )}
          {promedio === null ? (
            <Text style={styles.body}>Esta cuenta no tiene promedio: es una conexión nueva.</Text>
          ) : (
            <Text style={styles.body}>
              Esta cuenta consume {formatMeters(promedio)} m³ por bimestre.
            </Text>
          )}
          <Text style={styles.body}>Mirá bien el medidor. Si el número es correcto, confirmalo.</Text>
        </>
      ) : null}
      {status === 'missing' ? <ErrorView label="No encontramos ese suministro" /> : null}
      {status === 'error' ? (
        <ErrorView label={loadError ?? 'No se pudo cargar la lectura'} />
      ) : null}
      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
      <Button label="Corregir" variant="secondary" onPress={() => router.back()} />
      <Button label="Confirmar" onPress={() => void confirm()} />
      <LoadingOverlay visible={status === 'loading' || saving} label={saving ? 'Guardando' : 'Cargando'} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    gap: 16,
  },
  title: {
    color: colors.text,
    fontSize: 22,
  },
  body: {
    color: colors.text,
    fontSize: 18,
  },
  error: {
    color: colors.accentMuted,
    fontSize: 16,
  },
})
