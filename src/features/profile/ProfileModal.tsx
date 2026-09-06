import { useMutation } from '@tanstack/react-query'
import { LogOut, ShieldOff } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { Modal } from '../../components/ui/Modal'
import { getErrorMessage } from '../../lib/errors'
import { useAuth } from '../auth/useAuth'
import { userApi } from './userApi'

export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, refreshUser, logout, logoutAll } = useAuth()
  const [form, setForm] = useState(() => ({ name: user?.name ?? '', username: user?.username ?? '', avatar: user?.avatar ?? '', phone: user?.phone ?? '', dob: user?.dob ?? '' }))

  const update = useMutation({
    mutationFn: () => userApi.update(form),
    onSuccess: async () => { await refreshUser(); toast.success('Your profile has been updated.'); onClose() },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  if (!user) return null
  const bind = (key: keyof typeof form) => ({ value: form[key], onChange: (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [key]: event.target.value })) })

  return (
    <Modal open={open} onClose={onClose} title="Your profile" description="Update how other people see you." wide footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={update.isPending} onClick={() => update.mutate()}>Save changes</Button></>}>
      <div className="profile-intro"><Avatar name={form.name || user.name} src={form.avatar} size="xl" /><div><strong>{user.name}</strong><span>{user.email}</span><small>Signed in with {user.provider === 'GOOGLE' ? 'Google' : 'email'}</small></div></div>
      <div className="profile-form">
        <div className="form-grid"><FormField label="Full name" minLength={2} maxLength={120} {...bind('name')} /><FormField label="Username" minLength={3} maxLength={50} placeholder="alexmorgan" {...bind('username')} /></div>
        <FormField label="Profile photo (URL)" type="url" placeholder="https://…" {...bind('avatar')} />
        <div className="form-grid"><FormField label="Phone number" type="tel" maxLength={20} placeholder="+1…" {...bind('phone')} /><FormField label="Date of birth" type="date" {...bind('dob')} /></div>
      </div>
      <div className="session-actions"><div><strong>Signed-in sessions</strong><p>Sign out on this device or revoke every refresh token.</p></div><div><Button size="sm" variant="secondary" leftIcon={<LogOut size={14} />} onClick={() => void logout()}>Sign out</Button><Button size="sm" variant="danger" leftIcon={<ShieldOff size={14} />} onClick={() => void logoutAll()}>Sign out all</Button></div></div>
    </Modal>
  )
}
