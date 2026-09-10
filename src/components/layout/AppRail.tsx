import { FiMessageCircle, FiSettings } from 'react-icons/fi'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { BrandMark } from '../brand/BrandMark'
import { useAuth } from '../../features/auth/useAuth'
import { NotificationButton } from '../../features/notifications/NotificationButton'

export function AppRail({ onProfile }: { onProfile: () => void }) {
  const { user } = useAuth()
  return (
    <nav className="app-rail" aria-label="Main navigation">
      <BrandMark compact />
      <div className="app-rail__nav">
        <button className="is-active" aria-label="Messages" title="Messages"><FiMessageCircle /><span>Messages</span></button>
        <NotificationButton />
      </div>
      <div className="app-rail__bottom">
        <Button variant="ghost" size="icon" onClick={onProfile}>Settings<FiSettings /></Button>
        {user && <button className="rail-profile" onClick={onProfile} aria-label="Open profile"><Avatar name={user.name} src={user.avatar} size="sm" online /></button>}
      </div>
    </nav>
  )
}
