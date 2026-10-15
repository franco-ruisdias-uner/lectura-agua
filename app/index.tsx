import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import Ionicons from '@react-native-vector-icons/ionicons'
import { z } from 'zod'

import { Button } from '@/components/Button'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { TextField } from '@/components/TextField'
import { ThemedView } from '@/components/ThemedView'
import { demoSignIn, signIn } from '@/services/login'
import { colors } from '@/theme/colors'

// P-13: the field is legajo, as in the prototype. The username contract stays open.
const loginSchema = z.object({
  legajo: z.string().min(1, 'Ingresá el legajo'),
  password: z.string().min(1, 'Ingresá la contraseña'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function SignInScreen() {
  const [authError, setAuthError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const demo = demoSignIn()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { legajo: '', password: '' },
  })

  const onSignIn = async (values: LoginForm) => {
    setAuthError(null)
    setLoading(true)

    try {
      await signIn(values.legajo, values.password)
      router.replace('/rutas')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo ingresar'
      setAuthError(message)
    } finally {
      setLoading(false)
    }
  }

  const onFingerprint = () => {
    // P-14: fingerprint sign-in is left for class. This only reports that it is missing.
    setAuthError('El ingreso con huella todavía no está disponible')
  }

  return (
    <ThemedView style={styles.screen}>
      <Controller
        control={control}
        name="legajo"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField label="Legajo" value={value} onChangeText={onChange} onBlur={onBlur} />
        )}
      />
      {errors.legajo ? <Text style={styles.error}>{errors.legajo.message}</Text> : null}

      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Contraseña"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secure
          />
        )}
      />
      {errors.password ? <Text style={styles.error}>{errors.password.message}</Text> : null}
      {demo ? (
        <Text style={styles.hint}>
          Probá con el legajo {demo.legajo} y la contraseña {demo.password}
        </Text>
      ) : null}

      {authError ? <Text style={styles.error}>{authError}</Text> : null}

      <Button label="Ingresar" onPress={handleSubmit(onSignIn)} />
      <LoadingOverlay visible={loading} label="Ingresando" />

      {/* P-14: does not read a fingerprint. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Entrar con huella"
        onPress={onFingerprint}
        style={styles.biometric}
      >
        <View style={styles.biometricIcon}>
          <Ionicons name="finger-print-outline" size={24} color={colors.accent} />
        </View>
        <Text style={styles.biometricTitle}>Entrar con huella</Text>
      </Pressable>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  error: {
    color: colors.accentMuted,
    fontSize: 14,
  },
  hint: {
    color: colors.muted,
    fontSize: 16,
  },
  biometric: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  biometricIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricTitle: {
    color: colors.text,
    fontSize: 16,
  },
})
