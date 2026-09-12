import { describe, expect, it } from 'vitest'
import { readOAuth2Callback } from './oauthCallback'

describe('readOAuth2Callback', () => {
  it('accepts only an opaque exchange code', () => {
    expect(readOAuth2Callback(new URLSearchParams('code=one-time-code'))).toEqual({ code: 'one-time-code', error: null })
  })

  it('does not accept tokens from the callback URL', () => {
    expect(readOAuth2Callback(new URLSearchParams('accessToken=secret&refreshToken=secret'))).toEqual({ code: null, error: null })
  })

  it('preserves provider errors', () => {
    expect(readOAuth2Callback(new URLSearchParams('error=oauth2_login_failed'))).toEqual({ code: null, error: 'oauth2_login_failed' })
  })
})
