import { useCallback, useState } from 'react'

import { apiErrorMessage } from '@/api/errors'
import { useAuth } from '@/hooks/use-auth'
import { signIn } from '@/services/login'

import type { AuthResponse } from '@/types/auth'

export function useSignIn() {
  const { dispatch } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (legajo: string, password: string): Promise<AuthResponse | null> => {
      setSaving(true)
      setError(null)

      try {
        const authResponse = await signIn(legajo, password)
        dispatch({ type: 'LOGIN', authResponse })
        return authResponse
      } catch (caught) {
        setError(apiErrorMessage(caught, 'No se pudo ingresar'))
        return null
      } finally {
        setSaving(false)
      }
    },
    [dispatch],
  )

  return { run, saving, error }
}
