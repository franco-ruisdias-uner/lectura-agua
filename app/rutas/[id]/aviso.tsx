import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'

import { Button } from '@/components/Button'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { useReading } from '@/hooks/use-route-data'
import { readingConsumption, saveReading } from '@/services/routes'
import { colors } from '@/theme/colors'

function formatMeters(value: number): string {
  return new Intl.NumberFormat('es-AR').format(value)
}

// P-01, P-04: shown when the number is out of range. It never blocks: the reader corrects or confirms.
export default function ConsumptionWarningScreen() {
  const { id, suministroId, valor, fotoUri } = useLocalSearchParams<{
    id: string
    suministroId: string
    valor: string
    fotoUri: string
  }>()
  const routeKey = typeof id === 'string' ? id : ''
  const supplyId = typeof suministroId === 'string' ? suministroId : ''
  const value = Number(valor)
  const photo = typeof fotoUri === 'string' ? fotoUri : ''

  const { context, status } = useReading(routeKey, supplyId)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const consumo = context
    ? readingConsumption(value, context.suministro.lecturaAnterior, context.medidor.multiplicador)
    : null
  const promedio = context?.suministro.consumoPromedio ?? null

  const confirm = async () => {
    if (saving) return
    setSaving(true)
    setSaveError(null)

    try {
      const result = await saveReading({
        routeKey,
        suministroId: supplyId,
        valor: value,
        fotoUri: photo,
        confirmed: true,
      })

      if (!result.ok) {
        setSaveError('No se pudo guardar la lectura')
        return
      }

      // Replace the warning itself. Dismissing it and then navigating drops the second step on iOS.
      if (result.nextSuministroId) {
        router.replace({
          pathname: '/rutas/[id]/lectura/[suministroId]',
          params: { id: routeKey, suministroId: result.nextSuministroId },
        })
      } else {
        router.replace({ pathname: '/rutas/[id]', params: { id: routeKey } })
      }
    } catch {
      setSaveError('No se pudo guardar la lectura')
    } finally {
      setSaving(false)
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
      {status === 'missing' ? <Text style={styles.body}>No encontramos ese suministro</Text> : null}
      {status === 'error' ? <Text style={styles.body}>No se pudo cargar la lectura</Text> : null}
      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
      <Button label="Corregir" variant="secondary" onPress={() => router.back()} />
      <Button label="Confirmar" onPress={() => void confirm()} />
      <LoadingOverlay visible={status === 'loading'} label="Cargando" />
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
