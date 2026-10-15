import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { StatusBadge } from '@/components/StatusBadge'
import { colors } from '@/theme/colors'

import type { StatusTone } from '@/components/StatusBadge'

export type SupplyRowProps = {
  ordinal: string
  address: string
  holder: string
  status?: string
  tone?: StatusTone
  onPress?: () => void
}

export function SupplyRow({ ordinal, address, holder, status, tone, onPress }: SupplyRowProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={onPress}
      style={styles.row}
    >
      <Text style={styles.ordinal}>{ordinal}</Text>
      <View style={styles.body}>
        <Text style={styles.address}>{address}</Text>
        {holder ? <Text style={styles.holder}>{holder}</Text> : null}
      </View>
      {status ? (
        tone ? (
          <StatusBadge label={status} tone={tone} />
        ) : (
          <Text style={styles.status}>{status}</Text>
        )
      ) : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ordinal: {
    color: colors.muted,
    fontSize: 16,
    minWidth: 32,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  address: {
    color: colors.text,
    fontSize: 18,
  },
  holder: {
    color: colors.muted,
    fontSize: 14,
  },
  status: {
    color: colors.accentMuted,
    fontSize: 14,
  },
})
