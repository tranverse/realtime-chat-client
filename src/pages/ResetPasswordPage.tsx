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
    if (password.length < 6) { toast.error('Mật khẩu cần ít nhất 6 ký tự.'); return }
    if (password !== confirmPassword) { toast.error('Mật khẩu xác nhận chưa khớp.'); return }
    setLoading(true)
    try {
      await authApi.resetPassword(state!.email!, state!.resetToken!, password, confirmPassword)
      toast.success('Mật khẩu đã được cập nhật. Bạn có thể đăng nhập.')
      navigate('/login', { replace: true })
    } catch (error) { toast.error(getErrorMessage(error)) }
    finally { setLoading(false) }
  }

  return (
    <AuthLayout eyebrow="Bước cuối cùng" title="Tạo mật khẩu mới" description="Chọn mật khẩu dễ nhớ với bạn nhưng khó đoán với người khác.">
      <form className="auth-form" onSubmit={submit}>
        <FormField label="Mật khẩu mới" type="password" autoComplete="new-password" placeholder="Tối thiểu 6 ký tự" value={password} onChange={(event) => setPassword(event.target.value)} leading={<LockKeyhole size={17} />} />
        <FormField label="Nhập lại mật khẩu" type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} leading={<LockKeyhole size={17} />} />
        <Button type="submit" size="lg" loading={loading}>Đổi mật khẩu</Button>
      </form>
      <Link className="back-link" to="/login">Quay lại đăng nhập</Link>
    </AuthLayout>
  )
}
