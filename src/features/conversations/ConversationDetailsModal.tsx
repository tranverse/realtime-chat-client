import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Crown, Link2, LogOut, Search, ShieldCheck, UserMinus, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { getErrorMessage } from '../../lib/errors'
import type { Conversation, InviteLink, MemberRole } from '../../types/api'
import { useAuth } from '../auth/useAuth'
import { userApi } from '../profile/userApi'
import { conversationApi } from './conversationApi'
import { getConversationName, getConversationParticipantsLabel } from './conversationUtils'

export function ConversationDetailsModal({ conversation, open, onClose }: { conversation: Conversation; open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [name, setName] = useState(conversation.name ?? '')
  const [avatar, setAvatar] = useState(conversation.avatar ?? '')
  const [memberSearch, setMemberSearch] = useState('')
  const [invite, setInvite] = useState<InviteLink | null>(null)
  const debouncedSearch = useDebouncedValue(memberSearch)
  const canManage = conversation.myRole === 'OWNER' || conversation.myRole === 'ADMIN'

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['conversation', conversation.id] }),
      queryClient.invalidateQueries({ queryKey: ['conversations'] }),
    ])
  }
  const action = useMutation({
    mutationFn: async (operation: () => Promise<unknown>) => operation(),
    onSuccess: refresh,
    onError: (error) => toast.error(getErrorMessage(error)),
  })
  const users = useQuery({ queryKey: ['users', 'member-search', debouncedSearch], queryFn: () => userApi.search(debouncedSearch), enabled: open && canManage && debouncedSearch.length > 1 })
  const requests = useQuery({ queryKey: ['join-requests', conversation.id], queryFn: () => conversationApi.joinRequests(conversation.id), enabled: open && canManage && conversation.type === 'GROUP' })

  async function createInvite() {
    try {
      const created = await conversationApi.createInvite(conversation.id, true, 72)
      setInvite(created)
      await navigator.clipboard.writeText(`${window.location.origin}/invite/${created.code}`)
      toast.success('Invite link copied to your clipboard.')
    } catch (error) { toast.error(getErrorMessage(error)) }
  }

  function updateRole(memberId: string, role: MemberRole) {
    action.mutate(() => conversationApi.updateRole(conversation.id, memberId, role))
  }

  const activeMembers = conversation.members?.filter((member) => member.status === 'ACTIVE') ?? []

  return (
    <Modal open={open} onClose={onClose} title="Conversation details" description="Members, permissions, and invitation settings." wide>
      <div className="details-stack">
        <section className="details-identity">
          <Avatar name={getConversationName(conversation, user?.id)} src={avatar || conversation.avatar} size="xl" />
          <div><h3>{getConversationName(conversation, user?.id)}</h3><p>{getConversationParticipantsLabel(conversation, user?.id)}</p>{conversation.type === 'GROUP' && <span>{conversation.myRole.toLowerCase()}</span>}</div>
        </section>

        {conversation.type === 'GROUP' && canManage && <section className="details-section">
          <div className="details-section__heading"><div><h3>Group profile</h3><p>Keep the name and image recognizable.</p></div></div>
          <div className="form-grid"><FormField label="Group name" maxLength={50} value={name} onChange={(event) => setName(event.target.value)} /><FormField label="Avatar URL" value={avatar} onChange={(event) => setAvatar(event.target.value)} /></div>
          <Button size="sm" loading={action.isPending} onClick={() => action.mutate(() => conversationApi.update(conversation.id, { name, avatar }))}>Save group profile</Button>
        </section>}

        {conversation.type === 'GROUP' && canManage && <section className="details-section">
          <div className="details-section__heading"><div><h3>Invite people</h3><p>Links expire in 72 hours and require approval.</p></div><Button size="sm" variant="secondary" leftIcon={<Link2 size={14} />} onClick={() => void createInvite()}>Create link</Button></div>
          {invite && <div className="invite-result"><code>{`${window.location.origin}/invite/${invite.code}`}</code><Button size="icon" variant="ghost" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.code}`)}>Copy invite<Copy size={15} /></Button><Button size="icon" variant="ghost" onClick={() => { void conversationApi.revokeInvite(conversation.id, invite.id); setInvite(null) }}>Revoke invite<X size={15} /></Button></div>}
          <label className="member-search"><Search size={15} /><input placeholder="Search people to add…" value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} /></label>
          {users.data && <div className="member-results">{users.data.items.filter((candidate) => !activeMembers.some((member) => member.user.id === candidate.id)).slice(0, 5).map((candidate) => <button key={candidate.id} onClick={() => action.mutate(() => conversationApi.addMembers(conversation.id, [candidate.id]))}><Avatar name={candidate.name} src={candidate.avatar} size="xs" /><span>{candidate.name}</span><UserPlus size={14} /></button>)}</div>}
        </section>}

        <section className="details-section">
          <div className="details-section__heading"><div><h3>{conversation.type === 'PRIVATE' ? 'Participants' : 'Members'}</h3><p>{conversation.type === 'PRIVATE' ? getConversationParticipantsLabel(conversation, user?.id) : `${activeMembers.length} active in this conversation.`}</p></div></div>
          <div className="member-list">{activeMembers.map((member) => {
            const isMe = member.user.id === user?.id
            return <div key={member.id} className="member-row"><Avatar name={member.user.name} src={member.user.avatar} size="sm" /><span><strong>{member.user.name}{isMe ? ' (you)' : ''}</strong><small>@{member.user.username || member.user.email}</small></span><i className={`role-badge role-badge--${member.role.toLowerCase()}`}>{member.role === 'OWNER' && <Crown size={11} />}{member.role === 'ADMIN' && <ShieldCheck size={11} />}{member.role}</i>{canManage && !isMe && member.role !== 'OWNER' && <div className="member-actions">{conversation.myRole === 'OWNER' && <select aria-label={`Role for ${member.user.name}`} value={member.role} onChange={(event) => updateRole(member.user.id, event.target.value as MemberRole)}><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select>}{conversation.myRole === 'OWNER' && <Button size="icon" variant="ghost" onClick={() => action.mutate(() => conversationApi.transferOwnership(conversation.id, member.user.id))}>Transfer ownership<Crown size={14} /></Button>}<Button size="icon" variant="ghost" onClick={() => action.mutate(() => conversationApi.removeMember(conversation.id, member.user.id))}>Remove member<UserMinus size={14} /></Button></div>}</div>
          })}</div>
        </section>

        {canManage && requests.data && requests.data.length > 0 && <section className="details-section"><div className="details-section__heading"><div><h3>Join requests</h3><p>Approve the people you recognize.</p></div></div><div className="request-list">{requests.data.map((request) => <div key={request.id}><Avatar name={request.requestedBy.name} src={request.requestedBy.avatar} size="sm" /><span><strong>{request.requestedBy.name}</strong><small>{request.message || 'No message included'}</small></span><Button size="icon" variant="ghost" onClick={() => action.mutate(async () => { await conversationApi.reviewJoinRequest(conversation.id, request.id, false); await requests.refetch() })}>Reject<X size={15} /></Button><Button size="icon" onClick={() => action.mutate(async () => { await conversationApi.reviewJoinRequest(conversation.id, request.id, true); await requests.refetch() })}>Approve<Check size={15} /></Button></div>)}</div></section>}

        {conversation.type === 'GROUP' && conversation.myRole !== 'OWNER' && <section className="danger-zone"><div><h3>Leave conversation</h3><p>You will stop receiving messages from this group.</p></div><Button variant="danger" leftIcon={<LogOut size={15} />} onClick={() => action.mutate(async () => { await conversationApi.leave(conversation.id); onClose(); navigate('/') })}>Leave group</Button></section>}
      </div>
    </Modal>
  )
}
