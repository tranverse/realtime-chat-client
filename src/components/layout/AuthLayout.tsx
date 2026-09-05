import { Check, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { BrandMark } from '../brand/BrandMark'

export function AuthLayout({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <BrandMark className="auth-story__brand" />
        <div className="auth-story__content">
          <span className="auth-story__badge"><Sparkles size={14} /> Kết nối theo cách nhẹ nhàng hơn</span>
          <h1>Mọi cuộc trò chuyện,<br />trong một nhịp điệu.</h1>
          <p>Nhắn tin tức thì, giữ liên lạc với nhóm và tập trung vào điều đang được nói.</p>
          <div className="auth-story__preview" aria-hidden="true">
            <div className="preview-bubble preview-bubble--one"><MessageCircle size={16} /> Mình vừa gửi bản cập nhật rồi nhé!</div>
            <div className="preview-bubble preview-bubble--two"><Check size={15} /> Đã nhận, trông rất ổn ✨</div>
            <div className="preview-presence"><span /> 8 người đang hoạt động</div>
          </div>
        </div>
        <p className="auth-story__foot"><ShieldCheck size={15} /> Phiên đăng nhập an toàn với JWT rotation</p>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card__heading">
            <span>{eyebrow}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  )
}
