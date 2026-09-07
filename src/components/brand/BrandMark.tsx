import { MessageCircleMore } from 'lucide-react'
import { cn } from '../../lib/cn'

interface BrandMarkProps {
  compact?: boolean
  className?: string
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn('brand-mark', className)} aria-label="Luma">
      <span className="brand-mark__icon" aria-hidden="true">
        <MessageCircleMore size={21} strokeWidth={2.2} />
      </span>
      {!compact && <span className="brand-mark__word">luma</span>}
    </div>
  )
}
