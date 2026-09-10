import { ImagePlus, Link2, SendHorizontal, Smile, X } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { getErrorMessage } from '../../lib/errors'
import type { ChatMessage, CreateMessagePayload } from '../../types/api'
import { validateChatImage } from './imageUpload'
import { mediaApi } from './mediaApi'

interface MessageComposerProps {
  replyingTo: ChatMessage | null
  onCancelReply: () => void
  onSend: (payload: CreateMessagePayload) => Promise<void>
  onTyping: (typing: boolean) => void
  disabled?: boolean
}

export function MessageComposer({ replyingTo, onCancelReply, onSend, onTyping, disabled }: MessageComposerProps) {
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const typingTimer = useRef<number | undefined>(undefined)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => () => { window.clearTimeout(typingTimer.current); onTyping(false) }, [onTyping])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  function changed(value: string) {
    setContent(value)
    onTyping(true)
    window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => onTyping(false), 1_500)
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (!selected) return
    const validationError = validateChatImage(selected)
    if (validationError) { toast.error(validationError); return }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImage(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  function removeImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImage(null)
    setPreviewUrl(null)
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!content.trim() && !image) return
    setSending(true)
    try {
      const uploaded = image ? await mediaApi.uploadImage(image) : null
      await onSend({
        content: content.trim(),
        type: uploaded ? 'IMAGE' : 'TEXT',
        replyToMessageId: replyingTo?.id ?? null,
        attachments: uploaded ? [{ fileUrl: uploaded.fileUrl, fileType: uploaded.fileType, fileSize: uploaded.fileSize }] : [],
      })
      setContent('')
      removeImage()
      onCancelReply()
      onTyping(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'The image could not be uploaded. Please try again.'))
    } finally {
      setSending(false)
    }
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit() }
  }

  return <div className="composer-wrap">
    {replyingTo && <div className="composer-reply"><ReplyIcon /><span><strong>Replying to {replyingTo.sender.name}</strong><small>{replyingTo.content || 'Attachment'}</small></span><Button size="icon" variant="ghost" onClick={onCancelReply}>Cancel reply<X size={14} /></Button></div>}
    {image && previewUrl && <div className="image-upload-preview"><img src={previewUrl} alt="Selected upload" /><span><strong>{image.name}</strong><small>{sending ? 'Uploading securely to Cloudinary…' : 'Ready to upload'}</small></span><Button size="icon" variant="ghost" disabled={sending} onClick={removeImage}>Remove image<X size={14} /></Button></div>}
    <form className="message-composer" onSubmit={submit}>
      <input ref={fileInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseImage} />
      <Button type="button" size="icon" variant="ghost" disabled={disabled || sending} onClick={() => fileInput.current?.click()}>Upload an image<ImagePlus size={19} /></Button>
      <textarea rows={1} maxLength={5000} aria-label="Message" placeholder="Write a message…" value={content} disabled={disabled || sending} onChange={(event) => changed(event.target.value)} onKeyDown={keyDown} />
      <Button type="button" size="icon" variant="ghost" disabled={sending} onClick={() => setContent((value) => `${value} ✨`)}>Add emoji<Smile size={19} /></Button>
      <Button type="submit" size="icon" loading={sending} disabled={disabled || sending || (!content.trim() && !image)}>Send<SendHorizontal size={18} /></Button>
    </form>
    <p className="composer-hint"><ImagePlus size={11} /> JPEG, PNG, WebP, or GIF · 10 MB maximum · stored securely on Cloudinary</p>
  </div>
}

function ReplyIcon() { return <span className="composer-reply__icon"><Link2 size={14} /></span> }
