import { apiClient } from '../../lib/apiClient'
import { appConfig } from '../../lib/config'
import type { ApiResponse, AuthTokens, MessageResponse, UserProfile } from '../../types/api'

export interface RegisterPayload { email: string; password: string; confirmPassword: string; name: string }
export interface LoginPayload { email: string; password: string }

export const authApi = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login', payload)
    return data.data
  },
  async exchangeOAuth2Code(code: string) {
    const { data } = await apiClient.post<ApiResponse<AuthTokens>>('/auth/oauth2/exchange', { code })
    return data.data
  },
  async register(payload: RegisterPayload) {
    const { data } = await apiClient.post<ApiResponse<MessageResponse>>('/auth/register', payload)
    return data.data
  },
  async verifyRegistration(email: string, code: string) {
    const { data } = await apiClient.post<ApiResponse<AuthTokens>>('/auth/register/verify', { email, code })
    return data.data
  },
  async resendRegistrationCode(email: string) {
    const { data } = await apiClient.post<ApiResponse<MessageResponse>>('/auth/register/resend', { email })
    return data.data
  },
  async forgotPassword(email: string) {
    const { data } = await apiClient.post<ApiResponse<MessageResponse>>('/auth/forgot-password', { email })
    return data.data
  },
  async verifyResetCode(email: string, code: string) {
    const { data } = await apiClient.post<ApiResponse<{ resetToken: string; message: string }>>('/auth/forgot-password/verify', { email, code })
    return data.data
  },
  async resetPassword(email: string, resetToken: string, newPassword: string, confirmPassword: string) {
    const { data } = await apiClient.post<ApiResponse<MessageResponse>>('/auth/reset-password', { email, resetToken, newPassword, confirmPassword })
    return data.data
  },
  async logout(refreshToken: string) {
    await apiClient.post('/auth/logout', { refreshToken })
  },
  async logoutAll() {
    await apiClient.post('/auth/logout-all')
  },
  async me() {
    const { data } = await apiClient.get<ApiResponse<UserProfile>>('/users/me')
    return data.data
  },
  googleLoginUrl() {
    if (/^https?:\/\//.test(appConfig.apiBaseUrl)) {
      return `${new URL(appConfig.apiBaseUrl).origin}/oauth2/authorization/google`
    }
    return '/oauth2/authorization/google'
  },
}
