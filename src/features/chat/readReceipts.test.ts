import { describe, expect, it } from 'vitest'
import type { Conversation, ConversationMember } from '../../types/api'
import { receiptLabel } from './readReceipts'

const member = (id: string, lastReadSequence: number | null): ConversationMember => ({
  id: `membership-${id}`,
  user: { id, name: id, username: id, email: `${id}@example.com`, avatar: null },
  role: 'MEMBER',
  status: 'ACTIVE',
  joinedAt: '',
  lastReadSequence,
})

const conversation = (type: 'PRIVATE' | 'GROUP', members: ConversationMember[]): Conversation => ({
  id: 'conversation-1',
  name: 'Test',
  type,
  avatar: null,
  maxMembers: type === 'PRIVATE' ? 2 : 20,
  memberCount: members.length,
  unreadCount: 0,
  myRole: 'MEMBER',
  lastMessage: null,
  members,
  createdAt: '',
  updatedAt: '',
})

describe('read receipts', () => {
  it('labels an own direct message after the other member reads its sequence', () => {
    const direct = conversation('PRIVATE', [member('me', 10), member('reader', 4)])
    expect(receiptLabel(direct, 'me', 'me', 5, { reader: 5 })).toBe('Seen')
    expect(receiptLabel(direct, 'me', 'me', 6, { reader: 5 })).toBeNull()
    expect(receiptLabel(direct, 'me', 'me', 4, {})).toBe('Seen')
  })

  it('counts active group readers and ignores the sender', () => {
    const group = conversation('GROUP', [member('me', 10), member('a', 8), member('b', 4)])
    expect(receiptLabel(group, 'me', 'me', 6, { a: 8, b: 7 })).toBe('Read by 2')
    expect(receiptLabel(group, 'a', 'me', 6, { a: 8, b: 7 })).toBeNull()
  })
})
