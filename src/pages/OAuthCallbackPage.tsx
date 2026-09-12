import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { BrandMark } from '../components/brand/BrandMark'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../features/auth/useAuth'
import { authApi } from '../features/auth/authApi'
import { readOAuth2Callback } from '../features/auth/oauthCallback'

export function OAuthCallbackPage() {
  const [params] = useSearchParams()
  const { acceptTokens } = useAuth()
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true
    const { code, error } = readOAuth2Callback(params)
    if (error || !code) {
      toast.error('Google sign-in could not be completed.')
      navigate('/login', { replace: true })
      return
    }
    void authApi.exchangeOAuth2Code(code)
      .then(acceptTokens)
      .then(() => { toast.success('Signed in with Google.'); navigate('/', { replace: true }) })
      .catch(() => { toast.error('Sign-in could not be completed.'); navigate('/login', { replace: true }) })
  }, [acceptTokens, navigate, params])

  return <main className="boot-screen"><BrandMark /><Spinner label="Finishing Google sign-in…" /></main>
}
