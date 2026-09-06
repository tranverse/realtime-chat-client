import { LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { useAuth } from '../features/auth/useAuth'
import { authApi } from '../features/auth/authApi'
import { getErrorMessage } from '../lib/errors'

const schema = z.object({ email: z.email('Enter a valid email address'), password: z.string().min(1, 'Enter your password') })

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function submit(event: FormEvent) {
    event.preventDefault()
    const result = schema.safeParse({ email, password })
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message])))
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await login(result.data)
      toast.success('Welcome back!')
      const target = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(target, { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Your email or password is incorrect.'))
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout eyebrow="Welcome back" title="Sign in to Luma" description="Pick up the conversations waiting for you.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <FormField label="Email" type="email" autoComplete="email" placeholder="ban@example.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} leading={<Mail size={17} />} />
        <div className="auth-form__password">
          <FormField label="Password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} leading={<LockKeyhole size={17} />} />
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" loading={loading}>Sign in</Button>
      </form>
      <div className="divider">or continue with</div>
      <a className="google-button" href={authApi.googleLoginUrl()}><span>G</span> Google</a>
      <p className="auth-switch">New to Luma? <Link to="/register">Create an account</Link></p>
    </AuthLayout>
  )
}
