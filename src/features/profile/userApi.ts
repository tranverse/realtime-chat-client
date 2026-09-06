import { apiClient } from '../../lib/apiClient'
import type { ApiResponse, PageResponse, UserProfile, UserSummary } from '../../types/api'

export const userApi = {
  async search(q: string, page = 0, size = 20) {
    const { data } = await apiClient.get<ApiResponse<PageResponse<UserSummary>>>('/users/search', { params: { q, page, size } })
    return data.data
  },
  async update(payload: { name?: string; username?: string; avatar?: string; phone?: string; dob?: string }) {
    const { data } = await apiClient.patch<ApiResponse<UserProfile>>('/users/me', payload)
    return data.data
  },
}
