import { useCallback, useState } from 'react'

import { apiErrorMessage } from '@/api/errors'
import { closeRoute } from '@/services/routes'

import type { CloseRouteResult } from '@/services/routes'

export function useCloseRoute() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (routeKey: string): Promise<CloseRouteResult | null> => {
    setSaving(true)
    setError(null)

    try {
      return await closeRoute(routeKey)
    } catch (caught) {
      setError(apiErrorMessage(caught, 'No se pudo cerrar la ruta. Probá de nuevo.'))
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  return { run, saving, error, setError }
}
