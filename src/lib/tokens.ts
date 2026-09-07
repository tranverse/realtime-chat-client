import type { AuthTokens } from '../types/api'

const ACCESS_TOKEN_KEY = 'luma.accessToken'
const REFRESH_TOKEN_KEY = 'luma.refreshToken'

let accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)

export const tokenStore = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set(tokens: AuthTokens) {
    accessToken = tokens.accessToken
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  },
  clear() {
    accessToken = null
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
  hasSession: () => Boolean(accessToken && localStorage.getItem(REFRESH_TOKEN_KEY)),
}
