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
    if (!email) { toast.error('Registration email is missing. Please register again.'); return }
    const code = digits.join('')
    if (code.length !== 6) { toast.error('Enter all 6 digits.'); return }
    setLoading(true)
    try {
      await acceptTokens(await authApi.verifyRegistration(email, code))
      toast.success('Your account is verified.')
      navigate('/', { replace: true })
    } catch (error) { toast.error(getErrorMessage(error, 'That verification code is not valid.')) }
    finally { setLoading(false) }
  }

  async function resend() {
    if (!email) return
    try { await authApi.resendRegistrationCode(email); toast.success('A new code has been sent.') }
    catch (error) { toast.error(getErrorMessage(error)) }
  }

  return (
    <AuthLayout eyebrow="Confirm your email" title="Enter the 6-digit code" description={email ? `We just sent a code to ${email}.` : 'Return to registration to request a code.'}>
      <form className="auth-form verify-form" onSubmit={submit}>
        <div className="verify-icon"><MailCheck size={25} /></div>
        <div className="otp-inputs" aria-label="Verification code">
          {digits.map((digit, index) => <input key={index} ref={(element) => { inputs.current[index] = element }} inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'} maxLength={1} value={digit} onChange={(event) => change(index, event.target.value)} onKeyDown={(event) => onKeyDown(index, event)} aria-label={`Digit ${index + 1}`} />)}
        </div>
        <Button type="submit" size="lg" loading={loading}>Verify & continue</Button>
      </form>
      <p className="auth-switch">Did not receive it? <button type="button" onClick={resend}>Send a new code</button></p>
      <Link className="back-link" to="/register">Back to registration</Link>
    </AuthLayout>
  )
}
