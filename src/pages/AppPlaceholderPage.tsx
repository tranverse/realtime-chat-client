import { LogOut, MessageCircleMore } from 'lucide-react'
import { BrandMark } from '../components/brand/BrandMark'
import { Button } from '../components/ui/Button'
import { useAuth } from '../features/auth/useAuth'

export function AppPlaceholderPage() {
  const { user, logout } = useAuth()
  return (
    <main className="placeholder-app">
      <header><BrandMark /><Button variant="secondary" leftIcon={<LogOut size={16} />} onClick={() => void logout()}>Đăng xuất</Button></header>
      <section><MessageCircleMore size={36} /><h1>Xin chào, {user?.name}</h1><p>Không gian hội thoại đang được kết nối.</p></section>
    </main>
  )
}
