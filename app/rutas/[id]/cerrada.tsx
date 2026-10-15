import { StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'

import { Button } from '@/components/Button'
import { colors } from '@/theme/colors'

export default function RouteClosedScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Ruta cerrada</Text>
      <Button label="Volver a empezar" onPress={() => router.replace('/')} />
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
