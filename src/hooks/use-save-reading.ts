import { useCallback, useState } from 'react'

import { apiErrorMessage } from '@/api/errors'
import { saveReading } from '@/services/routes'

import type { SaveReadingResult } from '@/services/routes'
import type { Coordenadas } from '@/types/entities'

type SaveReadingInput = {
  routeKey: string
  suministroId: string
  valor: number
  fotoUri: string
  confirmed: boolean
  coordenadas: Coordenadas | null
}

export function useSaveReading() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (input: SaveReadingInput): Promise<SaveReadingResult | null> => {
    setSaving(true)
    setError(null)

    try {
      return await saveReading(input)
    } catch (caught) {
      setError(apiErrorMessage(caught, 'No se pudo guardar la lectura'))
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  return { run, saving, error, setError }
}
