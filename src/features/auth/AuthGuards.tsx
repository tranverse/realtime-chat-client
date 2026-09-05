import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { BrandMark } from '../../components/brand/BrandMark'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from './useAuth'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <main className="boot-screen"><BrandMark /><Spinner label="Đang khôi phục phiên đăng nhập…" /></main>
  if (status === 'anonymous') return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  if (status === 'loading') return <main className="boot-screen"><BrandMark /><Spinner /></main>
  if (status === 'authenticated') return <Navigate to="/" replace />
  return children
}
