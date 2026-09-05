import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, AuthTokens } from '../types/api'
import { appConfig } from './config'
import { tokenStore } from './tokens'

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

apiClient.interceptors.request.use((config) => {
  const accessToken = tokenStore.getAccessToken()
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

let refreshRequest: Promise<AuthTokens> | null = null

async function refreshSession(): Promise<AuthTokens> {
  const refreshToken = tokenStore.getRefreshToken()
  if (!refreshToken) throw new Error('Không có phiên đăng nhập để làm mới.')

  const response = await axios.post<ApiResponse<AuthTokens>>(`${appConfig.apiBaseUrl}/auth/refresh`, { refreshToken })
  tokenStore.set(response.data.data)
  return response.data.data
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryConfig | undefined
    const isAuthRoute = request?.url?.includes('/auth/')

    if (error.response?.status !== 401 || !request || request._retry || isAuthRoute) {
      throw error
    }

    request._retry = true
    refreshRequest ??= refreshSession().finally(() => { refreshRequest = null })

    try {
      const tokens = await refreshRequest
      request.headers.Authorization = `Bearer ${tokens.accessToken}`
      return apiClient(request)
    } catch (refreshError) {
      tokenStore.clear()
      window.dispatchEvent(new Event('luma:session-expired'))
      throw refreshError
    }
  },
)
