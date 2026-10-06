import { MessageCircleMore } from 'lucide-react'
import { cn } from '../../lib/cn'

interface BrandMarkProps {
  compact?: boolean
  className?: string
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn('flex items-center gap-2.5 font-semibold text-slate-950', className)} aria-label="Realtime Chat">
      <span className="relative grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm" aria-hidden="true">
        <MessageCircleMore size={21} strokeWidth={2.2} />
        <i className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
      </span>
      {!compact && <span className="text-lg tracking-[-0.02em]">Realtime Chat</span>}
    </div>
  )
}
