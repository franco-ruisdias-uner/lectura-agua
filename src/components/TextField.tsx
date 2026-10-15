import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import Ionicons from '@react-native-vector-icons/ionicons'

import { colors } from '@/theme/colors'

export type TextFieldProps = {
  label: string
  value: string
  onChangeText: (value: string) => void
  onBlur?: () => void
  secure?: boolean
}

export function TextField({ label, value, onChangeText, onBlur, secure = false }: TextFieldProps) {
  const [hidden, setHidden] = useState(true)

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          secureTextEntry={secure && hidden}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            onPress={() => setHidden((current) => !current)}
            hitSlop={8}
            style={styles.eye}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color={colors.muted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 16,
  },
  inputRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: 18,
  },
  eye: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
