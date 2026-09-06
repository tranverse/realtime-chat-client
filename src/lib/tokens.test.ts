import { beforeEach, describe, expect, it } from 'vitest'
import { tokenStore } from './tokens'

describe('tokenStore', () => {
  beforeEach(() => tokenStore.clear())

  it('persists and clears a complete session', () => {
    tokenStore.set({ accessToken: 'access', refreshToken: 'refresh' })
    expect(tokenStore.getAccessToken()).toBe('access')
    expect(tokenStore.getRefreshToken()).toBe('refresh')
    expect(tokenStore.hasSession()).toBe(true)

    tokenStore.clear()
    expect(tokenStore.hasSession()).toBe(false)
  })
})
