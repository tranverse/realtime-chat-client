import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../pages/LoginPage'
import { AuthProvider } from '../features/auth/AuthProvider'
import { ProtectedRoute, PublicOnlyRoute } from '../features/auth/AuthGuards'
import { authApi } from '../features/auth/authApi'
import { tokenStore } from '../lib/tokens'
import type { UserProfile } from '../types/api'

const user: UserProfile = {
  id: 'user-1',
  name: 'Integration User',
  username: 'integration_user',
  email: 'integration@example.com',
  avatar: null,
  phone: null,
  dob: null,
  role: 'USER',
  provider: 'LOCAL',
  createdAt: '2026-09-26T00:00:00Z',
}

function renderAuthFlow(initialEntry: string | { pathname: string; state?: unknown }) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>}
          />
          <Route
            path="/"
            element={<ProtectedRoute><h1>Protected chat</h1></ProtectedRoute>}
          />
          <Route
            path="/chat/:conversationId"
            element={<ProtectedRoute><h1>Protected chat</h1></ProtectedRoute>}
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('authentication flow integration', () => {
  beforeEach(() => {
    tokenStore.clear()
  })

  afterEach(() => {
    cleanup()
    tokenStore.clear()
    vi.restoreAllMocks()
  })

  it('logs in, persists tokens, loads the profile, and enters the protected app', async () => {
    const login = vi.spyOn(authApi, 'login').mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })
    const me = vi.spyOn(authApi, 'me').mockResolvedValue(user)

    renderAuthFlow('/login')

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'integration@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'StrongPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('heading', { name: 'Protected chat' })).toBeInTheDocument()
    expect(login).toHaveBeenCalledWith({
      email: 'integration@example.com',
      password: 'StrongPassword123!',
    })
    expect(me).toHaveBeenCalledOnce()
    expect(tokenStore.getAccessToken()).toBe('access-token')
    expect(tokenStore.getRefreshToken()).toBe('refresh-token')
  })

  it('restores a persisted session before rendering a protected route', async () => {
    tokenStore.set({ accessToken: 'stored-access', refreshToken: 'stored-refresh' })
    const me = vi.spyOn(authApi, 'me').mockResolvedValue(user)

    renderAuthFlow('/chat/conversation-1')

    expect(screen.getByText('Restoring your session…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Protected chat' })).toBeInTheDocument()
    await waitFor(() => expect(me).toHaveBeenCalledOnce())
  })

  it('clears invalid persisted tokens and returns to login when profile restore fails', async () => {
    tokenStore.set({ accessToken: 'expired-access', refreshToken: 'expired-refresh' })
    vi.spyOn(authApi, 'me').mockRejectedValue(new Error('Session expired'))

    renderAuthFlow('/chat/conversation-1')

    expect(screen.getByText('Restoring your session…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Sign in to Luma' })).toBeInTheDocument()
    expect(tokenStore.getAccessToken()).toBeNull()
    expect(tokenStore.getRefreshToken()).toBeNull()
  })

  it('leaves a protected route when the shared API client reports session expiration', async () => {
    tokenStore.set({ accessToken: 'access-token', refreshToken: 'refresh-token' })
    vi.spyOn(authApi, 'me').mockResolvedValue(user)

    renderAuthFlow('/')
    expect(await screen.findByRole('heading', { name: 'Protected chat' })).toBeInTheDocument()

    window.dispatchEvent(new Event('luma:session-expired'))

    expect(await screen.findByRole('heading', { name: 'Sign in to Luma' })).toBeInTheDocument()
  })
})
