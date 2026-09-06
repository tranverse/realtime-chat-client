import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './features/auth/AuthGuards'
import { ChatWorkspacePage } from './pages/ChatWorkspacePage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OAuthCallbackPage } from './pages/OAuthCallbackPage'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { VerifyRegistrationPage } from './pages/VerifyRegistrationPage'
import { JoinInvitePage } from './pages/JoinInvitePage'

export default function App() {
  return (
    <Routes>
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
    </Routes>
  )
}
