import { StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'

import { Button } from '@/components/Button'
import { colors } from '@/theme/colors'

export default function MeterVideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Cómo se lee</Text>
      <Button
        label="Volver a la lectura"
        onPress={() =>
          router.push({
            pathname: '/rutas/[id]/lectura/[suministroId]',
            params: { id, suministroId: '89' },
          })
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    gap: 16,
  },
  title: {
    color: colors.text,
    fontSize: 22,
  },
})
