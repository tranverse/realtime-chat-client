import { KeyRound, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { authApi } from '../features/auth/authApi'
import { getErrorMessage } from '../lib/errors'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      if (!sent) {
        await authApi.forgotPassword(email)
        setSent(true)
        toast.success('Mã đặt lại mật khẩu đã được gửi.')
      } else {
        const result = await authApi.verifyResetCode(email, code)
        navigate('/reset-password', { state: { email, resetToken: result.resetToken } })
      }
    } catch (error) { toast.error(getErrorMessage(error)) }
    finally { setLoading(false) }
  }

  return (
    <AuthLayout eyebrow="Khôi phục tài khoản" title={sent ? 'Kiểm tra hộp thư' : 'Quên mật khẩu?'} description={sent ? `Nhập mã 6 số đã gửi tới ${email}.` : 'Đừng lo, chúng tôi sẽ giúp bạn quay lại cuộc trò chuyện.'}>
      <form className="auth-form" onSubmit={submit}>
        <FormField label="Email" type="email" autoComplete="email" disabled={sent} placeholder="ban@example.com" value={email} onChange={(event) => setEmail(event.target.value)} leading={<Mail size={17} />} />
        {sent && <FormField label="Mã xác thực" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} leading={<KeyRound size={17} />} />}
        <Button type="submit" size="lg" loading={loading} disabled={!email || (sent && code.length !== 6)}>{sent ? 'Xác nhận mã' : 'Gửi mã khôi phục'}</Button>
      </form>
      <Link className="back-link" to="/login">Quay lại đăng nhập</Link>
    </AuthLayout>
  )
}
