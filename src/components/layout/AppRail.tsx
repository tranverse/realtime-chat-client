import { MessageCircle, Settings } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { BrandMark } from '../brand/BrandMark'
import { useAuth } from '../../features/auth/useAuth'
import { NotificationButton } from '../../features/notifications/NotificationButton'

export function AppRail({ onProfile }: { onProfile: () => void }) {
  const { user } = useAuth()
  return (
    <nav className="hidden h-dvh w-[72px] shrink-0 flex-col items-center border-r border-slate-200 bg-slate-950 py-4 md:flex" aria-label="Main navigation">
      <BrandMark compact />
      <div className="mt-8 flex flex-col items-center gap-2">
        <button className="grid size-10 place-items-center rounded-xl bg-indigo-500 text-white" aria-label="Messages" title="Messages"><MessageCircle size={19} /><span className="sr-only">Messages</span></button>
        <NotificationButton />
      </div>
      <div className="mt-auto flex flex-col items-center gap-3">
        <Button className="text-slate-400 hover:bg-slate-800 hover:text-white" variant="ghost" size="icon" onClick={onProfile}>Settings<Settings size={18} /></Button>
        {user && <button className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" onClick={onProfile} aria-label="Open profile"><Avatar name={user.name} src={user.avatar} size="sm" online /></button>}
      </div>
    </nav>
  )
}
