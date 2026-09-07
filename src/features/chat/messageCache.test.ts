import { describe, expect, it } from 'vitest'
import type { ChatEvent, ChatMessage, PageResponse } from '../../types/api'
import { applyMessageEvent, type MessagePages } from './messageCache'

const message = { id: 'm1', conversationId: 'c1', content: 'Hello', type: 'TEXT', sequence: 1, sender: { id: 'u1', name: 'Alex', username: null, email: 'a@b.com', avatar: null }, replyTo: null, attachments: [], editedAt: null, createdAt: '', updatedAt: '' } satisfies ChatMessage
const page = { items: [message], page: 0, size: 50, totalElements: 1, totalPages: 1, hasNext: false } satisfies PageResponse<ChatMessage>
const data: MessagePages = { pages: [page], pageParams: [undefined] }

describe('applyMessageEvent', () => {
  it('updates and soft-deletes a message without mutating the old cache', () => {
    const updated = { ...message, content: 'Updated' }
    const afterEdit = applyMessageEvent(data, { type: 'MESSAGE_UPDATED', conversationId: 'c1', actorUserId: 'u1', messageId: 'm1', sequence: 1, message: updated } satisfies ChatEvent)!
    expect(afterEdit.pages[0].items[0].content).toBe('Updated')
    expect(data.pages[0].items[0].content).toBe('Hello')

    const afterDelete = applyMessageEvent(afterEdit, { type: 'MESSAGE_DELETED', conversationId: 'c1', actorUserId: 'u1', messageId: 'm1', sequence: 1 } satisfies ChatEvent)!
    expect(afterDelete.pages[0].items[0].content).toBeNull()
  })
})
