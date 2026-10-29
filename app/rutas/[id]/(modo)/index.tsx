import { FlatList, StyleSheet, Text, View } from 'react-native'
import { router, useGlobalSearchParams } from 'expo-router'

import { ErrorView } from '@/components/ErrorView'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { SupplyRow } from '@/components/SupplyRow'
import { SyncStrip } from '@/components/SyncStrip'
import { incidentReasonLabel } from '@/constants/incident-reasons'
import { useRouteSupplies } from '@/hooks/use-route-data'
import { colors } from '@/theme/colors'

import type { SupplyStop } from '@/services/routes'
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

function holderFor(stop: SupplyStop): string {
  if (!stop.reason) return stop.suministro.titular
  return `${stop.suministro.titular} · ${incidentReasonLabel(stop.reason)}`
}

export default function RouteListScreen() {
  const { id } = useGlobalSearchParams<{ id: string }>()
  const routeKey = typeof id === 'string' ? id : ''
  const { supplies, status, error } = useRouteSupplies(routeKey)

  return (
    <View style={styles.screen}>
      <FlatList
        data={supplies?.stops ?? []}
        keyExtractor={(item) => item.suministro.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          status === 'ready' ? (
            <View style={styles.header}>
              <SyncStrip label={`Sin subir: ${supplies?.unsynced ?? 0}`} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          status === 'ready' ? (
            <Text style={styles.message}>Esta ruta no tiene suministros</Text>
          ) : status === 'missing' ? (
            <ErrorView label="No encontramos esa ruta" style={styles.errorFill} />
          ) : status === 'error' ? (
            <ErrorView label={error ?? 'No se pudo cargar la ruta'} style={styles.errorFill} />
          ) : null
        }
        renderItem={({ item }) => (
          <SupplyRow
            ordinal={String(item.position)}
            address={item.suministro.direccion}
            holder={holderFor(item)}
            status={statusLabel[item.status]}
            tone={statusTone[item.status]}
            onPress={() =>
              router.push({
                pathname: '/rutas/[id]/lectura/[suministroId]',
                params: { id: routeKey, suministroId: item.suministro.id },
              })
            }
          />
        )}
      />
      <LoadingOverlay visible={status === 'loading'} label="Cargando suministros" />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 8,
  },
  message: {
    color: colors.muted,
    fontSize: 16,
  },
  errorFill: {
    flex: 1,
  },
})
