import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { colors } from '@/theme/colors'

export type RouteCardProps = {
  title: string
  detail: string
  status: string
  onPress: () => void
}

export function RouteCard({ title, detail, status, onPress }: RouteCardProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.heading}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.status}>{status}</Text>
      </View>
      <Text style={styles.detail}>{detail}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
  },
  status: {
    color: colors.accentMuted,
    fontSize: 14,
  },
  detail: {
    color: colors.muted,
    fontSize: 16,
  },
})
