import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { BrandMark } from '../components/brand/BrandMark'
import { Button } from '../components/ui/Button'
import { TextAreaField } from '../components/ui/FormField'
import { conversationApi } from '../features/conversations/conversationApi'
import { getErrorMessage } from '../lib/errors'

export function JoinInvitePage() {
  const { code = '' } = useParams()
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const join = useMutation({
    mutationFn: () => conversationApi.join(code, message),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] })
      if (result.joined && result.conversation) { toast.success('You joined the conversation.'); navigate(`/chat/${result.conversation.id}`) }
      else { toast.success('Your join request has been sent.'); navigate('/') }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
  return <main className="invite-page"><BrandMark /><section><div><Link2 size={26} /></div><span>Conversation invite</span><h1>Join the conversation on Luma</h1><p>You received an invitation link. Add a short note in case the group requires approval.</p><TextAreaField label="Message (optional)" maxLength={500} placeholder="Hi, I would love to join…" value={message} onChange={(event) => setMessage(event.target.value)} /><Button size="lg" loading={join.isPending} onClick={() => join.mutate()}>Join conversation</Button><button onClick={() => navigate('/')}>Maybe later</button></section></main>
}
