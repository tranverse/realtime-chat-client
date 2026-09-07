import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: ReactNode
}

export function Button({ variant = 'primary', size = 'md', loading = false, leftIcon, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button className={cn('button', `button--${variant}`, `button--${size}`, className)} disabled={disabled || loading} {...props}>
      {loading ? <LoaderCircle className="spin" size={17} /> : leftIcon}
      {size !== 'icon' && children}
      {size === 'icon' && <span className="sr-only">{children}</span>}
    </button>
  )
}
