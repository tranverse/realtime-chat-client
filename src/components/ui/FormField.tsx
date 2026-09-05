import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface BaseProps {
  label: string
  hint?: string
  error?: string
  leading?: ReactNode
}

export function FormField({ label, hint, error, leading, className, ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className={cn('field__control', error && 'has-error', leading && 'has-leading')}>
        {leading && <span className="field__leading">{leading}</span>}
        <input className={className} {...props} />
      </span>
      {(error || hint) && <span className={cn('field__hint', error && 'is-error')}>{error ?? hint}</span>}
    </label>
  )
}

export function TextAreaField({ label, hint, error, className, ...props }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className={cn('field__control', error && 'has-error')}><textarea className={className} {...props} /></span>
      {(error || hint) && <span className={cn('field__hint', error && 'is-error')}>{error ?? hint}</span>}
    </label>
  )
}
