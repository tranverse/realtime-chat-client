import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowLeft, Info, Wifi, WifiOff } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { getErrorMessage } from '../../lib/errors'
import type { ChatEvent, ChatMessage, CreateMessagePayload, TypingEvent } from '../../types/api'
import { useAuth } from '../auth/useAuth'
import { ConversationDetailsModal } from '../conversations/ConversationDetailsModal'
import { conversationApi } from '../conversations/conversationApi'
import { getConversationAvatar, getConversationName } from '../conversations/conversationUtils'
import { messageApi } from './messageApi'
import { applyMessageEvent, type MessagePages } from './messageCache'
import { MessageBubble } from './MessageBubble'
import { MessageComposer } from './MessageComposer'
import { receiptLabel, type ReadSequences } from './readReceipts'
import { useConversationRealtime } from './useConversationRealtime'
import { useMessageScroll } from './useMessageScroll'

export function ChatConversation({ conversationId }: { conversationId: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [readSequences, setReadSequences] = useState<ReadSequences>({})
  const lastReadRef = useRef<string | null>(null)
  const typingTimers = useRef(new Map<string, number>())

  const conversation = useQuery({ queryKey: ['conversation', conversationId], queryFn: () => conversationApi.detail(conversationId) })
  const history = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) => messageApi.history(conversationId, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page) => page.hasNext ? Math.min(...page.items.map((message) => message.sequence)) : undefined,
  })

  const onRealtimeEvent = useCallback((event: ChatEvent | TypingEvent) => {
    if (event.type === 'TYPING') {
      if (event.actorUserId === user?.id) return
      setTypingUsers((current) => { const next = new Set(current); if (event.typing) next.add(event.actorUserId); else next.delete(event.actorUserId); return next })
      window.clearTimeout(typingTimers.current.get(event.actorUserId))
      if (event.typing) typingTimers.current.set(event.actorUserId, window.setTimeout(() => setTypingUsers((current) => { const next = new Set(current); next.delete(event.actorUserId); return next }), 2_500))
      return
    }
    if (event.type === 'MESSAGES_READ') {
      setReadSequences((current) => ({
        ...current,
        [event.actorUserId]: Math.max(current[event.actorUserId] ?? 0, event.sequence),
      }))
      return
    }
    queryClient.setQueryData<MessagePages>(['messages', conversationId], (current) => applyMessageEvent(current, event))
    void queryClient.invalidateQueries({ queryKey: ['conversations'] })
    void queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
  }, [conversationId, queryClient, user?.id])

  const onRealtimeConnected = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    void queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
    void queryClient.invalidateQueries({ queryKey: ['conversations'] })
  }, [conversationId, queryClient])

  const realtime = useConversationRealtime(
    conversationId,
    onRealtimeEvent,
    (error) => toast.error(error.message),
    onRealtimeConnected,
  )
  const messages = useMemo(() => (history.data?.pages.flatMap((page) => page.items) ?? []).sort((a, b) => a.sequence - b.sequence), [history.data])
  const newest = messages.at(-1)
  const {
    historyRef,
    bottomRef,
    unseenMessages,
    handleScroll,
    scrollToBottom,
    loadOlderPreservingPosition,
  } = useMessageScroll(newest?.id, newest?.sender.id === user?.id)

  useEffect(() => {
    if (!newest || newest.sender.id === user?.id || lastReadRef.current === newest.id) return
    lastReadRef.current = newest.id
    if (!realtime.sendRead(newest.id)) void messageApi.markRead(conversationId, newest.id)
  }, [conversationId, newest, realtime, user?.id])

  useEffect(() => () => { typingTimers.current.forEach((timer) => window.clearTimeout(timer)) }, [])

  const edit = useMutation({ mutationFn: ({ id, content }: { id: string; content: string }) => messageApi.edit(id, content), onError: (error) => toast.error(getErrorMessage(error)) })
  const remove = useMutation({ mutationFn: (id: string) => messageApi.remove(id), onError: (error) => toast.error(getErrorMessage(error)) })

  async function send(payload: CreateMessagePayload) {
    if (realtime.sendMessage(payload)) return
    try {
      const created = await messageApi.send(conversationId, payload)
      onRealtimeEvent({ type: 'MESSAGE_CREATED', conversationId, actorUserId: created.sender.id, messageId: created.id, sequence: created.sequence, message: created })
    } catch (error) { toast.error(getErrorMessage(error)); throw error }
  }

  if (conversation.isLoading || history.isLoading) return <Spinner label="Opening conversation…" className="stage-spinner" />
  if (!conversation.data) return <EmptyState icon={<WifiOff size={26} />} title="Conversation unavailable" description="It may have been removed or you may no longer be a member." action={<Button variant="secondary" onClick={() => navigate('/')}>Back to messages</Button>} />
  const name = getConversationName(conversation.data, user?.id)
  const canManage = conversation.data.myRole === 'OWNER' || conversation.data.myRole === 'ADMIN'
  const typingNames = conversation.data.members?.filter((member) => typingUsers.has(member.user.id)).map((member) => member.user.name.split(' ')[0]) ?? []

  return <div className="chat-conversation">
    <header className="chat-header"><Button size="icon" variant="ghost" className="mobile-back" onClick={() => navigate('/')}>Back<ArrowLeft size={19} /></Button><Avatar name={name} src={getConversationAvatar(conversation.data, user?.id)} size="md" /><div><h2>{name}</h2><p className={`connection-state is-${realtime.status}`}>{realtime.status === 'connected' ? <Wifi size={10} /> : <WifiOff size={10} />}{realtime.status === 'connected' ? (typingNames.length ? `${typingNames.join(', ')} typing…` : 'Connected') : realtime.status === 'connecting' ? 'Connecting…' : 'Offline · REST fallback enabled'}</p></div><Button size="icon" variant="ghost" onClick={() => setDetailsOpen(true)}>Conversation info<Info size={19} /></Button></header>
    <div className="message-history" ref={historyRef} onScroll={handleScroll}>
      {history.hasNextPage && <Button className="load-older" size="sm" variant="secondary" loading={history.isFetchingNextPage} leftIcon={<ArrowDown size={14} />} onClick={() => void loadOlderPreservingPosition(history.fetchNextPage)}>Load older messages</Button>}
      {messages.length === 0 && <EmptyState icon={<Wifi size={26} />} title="Say hello" description="This conversation is ready for its first message." />}
      <div className="message-list">{messages.map((message) => <MessageBubble key={message.id} message={message} mine={message.sender.id === user?.id} canDelete={message.sender.id === user?.id || canManage} receipt={receiptLabel(conversation.data, message.sender.id, user?.id, message.sequence, readSequences)} onReply={() => setReplyingTo(message)} onEdit={(content) => edit.mutate({ id: message.id, content })} onDelete={() => { if (window.confirm('Delete this message?')) remove.mutate(message.id) }} />)}<div ref={bottomRef} /></div>
      {unseenMessages > 0 && <Button className="new-message-notice" size="sm" leftIcon={<ArrowDown size={14} />} onClick={() => scrollToBottom()}>{unseenMessages} new {unseenMessages === 1 ? 'message' : 'messages'}</Button>}
    </div>
    {typingNames.length > 0 && <div className="typing-indicator"><span><i /><i /><i /></span>{typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing</div>}
    <MessageComposer replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)} onSend={send} onTyping={realtime.sendTyping} disabled={history.isError} />
    <ConversationDetailsModal conversation={conversation.data} open={detailsOpen} onClose={() => setDetailsOpen(false)} />
  </div>
}
