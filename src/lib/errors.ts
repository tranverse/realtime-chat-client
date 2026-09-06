import axios from 'axios'

export interface ApiErrorBody {
  status?: number
  code?: string
  message?: string
  timestamp?: string
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback
  }

  if (error instanceof Error) return error.message
  return fallback
}
