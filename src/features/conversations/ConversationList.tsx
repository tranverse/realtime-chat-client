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
    <aside className="flex h-full min-h-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <div><span className="text-xs font-medium uppercase tracking-wider text-slate-400">Conversations</span><h1 className="mt-0.5 text-2xl font-semibold tracking-tight">Messages</h1></div>
        <Button size="icon" onClick={onCreate}>New conversation<MessageCirclePlus size={19} /></Button>
      </div>
      <label className="mx-4 flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 text-slate-400 focus-within:ring-2 focus-within:ring-indigo-500/30"><Search size={16} /><input className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" aria-label="Search conversations" placeholder="Search conversations" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <div className="mx-4 mt-3 flex gap-1 border-b border-slate-100 pb-3" aria-label="Filter conversations">
        {(['all', 'unread', 'groups'] as const).map((value) => <button key={value} type="button" className={cn('rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors', filter === value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {conversations.isLoading && <Spinner label="Loading conversations…" className="py-10" />}
        {conversations.isError && <div className="m-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"><p className="mb-3">Conversations could not be loaded.</p><Button size="sm" variant="secondary" onClick={() => void conversations.refetch()}>Try again</Button></div>}
        {!conversations.isLoading && items.length === 0 && <div className="flex flex-col items-center px-5 py-12 text-center text-slate-400"><UsersRound size={25} /><strong className="mt-3 text-sm text-slate-700">{search ? 'No results found' : filter === 'unread' ? 'You are all caught up' : filter === 'groups' ? 'No groups yet' : 'No conversations yet'}</strong><p className="mt-1 text-xs leading-5">{search ? 'Try a different search term.' : filter === 'unread' ? 'Unread conversations will appear here.' : filter === 'groups' ? 'Create a group to start chatting together.' : 'Start a conversation with someone.'}</p></div>}
        {items.map((conversation) => {
          const name = getConversationName(conversation, user?.id)
          return <NavLink key={conversation.id} to={`/chat/${conversation.id}`} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-3 transition-colors', isActive ? 'bg-indigo-50 text-indigo-950' : 'hover:bg-slate-50')}>
            <Avatar name={name} src={getConversationAvatar(conversation, user?.id)} size="md" />
            <span className="min-w-0 flex-1"><span className="flex items-baseline gap-2"><strong className={cn('min-w-0 flex-1 truncate text-sm', conversation.unreadCount > 0 ? 'font-semibold text-slate-950' : 'font-medium text-slate-800')}>{name}</strong><time className="shrink-0 text-[11px] text-slate-400">{formatConversationTime(conversation.lastMessage?.createdAt ?? conversation.updatedAt)}</time></span><span className="mt-1 flex items-center gap-2"><small className={cn('min-w-0 flex-1 truncate text-xs', conversation.unreadCount > 0 ? 'font-medium text-slate-700' : 'text-slate-500')}>{lastMessageLabel(conversation, user)}</small>{conversation.unreadCount > 0 && <b className="grid min-w-5 place-items-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</b>}</span></span>
          </NavLink>
        })}
      </div>
    </aside>
  )
}
