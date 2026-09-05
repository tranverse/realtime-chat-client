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
  name: z.string().trim().min(5, 'Họ tên cần ít nhất 5 ký tự').max(120),
  email: z.email('Email chưa đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu xác nhận chưa khớp' })

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
      toast.success('Mã xác thực đã được gửi tới email của bạn.')
      navigate('/verify-registration', { state: { email: result.data.email } })
    } catch (error) { toast.error(getErrorMessage(error)) }
    finally { setLoading(false) }
  }

  const bind = (key: keyof typeof form) => ({ value: form[key], onChange: (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [key]: event.target.value })) })

  return (
    <AuthLayout eyebrow="Bắt đầu trong một phút" title="Tạo tài khoản mới" description="Một nơi thân thiện cho công việc và những câu chuyện hằng ngày.">
      <form className="auth-form auth-form--compact" onSubmit={submit} noValidate>
        <FormField label="Họ và tên" autoComplete="name" placeholder="Nguyễn Minh Anh" {...bind('name')} error={errors.name} leading={<UserRound size={17} />} />
        <FormField label="Email" type="email" autoComplete="email" placeholder="ban@example.com" {...bind('email')} error={errors.email} leading={<Mail size={17} />} />
        <div className="form-grid">
          <FormField label="Mật khẩu" type="password" autoComplete="new-password" placeholder="Tối thiểu 6 ký tự" {...bind('password')} error={errors.password} leading={<LockKeyhole size={17} />} />
          <FormField label="Nhập lại" type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" {...bind('confirmPassword')} error={errors.confirmPassword} leading={<LockKeyhole size={17} />} />
        </div>
        <p className="terms-note">Bằng việc tạo tài khoản, bạn đồng ý sử dụng Luma một cách văn minh và tôn trọng.</p>
        <Button type="submit" size="lg" loading={loading}>Tạo tài khoản</Button>
      </form>
      <p className="auth-switch">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </AuthLayout>
  )
}
