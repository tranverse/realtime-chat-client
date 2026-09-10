import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { FiBell, FiImage } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../../components/ui/Avatar'
import type { PageResponse, Conversation } from '../../types/api'
import { useAuth } from '../auth/useAuth'
import { conversationApi } from '../conversations/conversationApi'
import { formatConversationTime, getConversationAvatar, getConversationName, lastMessageLabel } from '../conversations/conversationUtils'

export function NotificationButton() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const conversations = useQuery({ queryKey: ['conversations'], queryFn: () => conversationApi.list(), refetchInterval: 15_000 })
  const unread = (conversations.data?.items ?? []).filter((conversation) => conversation.unreadCount > 0)
  const unreadCount = unread.reduce((total, conversation) => total + conversation.unreadCount, 0)

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

  return <div className="notification-root" ref={rootRef}>
    <button type="button" className={open ? 'is-active' : ''} aria-label="Notifications" aria-expanded={open} title="Notifications" onClick={() => setOpen((value) => !value)}><FiBell /><span>Notifications</span>{unreadCount > 0 && <b>{unreadCount > 99 ? '99+' : unreadCount}</b>}</button>
    {open && <section className="notification-panel" aria-label="Notifications panel">
      <header><strong>Notifications</strong><small>{unreadCount ? `${unreadCount} unread` : 'All caught up'}</small></header>
      <div>{conversations.isLoading && <p className="notification-empty">Loading notifications…</p>}{!conversations.isLoading && unread.length === 0 && <p className="notification-empty"><FiBell />You have no unread messages.</p>}{unread.map((conversation) => {
        const name = getConversationName(conversation, user?.id)
        const image = conversation.lastMessage?.type === 'IMAGE'
        return <button type="button" className="notification-item is-unread" key={conversation.id} onClick={() => select(conversation)}>
          <Avatar name={name} src={getConversationAvatar(conversation, user?.id)} size="sm" />
          <span><strong>{conversation.type === 'GROUP' ? `${name} has new messages` : `${name} sent you a message`}</strong><small>{image && <FiImage />}{lastMessageLabel(conversation, user)}</small><time>{formatConversationTime(conversation.lastMessage?.createdAt ?? conversation.updatedAt)}</time></span>
          <i aria-label={`${conversation.unreadCount} unread`}>{conversation.unreadCount}</i>
        </button>
      })}</div>
    </section>}
  </div>
}
