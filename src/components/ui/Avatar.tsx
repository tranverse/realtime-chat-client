import { useState } from 'react'
import { cn } from '../../lib/cn'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
  className?: string
}

const gradients = ['coral', 'violet', 'teal', 'blue', 'amber']

function initials(name: string) {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()
}

export function Avatar({ name, src, size = 'md', online, className }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const color = gradients[Math.abs([...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % gradients.length]

  return (
    <span className={cn('avatar', `avatar--${size}`, `avatar--${color}`, className)} title={name}>
      {src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : <span>{initials(name)}</span>}
      {online !== undefined && <span className={cn('avatar__status', online && 'is-online')} aria-label={online ? 'Online' : 'Offline'} />}
    </span>
  )
}
