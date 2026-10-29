import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { router, useGlobalSearchParams } from 'expo-router'

import { Button } from '@/components/Button'
import { ErrorView } from '@/components/ErrorView'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { Stat } from '@/components/Stat'
import { useCloseRoute } from '@/hooks/use-close-route'
import { useRouteSummary } from '@/hooks/use-route-data'
import { colors } from '@/theme/colors'

function count(value: number, one: string, many: string): string {
  return `${value} ${value === 1 ? one : many}`
}

export default function RouteSummaryScreen() {
  const { id } = useGlobalSearchParams<{ id: string }>()
  const routeKey = typeof id === 'string' ? id : ''
  const { summary, status, error } = useRouteSummary(routeKey)
  const { run, saving, error: closeError, setError: setCloseError } = useCloseRoute()
  const [confirmingPending, setConfirmingPending] = useState(false)
  const [closeMessage, setCloseMessage] = useState<string | null>(null)

  const close = async () => {
    setCloseMessage(null)
    setCloseError(null)

    const result = await run(routeKey)
    if (!result) return

    if (result.ok) {
      router.replace({ pathname: '/rutas/[id]/cerrada', params: { id: routeKey } })
      return
    }

    setConfirmingPending(false)
    if (result.reason === 'unsynced') {
      // P-09: es un bloqueo, no un aviso. La ruta sigue abierta.
      setCloseMessage(result.mensaje)
    } else if (result.reason === 'closed') {
      setCloseMessage(result.mensaje)
    } else {
      setCloseMessage('No encontramos esa ruta')
    }
  }

  const onClosePress = () => {
    // P-08: los pendientes no impiden el cierre, pero el lector los ve antes.
    if (summary && summary.pending > 0 && !confirmingPending) {
      setConfirmingPending(true)
      return
    }
    void close()
  }

  const notice = closeMessage ?? closeError

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
      {status === 'missing' ? (
        <ErrorView label="No encontramos esa ruta" style={styles.errorFill} />
      ) : null}
      {status === 'error' ? (
        <ErrorView label={error ?? 'No se pudo cargar el resumen'} style={styles.errorFill} />
      ) : null}
      {confirmingPending && summary ? (
        <Text style={styles.notice}>
          Quedan {count(summary.pending, 'suministro', 'suministros')} sin leer ni novedad. Se
          facturan por promedio.
        </Text>
      ) : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {summary ? (
        <Button
          label={confirmingPending ? 'Cerrar igual' : notice ? 'Probar de nuevo' : 'Cerrar ruta'}
          onPress={onClosePress}
        />
      ) : null}
      {confirmingPending ? (
        <Button label="Seguir leyendo" variant="secondary" onPress={() => setConfirmingPending(false)} />
      ) : null}
      <LoadingOverlay
        visible={status === 'loading' || saving}
        label={saving ? 'Cerrando la ruta' : 'Cargando resumen'}
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
  errorFill: {
    flex: 1,
  },
  notice: {
    color: colors.text,
    fontSize: 18,
  },
})
