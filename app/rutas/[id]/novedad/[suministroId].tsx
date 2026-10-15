import { useState } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'

import { Button } from '@/components/Button'
import { ReasonRow } from '@/components/ReasonRow'
import { TextField } from '@/components/TextField'
import { incidentReasons } from '@/constants/incident-reasons'
import { colors } from '@/theme/colors'

import type { MotivoNovedad } from '@/types/entities'

export default function IncidentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [motivo, setMotivo] = useState<MotivoNovedad | null>(null)
  const [comentario, setComentario] = useState('')

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Novedad</Text>
      {incidentReasons.map((reason) => (
        <ReasonRow
          key={reason.value}
          label={reason.label}
          selected={motivo === reason.value}
          onPress={() => setMotivo(reason.value)}
        />
      ))}
      <TextField label="Nota" value={comentario} onChangeText={setComentario} />
      <Button
        label="Guardar novedad y siguiente"
        onPress={() => router.push({ pathname: '/rutas/[id]', params: { id } })}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    padding: 16,
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 22,
  },
})
