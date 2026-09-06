import { FileImage, Link2, Paperclip, SendHorizontal, Smile, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '../../components/ui/Button'
import type { ChatMessage, CreateMessagePayload } from '../../types/api'

export function MessageComposer({ replyingTo, onCancelReply, onSend, onTyping, disabled }: { replyingTo: ChatMessage | null; onCancelReply: () => void; onSend: (payload: CreateMessagePayload) => Promise<void>; onTyping: (typing: boolean) => void; disabled?: boolean }) {
  const [content, setContent] = useState('')
  const [attachmentOpen, setAttachmentOpen] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('image/png')
  const [sending, setSending] = useState(false)
  const typingTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => { window.clearTimeout(typingTimer.current); onTyping(false) }, [onTyping])

  function changed(value: string) {
    setContent(value)
    onTyping(true)
    window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => onTyping(false), 1_500)
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    const url = fileUrl.trim()
    if (!content.trim() && !url) return
    setSending(true)
    const type = url ? (fileType.startsWith('image/') ? 'IMAGE' : 'FILE') : 'TEXT'
    try {
      await onSend({ content: content.trim(), type, replyToMessageId: replyingTo?.id ?? null, attachments: url ? [{ fileUrl: url, fileType, fileSize: null }] : [] })
      setContent(''); setFileUrl(''); setAttachmentOpen(false); onCancelReply(); onTyping(false)
    } finally { setSending(false) }
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit() }
  }

  return <div className="composer-wrap">{replyingTo && <div className="composer-reply"><ReplyIcon /><span><strong>Replying to {replyingTo.sender.name}</strong><small>{replyingTo.content || 'Attachment'}</small></span><Button size="icon" variant="ghost" onClick={onCancelReply}>Cancel reply<X size={14} /></Button></div>}{attachmentOpen && <div className="attachment-form"><Link2 size={16} /><input type="url" placeholder="Paste a public file URL…" value={fileUrl} onChange={(event) => setFileUrl(event.target.value)} /><select value={fileType} onChange={(event) => setFileType(event.target.value)}><option value="image/png">Image (PNG)</option><option value="image/jpeg">Image (JPEG)</option><option value="application/pdf">PDF document</option><option value="application/octet-stream">Other file</option></select><Button size="icon" variant="ghost" onClick={() => { setAttachmentOpen(false); setFileUrl('') }}>Remove attachment<X size={14} /></Button></div>}<form className="message-composer" onSubmit={submit}><Button type="button" size="icon" variant="ghost" onClick={() => setAttachmentOpen((value) => !value)}>Attach a URL<Paperclip size={19} /></Button><textarea rows={1} maxLength={5000} aria-label="Message" placeholder="Write a message…" value={content} disabled={disabled} onChange={(event) => changed(event.target.value)} onKeyDown={keyDown} /><Button type="button" size="icon" variant="ghost" onClick={() => setContent((value) => `${value} ✨`)}>Add emoji<Smile size={19} /></Button><Button type="submit" size="icon" loading={sending} disabled={disabled || (!content.trim() && !fileUrl.trim())}>Send<SendHorizontal size={18} /></Button></form><p className="composer-hint"><FileImage size={11} /> Attachments use public URLs because binary upload is intentionally outside the backend MVP.</p></div>
}

function ReplyIcon() { return <span className="composer-reply__icon"><Link2 size={14} /></span> }
