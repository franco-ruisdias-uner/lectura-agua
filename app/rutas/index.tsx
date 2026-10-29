import { FlatList, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'

import { ErrorView } from '@/components/ErrorView'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { RouteCard } from '@/components/RouteCard'
import { useRouteOverviews } from '@/hooks/use-route-data'
import { colors } from '@/theme/colors'

import type { EstadoRuta } from '@/types/entities'
import type { RouteOverview } from '@/services/routes'

const routeStatusLabel: Record<EstadoRuta, string> = {
  asignada: 'Asignada',
  en_curso: 'En curso',
  cerrada: 'Cerrada',
}

function routeTitle(overview: RouteOverview): string {
  return `Ruta ${overview.route.numero}`
}

function routeDetail(overview: RouteOverview): string {
  return `${overview.route.nombre} · ${overview.supplyCount} suministros · ${overview.readCount} leídos`
}

export default function TodaysRoutesScreen() {
  const { overviews, status, error } = useRouteOverviews()

  return (
    <View style={styles.screen}>
      <FlatList
        data={overviews}
        keyExtractor={(item) => item.route.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          status === 'ready' ? (
            <Text style={styles.message}>No hay rutas para hoy</Text>
          ) : status === 'error' ? (
            <ErrorView
              label={error ?? 'No se pudieron cargar las rutas'}
              style={styles.errorFill}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <RouteCard
            title={routeTitle(item)}
            detail={routeDetail(item)}
            status={routeStatusLabel[item.route.estado]}
            onPress={() => router.push(`/rutas/${item.route.id}`)}
          />
        )}
      />
      <LoadingOverlay visible={status === 'loading'} label="Cargando rutas" />
    </View>
  )
}

function Separator() {
  return <View style={styles.separator} />
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
  separator: {
    height: 12,
  },
  message: {
    color: colors.muted,
    fontSize: 16,
  },
  errorFill: {
    flex: 1,
  },
})
