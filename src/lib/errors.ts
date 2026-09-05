import axios from 'axios'

export interface ApiErrorBody {
  status?: number
  code?: string
  message?: string
  timestamp?: string
}

export function getErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.'): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback
  }

  if (error instanceof Error) return error.message
  return fallback
}
