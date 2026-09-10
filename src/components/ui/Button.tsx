import { Children, isValidElement, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { FiLoader } from 'react-icons/fi'
import { cn } from '../../lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: ReactNode
}

export function Button({ variant = 'primary', size = 'md', loading = false, leftIcon, className, children, disabled, ...props }: ButtonProps) {
  const childNodes = Children.toArray(children)
  const icon = size === 'icon' ? childNodes.findLast((child) => isValidElement(child)) : null
  const accessibleLabel = size === 'icon' ? childNodes.filter((child) => typeof child === 'string').join(' ') : null
  return (
    <button className={cn('button', `button--${variant}`, `button--${size}`, className)} disabled={disabled || loading} {...props}>
      {loading ? <FiLoader className="spin" size={17} /> : leftIcon}
      {size !== 'icon' && children}
      {size === 'icon' && <><span className="sr-only">{accessibleLabel}</span>{!loading && icon}</>}
    </button>
  )
}
