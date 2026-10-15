import { loginAccounts } from '@/mocks'

import type { Usuario } from '@/types/entities'

// P-13: the username contract is open. This checks the mock legajo and password only.
// P-14: no fingerprint and no stored session.
const mockDelayMs = 800

export async function signIn(legajo: string, password: string): Promise<Usuario> {
  // The mock waits so the loading overlay can be seen. A real request takes its own time.
  await new Promise((resolve) => {
    setTimeout(resolve, mockDelayMs)
  })

  const account = loginAccounts.find(
    (item) =>
      item.legajo.toLowerCase() === legajo.toLowerCase() && item.password === password,
  )

  if (!account) {
    throw new Error('Legajo o contraseña incorrectos')
  }

  return account.usuario
}

export function demoSignIn(): { legajo: string; password: string } | null {
  const account = loginAccounts[0]
  if (!account) {
    return null
  }

  return { legajo: account.legajo, password: account.password }
}
