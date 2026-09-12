import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { FiImage, FiPaperclip, FiRefreshCw, FiSend, FiSmile, FiX } from 'react-icons/fi'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { getErrorMessage } from '@/lib/errors'
import type { ChatMessage, CreateMessagePayload } from '@/types/api'
import { limitChatImages, validateChatImage } from './imageUpload'
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
  const [uploading, setUploading] = useState(false)
  const [failedImages, setFailedImages] = useState<File[]>([])
  const typingTimer = useRef<number | undefined>(undefined)
  const imageInput = useRef<HTMLInputElement>(null)

  useEffect(() => () => { window.clearTimeout(typingTimer.current); onTyping(false) }, [onTyping])

  function changed(value: string) {
    setContent(value)
    onTyping(true)
    window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => onTyping(false), 1_500)
  }

  async function sendImages(files: File[]) {
    if (files.length === 0 || uploading) return
    setUploading(true)
    setFailedImages([])
    try {
      const results = await Promise.allSettled(files.map(mediaApi.uploadImage))
      const uploaded = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
      const rejectedFiles = files.filter((_, index) => results[index].status === 'rejected')
      if (uploaded.length === 0) throw new Error('None of the selected images could be uploaded.')
      await onSend({
        content: content.trim(),
        type: 'IMAGE',
        replyToMessageId: replyingTo?.id ?? null,
        attachments: uploaded.map(({ fileUrl, fileType, fileSize }) => ({ fileUrl, fileType, fileSize })),
      })
      setContent('')
      onCancelReply()
      onTyping(false)
      setFailedImages(rejectedFiles)
      if (rejectedFiles.length > 0) toast.warning(`${rejectedFiles.length} image${rejectedFiles.length === 1 ? '' : 's'} could not be uploaded. The others were sent.`)
    } catch (error) {
      setFailedImages(files)
      toast.error(getErrorMessage(error, 'Some images could not be sent. You can retry.'))
    } finally {
      setUploading(false)
    }
  }

  function chooseImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    const selection = limitChatImages(files)
    const error = selection.files.map(validateChatImage).find(Boolean)
    if (error) { toast.error(error); return }
    if (selection.omitted > 0) toast.warning(`Only 10 images can be sent at once. ${selection.omitted} image${selection.omitted === 1 ? ' was' : 's were'} not selected.`)
    void sendImages(selection.files)
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!content.trim() || uploading) return
    try {
      await onSend({ content: content.trim(), type: 'TEXT', replyToMessageId: replyingTo?.id ?? null, attachments: [] })
      setContent('')
      onCancelReply()
      onTyping(false)
    } catch (error) { toast.error(getErrorMessage(error)) }
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit() }
  }

  return <div className="composer-wrap">
    {replyingTo && <div className="composer-reply"><span className="composer-reply__icon"><FiRefreshCw /></span><span><strong>Replying to {replyingTo.sender.name}</strong><small>{replyingTo.content || 'Image message'}</small></span><Button size="icon" variant="ghost" onClick={onCancelReply}>Cancel reply<FiX /></Button></div>}
    {failedImages.length > 0 && <div className="upload-failed"><FiImage /><span><strong>Images were not sent</strong><small>Your selection is ready to retry.</small></span><Button size="sm" variant="secondary" disabled={uploading} onClick={() => void sendImages(failedImages)} leftIcon={<FiRefreshCw />}>Retry</Button><Button size="icon" variant="ghost" onClick={() => setFailedImages([])}>Dismiss<FiX /></Button></div>}
    <form className="message-composer" onSubmit={submit}>
      <input ref={imageInput} className="visually-hidden" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseImages} />
      <Button type="button" size="icon" variant="ghost" disabled={disabled || uploading} onClick={() => imageInput.current?.click()}>Send images<FiImage /></Button>
      <Button type="button" size="icon" variant="ghost" disabled title="File attachments are coming soon">Attach a file<FiPaperclip /></Button>
      <textarea rows={1} maxLength={5000} aria-label="Message" placeholder={uploading ? 'Uploading images…' : 'Type a message'} value={content} disabled={disabled || uploading} onChange={(event) => changed(event.target.value)} onKeyDown={keyDown} />
      <Button type="button" size="icon" variant="ghost" disabled={uploading} onClick={() => setContent((value) => `${value} ✨`)}>Add emoji<FiSmile /></Button>
      <Button type="submit" size="icon" loading={uploading} disabled={disabled || uploading || !content.trim()}>Send<FiSend /></Button>
    </form>
    {uploading && <p className="composer-hint is-uploading"><span />Uploading and sending {failedImages.length || ''} images securely…</p>}
  </div>
}
