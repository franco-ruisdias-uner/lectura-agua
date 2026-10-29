import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

export async function pickPhoto(source: 'camera' | 'library'): Promise<string | null> {
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
