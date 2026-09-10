import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { ChatMessage } from '@/types/api'

interface DeleteMessageDialogProps {
  message: ChatMessage | null
  deleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteMessageDialog({ message, deleting, onClose, onConfirm }: DeleteMessageDialogProps) {
  return <Modal
    open={message !== null}
    onClose={() => { if (!deleting) onClose() }}
    title="Delete message?"
    description="This action removes the message for everyone in this conversation."
    footer={<>
      <Button variant="secondary" disabled={deleting} onClick={onClose}>Cancel</Button>
      <Button variant="danger" loading={deleting} disabled={deleting} leftIcon={<FiTrash2 />} onClick={onConfirm}>Delete message</Button>
    </>}
  >
    <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-red-700">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-lg shadow-sm"><FiAlertTriangle /></span>
      <div className="min-w-0">
        <strong className="block text-sm">This cannot be undone</strong>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-red-600">{message?.content || (message?.attachments.length ? 'Image message' : 'Message')}</p>
      </div>
    </div>
  </Modal>
}
