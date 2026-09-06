import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Search, UserRoundPlus, UsersRound, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { getErrorMessage } from '../../lib/errors'
import type { UserSummary } from '../../types/api'
import { userApi } from '../profile/userApi'
import { conversationApi } from './conversationApi'

export function CreateConversationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState<'PRIVATE' | 'GROUP'>('PRIVATE')
  const [query, setQuery] = useState('')
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<UserSummary[]>([])
  const debouncedQuery = useDebouncedValue(query)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const users = useQuery({
    queryKey: ['users', 'search', debouncedQuery],
    queryFn: () => userApi.search(debouncedQuery),
    enabled: open,
  })

  const create = useMutation({
    mutationFn: () => conversationApi.create({ type, name: type === 'GROUP' ? name.trim() : undefined, memberIds: selected.map((user) => user.id), maxMembers: type === 'GROUP' ? 100 : undefined }),
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast.success(type === 'GROUP' ? 'Your group is ready.' : 'Your conversation is ready.')
      onClose()
      setSelected([]); setName(''); setQuery('')
      navigate(`/chat/${conversation.id}`)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  function toggle(user: UserSummary) {
    if (type === 'PRIVATE') { setSelected([user]); return }
    setSelected((current) => current.some((item) => item.id === user.id) ? current.filter((item) => item.id !== user.id) : [...current, user])
  }

  const valid = selected.length >= 1 && (type === 'PRIVATE' || name.trim().length > 0)

  return (
    <Modal open={open} onClose={onClose} title="New conversation" description="Find someone or create a space for the whole group." wide
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={create.isPending} disabled={!valid} onClick={() => create.mutate()}>Start conversation</Button></>}>
      <div className="type-switch">
        <button className={type === 'PRIVATE' ? 'is-active' : ''} onClick={() => { setType('PRIVATE'); setSelected((items) => items.slice(0, 1)) }}><UserRoundPlus size={18} /> Direct message</button>
        <button className={type === 'GROUP' ? 'is-active' : ''} onClick={() => setType('GROUP')}><UsersRound size={18} /> New group</button>
      </div>
      {type === 'GROUP' && <FormField label="Group name" maxLength={50} placeholder="For example: Product Team" value={name} onChange={(event) => setName(event.target.value)} />}
      {selected.length > 0 && <div className="selected-users">{selected.map((user) => <button key={user.id} onClick={() => toggle(user)}><Avatar size="xs" name={user.name} src={user.avatar} />{user.name}<X size={13} /></button>)}</div>}
      <div className="people-picker">
        <div className="people-picker__search"><Search size={16} /><input aria-label="Search people" placeholder="Search by name, username, or email…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="people-picker__list">
          {users.isLoading && <p className="picker-status">Finding people…</p>}
          {users.data?.items.map((user) => {
            const active = selected.some((item) => item.id === user.id)
            return <button key={user.id} className={active ? 'is-selected' : ''} onClick={() => toggle(user)}>
              <Avatar name={user.name} src={user.avatar} size="sm" />
              <span><strong>{user.name}</strong><small>@{user.username || user.email}</small></span>
              <i>{active && <Check size={14} />}</i>
            </button>
          })}
          {!users.isLoading && users.data?.items.length === 0 && <p className="picker-status">No matching people found.</p>}
        </div>
      </div>
    </Modal>
  )
}
