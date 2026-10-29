import { createContext, useCallback, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'

import { deleteJwtToken, setJwtToken } from '@/lib/secure-store'
import { signOut } from '@/services/login'

import type { AuthResponse } from '@/types/auth'

type AuthState = {
  authResponse: AuthResponse | null
}

export type AuthAction = { type: 'LOGIN'; authResponse: AuthResponse } | { type: 'LOGOUT' }

type AuthContextValue = {
  authResponse: AuthResponse | null
  dispatch: Dispatch<AuthAction>
  logout: () => Promise<void>
}

const initialState: AuthState = { authResponse: null }

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      // El token va a SecureStore para el interceptor de axios.
      setJwtToken(action.authResponse.token)
      return { authResponse: action.authResponse }
    case 'LOGOUT':
      void deleteJwtToken()
      return initialState
    default: {
      const unreachable: never = action
      return unreachable
    }
  }
}

export const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const logout = useCallback(async () => {
    try {
      await signOut()
    } catch {
      // Igual borramos el token local: el teléfono se comparte entre turnos.
    }
    dispatch({ type: 'LOGOUT' })
  }, [])

  const value = useMemo(
    () => ({
      authResponse: state.authResponse,
      dispatch,
      logout,
    }),
    [state.authResponse, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
