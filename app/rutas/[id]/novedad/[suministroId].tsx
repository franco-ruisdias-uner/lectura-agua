import { useState } from 'react'
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@react-native-vector-icons/ionicons'

import { Button } from '@/components/Button'
import { ErrorView } from '@/components/ErrorView'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { ReasonRow } from '@/components/ReasonRow'
import { TextField } from '@/components/TextField'
import { incidentReasons } from '@/constants/incident-reasons'
import { useReading } from '@/hooks/use-route-data'
import { useSaveIncident } from '@/hooks/use-save-incident'
import { pickPhoto } from '@/lib/pick-photo'
import { readingPhotoSource } from '@/lib/reading-photo'
import { colors } from '@/theme/colors'

import type { MotivoNovedad } from '@/types/entities'

export default function IncidentScreen() {
  const { id, suministroId } = useLocalSearchParams<{ id: string; suministroId: string }>()
  const routeKey = typeof id === 'string' ? id : ''
  const supplyId = typeof suministroId === 'string' ? suministroId : ''
  const insets = useSafeAreaInsets()
  const { context, status, error: loadError } = useReading(routeKey, supplyId)
  const { run, saving, error: saveError, setError: setSaveError } = useSaveIncident()
  const [motivo, setMotivo] = useState<MotivoNovedad | null>(null)
  const [comentario, setComentario] = useState('')
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false)

  const choosePhoto = async (source: 'camera' | 'library') => {
    try {
      const uri = await pickPhoto(source)
      if (uri) {
        setPhotoUri(uri)
        setSaveError(null)
      }
    } catch {
      Alert.alert('No se pudo abrir', 'Volvé a intentar en un momento.')
    } finally {
      setPhotoSheetOpen(false)
    }
  }

  const onSave = async () => {
    if (!motivo) {
      setSaveError('Elegí un motivo')
      return
    }
    if (!photoUri) {
      setSaveError('Sacá una foto para guardar la novedad')
      return
    }

    const result = await run({
      routeKey,
      suministroId: supplyId,
      motivo,
      comentario,
      fotoUri: photoUri,
    })

    if (!result) return

    if (!result.ok) {
      if (result.reason === 'no-photo') {
        setSaveError('Sacá una foto para guardar la novedad')
      } else if (result.reason === 'no-reason') {
        setSaveError('Elegí un motivo')
      } else {
        setSaveError('No se pudo guardar la novedad')
      }
      return
    }

    if (result.nextSuministroId) {
      router.replace({
        pathname: '/rutas/[id]/lectura/[suministroId]',
        params: { id: routeKey, suministroId: result.nextSuministroId },
      })
      return
    }

    router.replace({ pathname: '/rutas/[id]', params: { id: routeKey } })
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Novedad</Text>
      {context ? (
        <Text style={styles.line}>
          {context.suministro.direccion} - {context.suministro.titular}
        </Text>
      ) : null}
      {incidentReasons.map((reason) => (
        <ReasonRow
          key={reason.value}
          label={reason.label}
          selected={motivo === reason.value}
          onPress={() => {
            setMotivo(reason.value)
            setSaveError(null)
          }}
        />
      ))}
      <TextField label="Nota" value={comentario} onChangeText={setComentario} />
      {photoUri ? (
        <View style={styles.previewFrame}>
          <Image source={readingPhotoSource(photoUri)} style={styles.preview} />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Quitar foto"
            activeOpacity={0.7}
            onPress={() => {
              setPhotoUri(null)
              setSaveError(null)
            }}
            style={styles.trash}
          >
            <Ionicons name="trash-outline" size={22} color="#ff5c5c" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Tomar foto"
          activeOpacity={0.7}
          onPress={() => setPhotoSheetOpen(true)}
          style={styles.captureAction}
        >
          <Ionicons name="camera-outline" size={28} color={colors.accent} />
          <Text style={styles.captureLabel}>Tomar foto</Text>
        </TouchableOpacity>
      )}
      <Modal
        visible={photoSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPhotoSheetOpen(false)}
      >
        <View style={styles.sheetRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            onPress={() => setPhotoSheetOpen(false)}
            style={styles.backdrop}
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.handle} />
            <View style={styles.sources}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Cámara"
                activeOpacity={0.7}
                onPress={() => {
                  void choosePhoto('camera')
                }}
                style={styles.source}
              >
                <View style={styles.sourceIcon}>
                  <Ionicons name="camera" size={32} color={colors.accent} />
                </View>
                <Text style={styles.sourceLabel}>Cámara</Text>
              </TouchableOpacity>
              {/* P-23: si la foto de la galería cuenta sigue abierto. */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Galería"
                activeOpacity={0.7}
                onPress={() => {
                  void choosePhoto('library')
                }}
                style={styles.source}
              >
                <View style={styles.sourceIcon}>
                  <Ionicons name="images" size={32} color={colors.accent} />
                </View>
                <Text style={styles.sourceLabel}>Galería</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {status === 'missing' ? <ErrorView label="No encontramos ese suministro" /> : null}
      {status === 'error' ? (
        <ErrorView label={loadError ?? 'No se pudo cargar el suministro'} />
      ) : null}
      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
      <Button label="Guardar novedad y siguiente" onPress={() => void onSave()} />
      <LoadingOverlay
        visible={status === 'loading' || saving}
        label={saving ? 'Guardando' : 'Cargando'}
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
  line: {
    color: colors.text,
    fontSize: 16,
  },
  error: {
    color: colors.accentMuted,
    fontSize: 16,
  },
  previewFrame: {
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  trash: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22, 24, 38, 0.72)',
  },
  captureAction: {
    minHeight: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  captureLabel: {
    color: colors.text,
    fontSize: 14,
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(22, 24, 38, 0.72)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  sources: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  source: {
    alignItems: 'center',
    gap: 8,
    minWidth: 96,
  },
  sourceIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceLabel: {
    color: colors.text,
    fontSize: 16,
  },
})
