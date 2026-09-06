import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { BrandMark } from '../components/brand/BrandMark'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../features/auth/useAuth'

export function OAuthCallbackPage() {
  const [params] = useSearchParams()
  const { acceptTokens } = useAuth()
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true
    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')
    const error = params.get('error')
    if (error || !accessToken || !refreshToken) {
      toast.error('Google sign-in could not be completed.')
      navigate('/login', { replace: true })
      return
    }
    void acceptTokens({ accessToken, refreshToken })
      .then(() => { toast.success('Signed in with Google.'); navigate('/', { replace: true }) })
      .catch(() => { toast.error('Sign-in could not be completed.'); navigate('/login', { replace: true }) })
  }, [acceptTokens, navigate, params])

  return <main className="boot-screen"><BrandMark /><Spinner label="Finishing Google sign-in…" /></main>
}
