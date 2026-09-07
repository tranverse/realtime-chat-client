import { LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { authApi } from '../features/auth/authApi'
import { getErrorMessage } from '../lib/errors'

const schema = z.object({
  name: z.string().trim().min(5, 'Your name must be at least 5 characters').max(120),
  email: z.email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })

export function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const result = schema.safeParse(form)
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message])))
      return
    }
    setLoading(true)
    setErrors({})
    try {
      await authApi.register(result.data)
      toast.success('A verification code has been sent to your email.')
      navigate('/verify-registration', { state: { email: result.data.email } })
    } catch (error) { toast.error(getErrorMessage(error)) }
    finally { setLoading(false) }
  }

  const bind = (key: keyof typeof form) => ({ value: form[key], onChange: (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [key]: event.target.value })) })

  return (
    <AuthLayout eyebrow="Start in a minute" title="Create your account" description="A friendly place for work and everyday conversations.">
      <form className="auth-form auth-form--compact" onSubmit={submit} noValidate>
        <FormField label="Full name" autoComplete="name" placeholder="Alex Morgan" {...bind('name')} error={errors.name} leading={<UserRound size={17} />} />
        <FormField label="Email" type="email" autoComplete="email" placeholder="ban@example.com" {...bind('email')} error={errors.email} leading={<Mail size={17} />} />
        <div className="form-grid">
          <FormField label="Password" type="password" autoComplete="new-password" placeholder="At least 6 characters" {...bind('password')} error={errors.password} leading={<LockKeyhole size={17} />} />
          <FormField label="Confirm" type="password" autoComplete="new-password" placeholder="Repeat password" {...bind('confirmPassword')} error={errors.confirmPassword} leading={<LockKeyhole size={17} />} />
        </div>
        <p className="terms-note">By creating an account, you agree to use Luma thoughtfully and respectfully.</p>
        <Button type="submit" size="lg" loading={loading}>Create account</Button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  )
}
