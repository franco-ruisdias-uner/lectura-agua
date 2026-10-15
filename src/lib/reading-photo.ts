import type { ImageSourcePropType } from 'react-native'

// Mock readings store a path that is not a file on the device. The sample stands in so the screen can show it.
const sampleMeterPhoto = require('@/assets/meter-reading.png') as number

export function readingPhotoSource(uri: string): ImageSourcePropType {
  if (uri.startsWith('file:///lecturas/') || uri.startsWith('file:///novedades/')) {
    return sampleMeterPhoto
  }

  return { uri }
}
