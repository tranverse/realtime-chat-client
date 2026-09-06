import { useQuery } from '@tanstack/react-query'
import { MessageCirclePlus, Search, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { cn } from '../../lib/cn'
import { useAuth } from '../auth/useAuth'
import { conversationApi } from './conversationApi'
import { formatConversationTime, getConversationAvatar, getConversationName, lastMessageLabel } from './conversationUtils'

export function ConversationList({ onCreate }: { onCreate: () => void }) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const conversations = useQuery({ queryKey: ['conversations'], queryFn: () => conversationApi.list() })
  const items = useMemo(() => (conversations.data?.items ?? []).filter((conversation) => getConversationName(conversation, user?.id).toLowerCase().includes(search.toLowerCase())), [conversations.data, search, user?.id])

  return (
    <aside className="conversation-sidebar">
      <div className="conversation-sidebar__heading">
        <div><span>Your space</span><h1>Messages</h1></div>
        <Button size="icon" onClick={onCreate}>New conversation<MessageCirclePlus size={19} /></Button>
      </div>
      <label className="conversation-search"><Search size={16} /><input aria-label="Search conversations" placeholder="Search conversations…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <div className="conversation-filter"><button className="is-active">All</button><button>Unread</button><button>Groups</button></div>
      <div className="conversation-list">
        {conversations.isLoading && <Spinner label="Loading conversations…" className="sidebar-spinner" />}
        {conversations.isError && <div className="sidebar-error"><p>Conversations could not be loaded.</p><Button size="sm" variant="secondary" onClick={() => void conversations.refetch()}>Try again</Button></div>}
        {!conversations.isLoading && items.length === 0 && <div className="sidebar-empty"><UsersRound size={25} /><strong>{search ? 'No results found' : 'No conversations yet'}</strong><p>{search ? 'Try a different search term.' : 'Start a conversation with someone.'}</p></div>}
        {items.map((conversation) => {
          const name = getConversationName(conversation, user?.id)
          return <NavLink key={conversation.id} to={`/chat/${conversation.id}`} className={({ isActive }) => cn('conversation-item', isActive && 'is-active')}>
            <Avatar name={name} src={getConversationAvatar(conversation, user?.id)} size="lg" />
            <span className="conversation-item__content"><span><strong>{name}</strong><time>{formatConversationTime(conversation.lastMessage?.createdAt ?? conversation.updatedAt)}</time></span><span><small>{lastMessageLabel(conversation, user)}</small>{conversation.unreadCount > 0 && <b>{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</b>}</span></span>
          </NavLink>
        })}
      </div>
    </aside>
  )
}
