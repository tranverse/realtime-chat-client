import { Bell, MessageCircleMore, Settings2 } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { BrandMark } from '../brand/BrandMark'
import { useAuth } from '../../features/auth/useAuth'

export function AppRail({ onProfile }: { onProfile: () => void }) {
  const { user } = useAuth()
  return (
    <nav className="app-rail" aria-label="Main navigation">
      <BrandMark compact />
      <div className="app-rail__nav">
        <button className="is-active" aria-label="Messages"><MessageCircleMore size={20} /><span>Messages</span></button>
        <button aria-label="Notifications"><Bell size={20} /><span>Notifications</span><i /></button>
      </div>
      <div className="app-rail__bottom">
        <Button variant="ghost" size="icon" onClick={onProfile}>Settings<Settings2 size={20} /></Button>
        {user && <button className="rail-profile" onClick={onProfile} aria-label="Open profile"><Avatar name={user.name} src={user.avatar} size="sm" online /></button>}
      </div>
    </nav>
  )
}
