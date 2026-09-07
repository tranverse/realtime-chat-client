import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { BrandMark } from './components/brand/BrandMark'
import { Spinner } from './components/ui/Spinner'
import { ProtectedRoute, PublicOnlyRoute } from './features/auth/AuthGuards'

const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })))
const VerifyRegistrationPage = lazy(() => import('./pages/VerifyRegistrationPage').then((module) => ({ default: module.VerifyRegistrationPage })))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })))
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage').then((module) => ({ default: module.OAuthCallbackPage })))
const ChatWorkspacePage = lazy(() => import('./pages/ChatWorkspacePage').then((module) => ({ default: module.ChatWorkspacePage })))
const JoinInvitePage = lazy(() => import('./pages/JoinInvitePage').then((module) => ({ default: module.JoinInvitePage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

export default function App() {
  return (
    <Suspense fallback={<main className="boot-screen"><BrandMark /><Spinner label="Loading Luma…" /></main>}><Routes>
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/verify-registration" element={<PublicOnlyRoute><VerifyRegistrationPage /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
      <Route path="/reset-password" element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />
      <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
      <Route path="/" element={<ProtectedRoute><ChatWorkspacePage /></ProtectedRoute>} />
      <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatWorkspacePage /></ProtectedRoute>} />
      <Route path="/invite/:code" element={<ProtectedRoute><JoinInvitePage /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes></Suspense>
  )
}
