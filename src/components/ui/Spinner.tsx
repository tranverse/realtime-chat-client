import { LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

export function Spinner({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('spinner', className)} role="status">
      <LoaderCircle className="spin" size={22} />
      <span>{label}</span>
    </div>
  )
}
