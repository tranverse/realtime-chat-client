import { apiClient } from '../../lib/apiClient'
import type { ApiResponse, MediaUpload } from '../../types/api'

export const mediaApi = {
  async uploadImage(file: File) {
    const form = new FormData()
    form.append('file', file)
    const { data } = await apiClient.post<ApiResponse<MediaUpload>>('/media/images', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 45_000,
    })
    return data.data
  },
}
