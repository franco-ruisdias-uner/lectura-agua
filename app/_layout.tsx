import { StatusBar } from 'expo-status-bar'
import { Stack } from 'expo-router/stack'

import { AuthProvider } from '@/providers/AuthProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { colors } from '@/theme/colors'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitleStyle: { color: colors.text },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Ingresar' }} />

          <Stack.Screen name="rutas" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  )
}
