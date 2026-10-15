import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { router, useGlobalSearchParams } from 'expo-router'

import { Button } from '@/components/Button'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { Stat } from '@/components/Stat'
import { useRouteSummary } from '@/hooks/use-route-data'
import { closeRoute } from '@/services/routes'
import { colors } from '@/theme/colors'

function count(value: number, one: string, many: string): string {
  return `${value} ${value === 1 ? one : many}`
}

export default function RouteSummaryScreen() {
  const { id } = useGlobalSearchParams<{ id: string }>()
  const routeKey = typeof id === 'string' ? id : ''
  const { summary, status } = useRouteSummary(routeKey)
  const [confirmingPending, setConfirmingPending] = useState(false)
  const [closing, setClosing] = useState(false)
  const [closeMessage, setCloseMessage] = useState<string | null>(null)

  const close = async () => {
    setClosing(true)
    setCloseMessage(null)

    try {
      const result = await closeRoute(routeKey)
      if (result.ok) {
        router.replace({ pathname: '/rutas/[id]/cerrada', params: { id: routeKey } })
        return
      }

      setConfirmingPending(false)
      if (result.reason === 'unsynced') {
        // P-09: a block, not a warning. The route stays open until everything is sent.
        const missing = [
          result.readings > 0 ? count(result.readings, 'lectura', 'lecturas') : null,
          result.incidents > 0 ? count(result.incidents, 'novedad', 'novedades') : null,
        ]
          .filter(Boolean)
          .join(' y ')
        setCloseMessage(`Faltan subir ${missing}. Esperá a tener señal y probá de nuevo.`)
      } else if (result.reason === 'closed') {
        setCloseMessage('Esta ruta ya está cerrada.')
      } else {
        setCloseMessage('No encontramos esa ruta')
      }
    } catch {
      setCloseMessage('No se pudo cerrar la ruta. Probá de nuevo.')
    } finally {
      setClosing(false)
    }
  }

  const onClosePress = () => {
    // P-08: pending supplies do not stop the close, but the reader sees how many first.
    if (summary && summary.pending > 0 && !confirmingPending) {
      setConfirmingPending(true)
      return
    }
    void close()
  }

  return (
    <View style={styles.screen}>
      {summary ? (
        <>
          <Stat label="Leídos" value={String(summary.read)} />
          <Stat label="Con novedad" value={String(summary.incidents)} />
          <Stat label="Pendientes" value={String(summary.pending)} />
          <Stat label="Sin subir" value={String(summary.unsynced)} />
        </>
      ) : null}
      {status === 'missing' ? <Text style={styles.message}>No encontramos esa ruta</Text> : null}
      {status === 'error' ? (
        <Text style={styles.message}>No se pudo cargar el resumen</Text>
      ) : null}
      {confirmingPending && summary ? (
        <Text style={styles.notice}>
          Quedan {count(summary.pending, 'suministro', 'suministros')} sin leer ni novedad. Se
          facturan por promedio.
        </Text>
      ) : null}
      {closeMessage ? <Text style={styles.notice}>{closeMessage}</Text> : null}
      {summary ? (
        <Button
          label={confirmingPending ? 'Cerrar igual' : closeMessage ? 'Probar de nuevo' : 'Cerrar ruta'}
          onPress={onClosePress}
        />
      ) : null}
      {confirmingPending ? (
        <Button label="Seguir leyendo" variant="secondary" onPress={() => setConfirmingPending(false)} />
      ) : null}
      <LoadingOverlay
        visible={status === 'loading' || closing}
        label={closing ? 'Cerrando la ruta' : 'Cargando resumen'}
      />
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
  message: {
    color: colors.muted,
    fontSize: 16,
  },
  notice: {
    color: colors.text,
    fontSize: 18,
  },
})
