import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthTokens, UserProfile } from '../../types/api'
import { tokenStore } from '../../lib/tokens'
import { authApi, type LoginPayload } from './authApi'
import { AuthContext, type AuthContextValue } from './authState'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [status, setStatus] = useState<AuthContextValue['status']>(() => tokenStore.hasSession() ? 'loading' : 'anonymous')

  const loadUser = useCallback(async () => {
    try {
      const profile = await authApi.me()
      setUser(profile)
      setStatus('authenticated')
    } catch {
      tokenStore.clear()
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  useEffect(() => {
    // Loading the persisted server session is the synchronization performed by this effect.
    // oxlint-disable-next-line react/set-state-in-effect
    if (tokenStore.hasSession()) void loadUser()

    const onExpired = () => {
      setUser(null)
      setStatus('anonymous')
    }
    window.addEventListener('luma:session-expired', onExpired)
    return () => window.removeEventListener('luma:session-expired', onExpired)
  }, [loadUser])

  const acceptTokens = useCallback(async (tokens: AuthTokens) => {
    tokenStore.set(tokens)
    await loadUser()
  }, [loadUser])

  const login = useCallback(async (payload: LoginPayload) => {
    await acceptTokens(await authApi.login(payload))
  }, [acceptTokens])

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.getRefreshToken()
    try { if (refreshToken) await authApi.logout(refreshToken) }
    finally {
      tokenStore.clear()
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const logoutAll = useCallback(async () => {
    try { await authApi.logoutAll() }
    finally {
      tokenStore.clear()
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const value = useMemo(() => ({ user, status, login, acceptTokens, logout, logoutAll, refreshUser: loadUser }), [user, status, login, acceptTokens, logout, logoutAll, loadUser])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
