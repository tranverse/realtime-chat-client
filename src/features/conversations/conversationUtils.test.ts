import { describe, expect, it } from 'vitest'
import type { Conversation } from '../../types/api'
import { getConversationName, lastMessageLabel } from './conversationUtils'

const conversation = {
  id: 'c1', name: null, avatar: null, type: 'PRIVATE', maxMembers: 2, memberCount: 2, unreadCount: 0, myRole: 'MEMBER', lastMessage: null, createdAt: '', updatedAt: '',
  members: [
    { id: 'cm1', role: 'MEMBER', status: 'ACTIVE', joinedAt: '', lastReadSequence: null, user: { id: 'me', name: 'Alex Morgan', username: 'alex', email: 'alex@example.com', avatar: null } },
    { id: 'cm2', role: 'MEMBER', status: 'ACTIVE', joinedAt: '', lastReadSequence: null, user: { id: 'peer', name: 'Sam Lee', username: 'sam', email: 'sam@example.com', avatar: null } },
  ],
} satisfies Conversation

describe('conversationUtils', () => {
  it('uses the peer name for direct conversations', () => {
    expect(getConversationName(conversation, 'me')).toBe('Sam Lee')
  })

  it('provides an empty-conversation label', () => {
    expect(lastMessageLabel(conversation)).toBe('Start the conversation')
  })
})
