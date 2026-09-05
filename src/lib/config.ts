const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

export const appConfig = {
  apiBaseUrl: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? '/api/v1'),
  wsUrl: import.meta.env.VITE_WS_URL ?? '/ws',
  appName: 'Luma',
} as const
