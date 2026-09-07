import type { InfiniteData } from '@tanstack/react-query'
import type { ChatEvent, ChatMessage, PageResponse } from '../../types/api'

export type MessagePages = InfiniteData<PageResponse<ChatMessage>, number | undefined>

export function applyMessageEvent(current: MessagePages | undefined, event: ChatEvent): MessagePages | undefined {
  if (!current) return current
  const pages = current.pages.map((page) => ({ ...page, items: [...page.items] }))
  if (event.type === 'MESSAGE_CREATED' && event.message) {
    if (!pages.some((page) => page.items.some((message) => message.id === event.message!.id))) pages[0].items.unshift(event.message)
  }
  if (event.type === 'MESSAGE_UPDATED' && event.message) {
    for (const page of pages) page.items = page.items.map((message) => message.id === event.message!.id ? event.message! : message)
  }
  if (event.type === 'MESSAGE_DELETED') {
    for (const page of pages) page.items = page.items.map((message) => message.id === event.messageId ? { ...message, content: null, attachments: [] } : message)
  }
  return { ...current, pages }
}
