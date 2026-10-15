import Ionicons from '@react-native-vector-icons/ionicons'
import { router, useLocalSearchParams } from 'expo-router'
import { Stack } from 'expo-router/stack'

import { colors } from '@/theme/colors'

export default function OpenRouteLayout() {
  const { id } = useLocalSearchParams<{ id: string }>()
  
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {/* This stack starts here, so the system back button has nothing to pop. */}
      <Stack.Screen
        name="(modo)"
        options={{
          title: `Ruta ${id}`,
          headerLeft: () => (
            <Ionicons
              name="chevron-back"
              size={28}
              color={colors.text}
              accessibilityLabel="Volver a las rutas"
              onPress={() => {
                if (router.canGoBack()) {
                  router.back()
                } else {
                  router.replace('/rutas')
                }
              }}
              style={{ marginLeft: 8 }}
            />
          ),
        }}
      />
      <Stack.Screen
        name="lectura/[suministroId]"
        options={{
          title: 'Lectura',
          headerRight: () => (
            <Ionicons
              name="information-circle-outline"
              size={28}
              color={colors.text}
              accessibilityLabel="Cómo se lee este modelo"
              onPress={() =>
                router.push({
                  pathname: '/rutas/[id]/video',
                  params: { id: typeof id === 'string' ? id : '' },
                })
              }
              style={{ marginRight: 8 }}
            />
          ),
        }}
      />
      <Stack.Screen name="novedad/[suministroId]" options={{ title: 'Novedad' }} />
      <Stack.Screen
        name="aviso"
        options={{ presentation: 'modal', title: 'Revisá este número' }}
      />
      <Stack.Screen
        name="video"
        options={{ presentation: 'modal', title: 'Cómo se lee' }}
      />
      <Stack.Screen name="cerrada" options={{ title: 'Ruta cerrada' }} />
    </Stack>
  )
}
