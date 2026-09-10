import { Download, FileText, MoreHorizontal, Pencil, Reply, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import type { ChatMessage } from '../../types/api'
import { ImageMessage } from './ImageMessage'

interface Props {
  message: ChatMessage
  mine: boolean
  canDelete: boolean
  receipt: string | null
  onReply: () => void
  onEdit: (content: string) => void
  onDelete: () => void
  showAuthor?: boolean
}

export function MessageBubble({ message, mine, canDelete, receipt, onReply, onEdit, onDelete, showAuthor = true }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content ?? '')
  const deleted = message.content === null && message.attachments.length === 0

  return (
    <article className={mine ? 'message-row is-mine' : 'message-row'} data-sequence={message.sequence}>
      {!mine && showAuthor && <span className="message-author">{message.sender.name}</span>}
      <div className={`${deleted ? 'message-bubble is-deleted' : 'message-bubble'}${message.attachments.some((attachment) => attachment.fileType.startsWith('image/')) && !message.content ? ' is-image-only' : ''}`}>
        {message.replyTo && <div className="reply-quote"><strong>{message.replyTo.sender.name}</strong><span>{message.replyTo.content ?? 'Deleted message'}</span></div>}
        {editing ? <form className="message-edit" onSubmit={(event) => { event.preventDefault(); if (draft.trim()) { onEdit(draft.trim()); setEditing(false) } }}><input autoFocus maxLength={5000} value={draft} onChange={(event) => setDraft(event.target.value)} /><button type="button" onClick={() => { setDraft(message.content ?? ''); setEditing(false) }}>Cancel</button><button type="submit">Save</button></form> : <>
          {deleted ? <p>Message deleted</p> : message.content && <p>{message.content}</p>}
          <ImageMessage attachments={message.attachments} />
          {message.attachments.some((attachment) => !attachment.fileType.startsWith('image/')) && <div className="message-attachments">{message.attachments.filter((attachment) => !attachment.fileType.startsWith('image/')).map((attachment) => <a key={attachment.id ?? attachment.fileUrl} href={attachment.fileUrl} target="_blank" rel="noreferrer" className="file-attachment"><FileText size={20} /><span><strong>{attachment.fileUrl.split('/').at(-1) || 'Attachment'}</strong><small>{attachment.fileType}{attachment.fileSize ? ` · ${formatSize(attachment.fileSize)}` : ''}</small></span><Download size={16} /></a>)}</div>}
        </>}
        <time>{new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date(message.createdAt))}{message.editedAt && ' · edited'}</time>
      </div>
      {receipt && <span className="message-receipt">{receipt}</span>}
      {!deleted && <div className="message-tools"><Button size="icon" variant="ghost" onClick={onReply}>Reply<Reply size={14} /></Button><Button size="icon" variant="ghost" onClick={() => setMenuOpen((value) => !value)}>More actions<MoreHorizontal size={15} /></Button>{menuOpen && <div className="message-menu">{mine && <button onClick={() => { setEditing(true); setMenuOpen(false) }}><Pencil size={13} /> Edit</button>}{canDelete && <button className="is-danger" onClick={() => { onDelete(); setMenuOpen(false) }}><Trash2 size={13} /> Delete</button>}</div>}</div>}
    </article>
  )
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
