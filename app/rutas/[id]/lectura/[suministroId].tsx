import { useEffect, useState } from 'react'
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@react-native-vector-icons/ionicons'

import { Button } from '@/components/Button'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { StatusBadge } from '@/components/StatusBadge'
import { useReading } from '@/hooks/use-route-data'
import { readingPhotoSource } from '@/lib/reading-photo'
import { isOutOfRange, readingConsumption, saveReading } from '@/services/routes'
import { colors } from '@/theme/colors'

function formatMeters(value: number): string {
  return new Intl.NumberFormat('es-AR').format(value)
}

function formatDayMonth(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return iso
  return `${match[3]}/${match[2]}`
}

async function pickPhoto(source: 'camera' | 'library'): Promise<string | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

  if (!permission.granted) {
    const message =
      source === 'camera'
        ? 'Necesitamos la cámara para fotografiar el medidor.'
        : 'Necesitamos la galería para adjuntar una foto del medidor.'
    Alert.alert('Permiso', message)
    return null
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.7,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.7,
        })

  if (result.canceled) return null
  return result.assets[0]?.uri ?? null
}

export default function ReadingScreen() {
  const { id, suministroId } = useLocalSearchParams<{ id: string; suministroId: string }>()
  const routeKey = typeof id === 'string' ? id : ''
  const supplyId = typeof suministroId === 'string' ? suministroId : ''
  const insets = useSafeAreaInsets()
  const { context, status } = useReading(routeKey, supplyId)
  const current = context?.suministro.id === supplyId ? context : null

  const [digits, setDigits] = useState('')
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDigits('')
    setPhotoUri(null)
    setSaveError(null)
  }, [supplyId])

  useEffect(() => {
    if (!current?.lectura) return
    setDigits(String(current.lectura.valor))
  }, [current?.lectura])

  const valor = digits.length > 0 ? Number(digits) : null
  const consumo =
    current && valor !== null && Number.isInteger(valor)
      ? readingConsumption(valor, current.suministro.lecturaAnterior, current.medidor.multiplicador)
      : null
  const outOfRange = current && consumo !== null ? isOutOfRange(consumo) : false

  // A saved reading is the current result. The screen only shows it.
  const locked = current?.lectura != null
  const shownPhoto = locked ? (current?.lectura?.fotoUri ?? null) : photoUri

  const closePhotoSheet = () => setPhotoSheetOpen(false)

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
      closePhotoSheet()
    }
  }

  const onSave = async () => {
    if (locked) return
    if (!current || valor === null) {
      setSaveError('Ingresá la lectura')
      return
    }
    if (!photoUri) {
      setSaveError('Sacá una foto del medidor para guardar')
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      const result = await saveReading({
        routeKey,
        suministroId: supplyId,
        valor,
        fotoUri: photoUri,
        confirmed: false,
      })

      if (!result.ok) {
        if (result.reason === 'needs-confirmation') {
          router.push({
            pathname: '/rutas/[id]/aviso',
            params: { id: routeKey, suministroId: supplyId, valor: String(valor), fotoUri: photoUri },
          })
        } else if (result.reason === 'no-photo') {
          setSaveError('Sacá una foto del medidor para guardar')
        } else {
          setSaveError('No se pudo guardar la lectura')
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
    } catch {
      setSaveError('No se pudo guardar la lectura')
    } finally {
      setSaving(false)
    }
  }

  const anterior = current?.suministro.lecturaAnterior
  const anteriorDate = current?.suministro.fechaLecturaAnterior
  const promedio = current?.suministro.consumoPromedio

  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      {current ? (
        <>
          <Text style={styles.title}>
            {current.suministro.direccion} - {current.suministro.titular}
          </Text>
          <Text style={styles.line}>
            Medidor {current.medidor.serie} modelo {current.medidor.modelo}
          </Text>
          <Text style={styles.line}>
            {anterior == null
              ? 'Sin lectura anterior'
              : `Anterior: ${formatMeters(anterior)} m³${
                  anteriorDate ? ` (${formatDayMonth(anteriorDate)})` : ''
                }`}
          </Text>
          <Text style={styles.line}>
            {promedio == null
              ? 'Sin promedio'
              : `Promedio últimos 6 bim.: ${formatMeters(promedio)} m³`}
          </Text>
          <View style={styles.readingHeading}>
            <Text style={styles.line}>Lectura de hoy</Text>
            {locked ? <StatusBadge label="LEÍDO" tone="read" /> : null}
          </View>
          <TextInput
            accessibilityLabel="Lectura de hoy"
            value={digits}
            onChangeText={(value) => {
              setDigits(value.replace(/\D/g, '').slice(0, current.medidor.digitos))
              setSaveError(null)
            }}
            editable={!locked}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={current.medidor.digitos}
            placeholder="—"
            placeholderTextColor={colors.muted}
            style={[styles.reading, locked ? styles.readingLocked : null]}
          />
          {consumo !== null ? (
            <Text style={styles.line}>
              Consumo: {formatMeters(consumo)} m³ - {outOfRange ? 'fuera de lo habitual' : 'normal'}
            </Text>
          ) : null}
          {shownPhoto ? (
            locked ? (
              <Image
                accessibilityLabel="Foto del medidor"
                source={readingPhotoSource(shownPhoto)}
                style={styles.preview}
              />
            ) : (
              <View style={styles.previewFrame}>
                <Image source={readingPhotoSource(shownPhoto)} style={styles.preview} />
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
            )
          ) : locked ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Apretar para tomar foto"
              onPress={() => setPhotoSheetOpen(true)}
              style={styles.photo}
            >
              <Ionicons name="image-outline" size={40} color={colors.muted} />
              <Text style={styles.photoLabel}>Apretar para tomar foto</Text>
            </Pressable>
          )}
          <Modal
            visible={photoSheetOpen}
            transparent
            animationType="slide"
            onRequestClose={closePhotoSheet}
          >
            <View style={styles.sheetRoot}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                onPress={closePhotoSheet}
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
                  {/* P-23: whether a gallery photo counts stays open. */}
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
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
          {locked ? null : (
            <>
              <Button
                label="No se pudo leer"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/rutas/[id]/novedad/[suministroId]',
                    params: { id: routeKey, suministroId: supplyId },
                  })
                }
              />
              <Button label="Guardar" onPress={() => void onSave()} />
            </>
          )}
        </>
      ) : null}
      {status === 'missing' ? <Text style={styles.line}>No encontramos ese suministro</Text> : null}
      {status === 'error' ? <Text style={styles.line}>No se pudo cargar la lectura</Text> : null}
      <LoadingOverlay visible={status === 'loading' || saving} label={saving ? 'Guardando' : 'Cargando'} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    padding: 16,
    gap: 16,
  },
  title: {
    color: colors.text,
    fontSize: 22,
  },
  line: {
    color: colors.text,
    fontSize: 16,
  },
  readingHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  reading: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    fontSize: 32,
    letterSpacing: 4,
  },
  readingLocked: {
    color: colors.muted,
  },
  error: {
    color: colors.accentMuted,
    fontSize: 16,
  },
  photo: {
    minHeight: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  photoLabel: {
    color: colors.muted,
    fontSize: 16,
    textAlign: 'center',
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
