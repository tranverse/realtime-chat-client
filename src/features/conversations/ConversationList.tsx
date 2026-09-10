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
import { filterConversations, formatConversationTime, getConversationAvatar, getConversationName, lastMessageLabel, type ConversationFilter } from './conversationUtils'

export function ConversationList({ onCreate }: { onCreate: () => void }) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ConversationFilter>('all')
  const conversations = useQuery({ queryKey: ['conversations'], queryFn: () => conversationApi.list() })
  const items = useMemo(
    () => filterConversations(conversations.data?.items ?? [], filter, search, user?.id),
    [conversations.data, filter, search, user?.id],
  )

  return (
    <aside className="conversation-sidebar">
      <div className="conversation-sidebar__heading">
        <div><span>Your space</span><h1>Messages</h1></div>
        <Button size="icon" onClick={onCreate}>New conversation<MessageCirclePlus size={19} /></Button>
      </div>
      <label className="conversation-search"><Search size={16} /><input aria-label="Search conversations" placeholder="Search conversations…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <div className="conversation-filter" aria-label="Filter conversations">
        {(['all', 'unread', 'groups'] as const).map((value) => <button key={value} type="button" className={filter === value ? 'is-active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}
      </div>
      <div className="conversation-list">
        {conversations.isLoading && <Spinner label="Loading conversations…" className="sidebar-spinner" />}
        {conversations.isError && <div className="sidebar-error"><p>Conversations could not be loaded.</p><Button size="sm" variant="secondary" onClick={() => void conversations.refetch()}>Try again</Button></div>}
        {!conversations.isLoading && items.length === 0 && <div className="sidebar-empty"><UsersRound size={25} /><strong>{search ? 'No results found' : filter === 'unread' ? 'You are all caught up' : filter === 'groups' ? 'No groups yet' : 'No conversations yet'}</strong><p>{search ? 'Try a different search term.' : filter === 'unread' ? 'Unread conversations will appear here.' : filter === 'groups' ? 'Create a group to start chatting together.' : 'Start a conversation with someone.'}</p></div>}
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
