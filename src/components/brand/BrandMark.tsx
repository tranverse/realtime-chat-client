import { FiMessageSquare } from 'react-icons/fi'
import { cn } from '../../lib/cn'

interface BrandMarkProps {
  compact?: boolean
  className?: string
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn('brand-mark', className)} aria-label="Luma">
      <span className="brand-mark__icon" aria-hidden="true">
        <FiMessageSquare />
        <i />
      </span>
      {!compact && <span className="brand-mark__word">luma</span>}
    </div>
  )
}
