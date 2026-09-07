import { Check, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { BrandMark } from '../brand/BrandMark'

export function AuthLayout({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <BrandMark className="auth-story__brand" />
        <div className="auth-story__content">
          <span className="auth-story__badge"><Sparkles size={14} /> A calmer way to stay connected</span>
          <h1>Every conversation,<br />in one rhythm.</h1>
          <p>Message instantly, stay close to your team, and keep the focus on what matters.</p>
          <div className="auth-story__preview" aria-hidden="true">
            <div className="preview-bubble preview-bubble--one"><MessageCircle size={16} /> I just shared the latest update!</div>
            <div className="preview-bubble preview-bubble--two"><Check size={15} /> Got it, looks great ✨</div>
            <div className="preview-presence"><span /> 8 people online</div>
          </div>
        </div>
        <p className="auth-story__foot"><ShieldCheck size={15} /> Secure sessions with JWT rotation</p>
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
