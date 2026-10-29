import { httpClient } from '@/api/client'
import { loginAccounts } from '@/mocks'

import type { RespuestaUno } from '@/types/api'
import type { AuthResponse } from '@/types/auth'

export async function signIn(legajo: string, password: string): Promise<AuthResponse> {
  const response = await httpClient.post<RespuestaUno<AuthResponse>>('/auth/ingreso', {
    legajo,
    contrasena: password,
  })
  return response.data.datos
}

export async function signOut(): Promise<void> {
  await httpClient.post('/auth/salida')
}

// P-13: el contrato del usuario no tiene contraseña. El hint de demo usa el mock.
export function demoSignIn(): { legajo: string; password: string } | null {
  const account = loginAccounts[0]
  if (!account) {
    return null
  }

  return { legajo: account.legajo, password: account.password }
}
