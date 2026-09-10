import type { Conversation } from '../../types/api'

export type ReadSequences = Record<string, number>

export function canMarkConversationRead(isNearBottom: boolean, pageVisible: boolean, windowFocused: boolean) {
  return isNearBottom && pageVisible && windowFocused
}

export function receiptLabel(
  conversation: Conversation,
  senderId: string,
  currentUserId: string | undefined,
  sequence: number,
  readSequences: ReadSequences,
): string | null {
  if (!currentUserId || senderId !== currentUserId) return null
  const readers = (conversation.members ?? []).filter((member) =>
    member.status === 'ACTIVE'
      && member.user.id !== currentUserId
      && Math.max(readSequences[member.user.id] ?? 0, member.lastReadSequence ?? 0) >= sequence,
  )
  if (readers.length === 0) return null
  return conversation.type === 'PRIVATE' ? 'Seen' : `Read by ${readers.length}`
}
