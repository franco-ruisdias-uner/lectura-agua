import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native'

import { colors } from '@/theme/colors'

export type LoadingOverlayProps = {
  visible: boolean
  label?: string
}

export function LoadingOverlay({ visible, label }: LoadingOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View accessibilityRole="progressbar" accessibilityLabel={label} style={styles.backdrop}>
        <ActivityIndicator size="large" color={colors.accent} />
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: 'rgba(22, 24, 38, 0.72)',
  },
  label: {
    color: colors.text,
    fontSize: 18,
  },
})
