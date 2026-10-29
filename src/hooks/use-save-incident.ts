import { useCallback, useState } from 'react'

import { apiErrorMessage } from '@/api/errors'
import { saveIncident } from '@/services/routes'

import type { SaveIncidentResult } from '@/services/routes'
import type { MotivoNovedad } from '@/types/entities'

type SaveIncidentInput = {
  routeKey: string
  suministroId: string
  motivo: MotivoNovedad | null
  comentario: string
  fotoUri: string
}

export function useSaveIncident() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (input: SaveIncidentInput): Promise<SaveIncidentResult | null> => {
    setSaving(true)
    setError(null)

    try {
      return await saveIncident(input)
    } catch (caught) {
      setError(apiErrorMessage(caught, 'No se pudo guardar la novedad'))
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  return { run, saving, error, setError }
}
