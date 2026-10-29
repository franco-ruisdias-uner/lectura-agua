import * as Location from 'expo-location'

import type { Coordenadas } from '@/types/entities'

// P-21: one fix when the reading is saved. Do not call this when the screen opens.
export async function captureReadingCoordinates(): Promise<Coordenadas | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return null

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })

    return {
      latitud: position.coords.latitude,
      longitud: position.coords.longitude,
    }
  } catch {
    return null
  }
}
