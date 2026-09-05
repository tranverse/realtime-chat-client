import { createContext } from 'react'
import type { AuthTokens, UserProfile } from '../../types/api'
import type { LoginPayload } from './authApi'

export interface AuthContextValue {
  user: UserProfile | null
  status: 'loading' | 'authenticated' | 'anonymous'
  login: (payload: LoginPayload) => Promise<void>
  acceptTokens: (tokens: AuthTokens) => Promise<void>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
