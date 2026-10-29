import { StyleSheet, Text, View } from 'react-native'
import Ionicons from '@react-native-vector-icons/ionicons'

import { colors } from '@/theme/colors'

import type { StyleProp, ViewStyle } from 'react-native'

export type ErrorViewProps = {
  label: string
  style?: StyleProp<ViewStyle>
}

export function ErrorView({ label, style }: ErrorViewProps) {
  return (
    <View accessibilityRole="alert" accessibilityLabel={label} style={[styles.box, style]}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.muted} />
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  label: {
    color: colors.muted,
    fontSize: 18,
    textAlign: 'center',
  },
})
