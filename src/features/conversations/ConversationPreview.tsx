import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Info, MessageCircleHeart } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../auth/useAuth'
import { conversationApi } from './conversationApi'
import { getConversationAvatar, getConversationName } from './conversationUtils'
import { ConversationDetailsModal } from './ConversationDetailsModal'

export function ConversationPreview({ conversationId }: { conversationId: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const conversation = useQuery({ queryKey: ['conversation', conversationId], queryFn: () => conversationApi.detail(conversationId) })
  if (conversation.isLoading) return <Spinner label="Opening conversation…" className="stage-spinner" />
  if (!conversation.data) return <EmptyState icon={<MessageCircleHeart size={27} />} title="Conversation unavailable" description="It may have been removed or you may no longer be a member." action={<Button variant="secondary" onClick={() => navigate('/')}>Back to messages</Button>} />
  const name = getConversationName(conversation.data, user?.id)
  return <div className="conversation-preview"><header><Button size="icon" variant="ghost" className="mobile-back" onClick={() => navigate('/')}>Back<ArrowLeft size={19} /></Button><Avatar name={name} src={getConversationAvatar(conversation.data, user?.id)} size="md" /><div><h2>{name}</h2><p>{conversation.data.type === 'GROUP' ? `${conversation.data.memberCount} members` : 'Direct conversation'}</p></div><Button size="icon" variant="ghost" onClick={() => setDetailsOpen(true)}>Conversation info<Info size={19} /></Button></header><EmptyState icon={<MessageCircleHeart size={27} />} title="Ready for your next message" description="Message history and realtime delivery are being connected in the next feature branch." /><ConversationDetailsModal conversation={conversation.data} open={detailsOpen} onClose={() => setDetailsOpen(false)} /></div>
}
