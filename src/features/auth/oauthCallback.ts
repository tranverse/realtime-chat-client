export function readOAuth2Callback(params: URLSearchParams) {
  const error = params.get('error')
  const code = params.get('code')?.trim()
  return { code: code || null, error }
}
