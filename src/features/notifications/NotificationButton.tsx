import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Bell, Image } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import type { PageResponse, Conversation } from '@/types/api'
import { useAuth } from '../auth/useAuth'
import { conversationApi } from '../conversations/conversationApi'
import { formatConversationTime, getConversationAvatar, getConversationName, lastMessageLabel } from '../conversations/conversationUtils'
import { useInboxRealtime } from './useInboxRealtime'

export function NotificationButton() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const conversations = useQuery({ queryKey: ['conversations'], queryFn: () => conversationApi.list(), refetchInterval: 15_000 })
  const unread = (conversations.data?.items ?? []).filter((conversation) => conversation.unreadCount > 0)
  const unreadCount = unread.reduce((total, conversation) => total + conversation.unreadCount, 0)
  useInboxRealtime((conversations.data?.items ?? []).map((conversation) => conversation.id), () => {
    void queryClient.invalidateQueries({ queryKey: ['conversations'] })
  })

  useEffect(() => {
    function close(event: MouseEvent) { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function select(conversation: Conversation) {
    queryClient.setQueryData<PageResponse<Conversation>>(['conversations'], (current) => current ? { ...current, items: current.items.map((item) => item.id === conversation.id ? { ...item, unreadCount: 0 } : item) } : current)
    setOpen(false)
    navigate(`/chat/${conversation.id}`)
  }

  return <div className="relative" ref={rootRef}>
    <button type="button" className={open ? 'relative grid size-10 place-items-center rounded-xl bg-slate-800 text-white' : 'relative grid size-10 place-items-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white'} aria-label="Notifications" aria-expanded={open} title="Notifications" onClick={() => setOpen((value) => !value)}><Bell size={19} /><span className="sr-only">Notifications</span>{unreadCount > 0 && <b className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-semibold text-white">{unreadCount > 99 ? '99+' : unreadCount}</b>}</button>
    {open && <section className="fixed left-3 right-3 top-16 z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:left-auto sm:right-auto sm:w-[380px] md:left-[62px] md:top-[116px]" aria-label="Notifications panel">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><strong className="text-sm text-slate-950">Notifications</strong><small className="text-xs text-slate-400">{unreadCount ? `${unreadCount} unread` : 'All caught up'}</small></header>
      <div className="max-h-96 overflow-y-auto p-2">{conversations.isLoading && <p className="p-6 text-center text-sm text-slate-400">Loading notifications…</p>}{!conversations.isLoading && unread.length === 0 && <p className="flex flex-col items-center gap-2 p-8 text-center text-sm text-slate-400"><Bell size={20} />You have no unread messages.</p>}{unread.map((conversation) => {
        const name = getConversationName(conversation, user?.id)
        const image = conversation.lastMessage?.type === 'IMAGE'
        return <button type="button" className="flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" key={conversation.id} onClick={() => select(conversation)}>
          <Avatar name={name} src={getConversationAvatar(conversation, user?.id)} size="sm" />
          <span className="min-w-0 flex-1"><strong className="block truncate text-xs font-semibold text-slate-800">{conversation.type === 'GROUP' ? `${name} has new messages` : `${name} sent you a message`}</strong><small className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">{image && <Image size={12} />}{lastMessageLabel(conversation, user)}</small><time className="mt-1 block text-[10px] text-slate-400">{formatConversationTime(conversation.lastMessage?.createdAt ?? conversation.updatedAt)}</time></span>
          <i className="grid min-w-5 place-items-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold not-italic text-white" aria-label={`${conversation.unreadCount} unread`}>{conversation.unreadCount}</i>
        </button>
      })}</div>
    </section>}
  </div>
}
