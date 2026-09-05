import { MailCheck } from 'lucide-react'
import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { useAuth } from '../features/auth/useAuth'
import { authApi } from '../features/auth/authApi'
import { getErrorMessage } from '../lib/errors'

export function VerifyRegistrationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { acceptTokens } = useAuth()
  const email = (location.state as { email?: string } | null)?.email ?? ''
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  function change(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    setDigits((current) => current.map((item, itemIndex) => itemIndex === index ? digit : item))
    if (digit && index < 5) inputs.current[index + 1]?.focus()
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus()
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!email) { toast.error('Không tìm thấy email đăng ký. Vui lòng đăng ký lại.'); return }
    const code = digits.join('')
    if (code.length !== 6) { toast.error('Vui lòng nhập đủ 6 số.'); return }
    setLoading(true)
    try {
      await acceptTokens(await authApi.verifyRegistration(email, code))
      toast.success('Tài khoản đã được xác thực.')
      navigate('/', { replace: true })
    } catch (error) { toast.error(getErrorMessage(error, 'Mã xác thực không hợp lệ.')) }
    finally { setLoading(false) }
  }

  async function resend() {
    if (!email) return
    try { await authApi.resendRegistrationCode(email); toast.success('Đã gửi một mã mới.') }
    catch (error) { toast.error(getErrorMessage(error)) }
  }

  return (
    <AuthLayout eyebrow="Xác nhận email" title="Nhập mã gồm 6 số" description={email ? `Chúng tôi vừa gửi mã tới ${email}.` : 'Vui lòng quay lại trang đăng ký để nhận mã.'}>
      <form className="auth-form verify-form" onSubmit={submit}>
        <div className="verify-icon"><MailCheck size={25} /></div>
        <div className="otp-inputs" aria-label="Mã xác thực">
          {digits.map((digit, index) => <input key={index} ref={(element) => { inputs.current[index] = element }} inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'} maxLength={1} value={digit} onChange={(event) => change(index, event.target.value)} onKeyDown={(event) => onKeyDown(index, event)} aria-label={`Số thứ ${index + 1}`} />)}
        </div>
        <Button type="submit" size="lg" loading={loading}>Xác thực & tiếp tục</Button>
      </form>
      <p className="auth-switch">Chưa nhận được mã? <button type="button" onClick={resend}>Gửi lại mã</button></p>
      <Link className="back-link" to="/register">Quay lại đăng ký</Link>
    </AuthLayout>
  )
}
