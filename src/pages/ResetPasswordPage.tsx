import { LockKeyhole } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { authApi } from '../features/auth/authApi'
import { getErrorMessage } from '../lib/errors'

export function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { email?: string; resetToken?: string } | null
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!state?.email || !state.resetToken) return <Navigate to="/forgot-password" replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 6) { toast.error('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { toast.error('Passwords do not match.'); return }
    setLoading(true)
    try {
      await authApi.resetPassword(state!.email!, state!.resetToken!, password, confirmPassword)
      toast.success('Your password has been updated. You can sign in now.')
      navigate('/login', { replace: true })
    } catch (error) { toast.error(getErrorMessage(error)) }
    finally { setLoading(false) }
  }

  return (
    <AuthLayout eyebrow="One last step" title="Create a new password" description="Choose something memorable to you and hard for others to guess.">
      <form className="auth-form" onSubmit={submit}>
        <FormField label="New password" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={password} onChange={(event) => setPassword(event.target.value)} leading={<LockKeyhole size={17} />} />
        <FormField label="Confirm password" type="password" autoComplete="new-password" placeholder="Repeat your password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} leading={<LockKeyhole size={17} />} />
        <Button type="submit" size="lg" loading={loading}>Update password</Button>
      </form>
      <Link className="back-link" to="/login">Back to sign in</Link>
    </AuthLayout>
  )
}
