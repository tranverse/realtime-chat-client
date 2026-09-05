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
      toast.error('Không thể đăng nhập bằng Google.')
      navigate('/login', { replace: true })
      return
    }
    void acceptTokens({ accessToken, refreshToken })
      .then(() => { toast.success('Đăng nhập Google thành công.'); navigate('/', { replace: true }) })
      .catch(() => { toast.error('Không thể hoàn tất đăng nhập.'); navigate('/login', { replace: true }) })
  }, [acceptTokens, navigate, params])

  return <main className="boot-screen"><BrandMark /><Spinner label="Đang hoàn tất đăng nhập Google…" /></main>
}
