import { MessageCircleHeart } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppRail } from '../components/layout/AppRail'
import { EmptyState } from '../components/ui/EmptyState'
import { ConversationList } from '../features/conversations/ConversationList'
import { ConversationPreview } from '../features/conversations/ConversationPreview'
import { CreateConversationModal } from '../features/conversations/CreateConversationModal'
import { ProfileModal } from '../features/profile/ProfileModal'

export function ChatWorkspacePage() {
  const { conversationId } = useParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  return (
    <main className={conversationId ? 'chat-workspace has-conversation' : 'chat-workspace'}>
      <AppRail onProfile={() => setProfileOpen(true)} />
      <ConversationList onCreate={() => setCreateOpen(true)} />
      <section className="conversation-stage">
        {conversationId ? <ConversationPreview conversationId={conversationId} /> : <EmptyState icon={<MessageCircleHeart size={27} />} title="Choose a conversation" description="Realtime messages, attachments, and read receipts will appear here." />}
      </section>
      <CreateConversationModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </main>
  )
}
