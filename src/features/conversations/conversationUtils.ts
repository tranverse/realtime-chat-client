import { format, isToday, isYesterday } from 'date-fns'
import type { Conversation, UserProfile } from '../../types/api'

export function getConversationPeer(conversation: Conversation, currentUserId?: string) {
  return conversation.type === 'PRIVATE' ? conversation.members?.find((member) => member.user.id !== currentUserId)?.user : undefined
}

export function getConversationName(conversation: Conversation, currentUserId?: string) {
  return conversation.name || getConversationPeer(conversation, currentUserId)?.name || 'Conversation'
}

export function getConversationAvatar(conversation: Conversation, currentUserId?: string) {
  return conversation.avatar || getConversationPeer(conversation, currentUserId)?.avatar
}

export function formatConversationTime(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (isToday(date)) return format(date, 'HH:mm')
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

export function lastMessageLabel(conversation: Conversation, me?: UserProfile | null) {
  const message = conversation.lastMessage
  if (!message) return 'Start the conversation'
  const prefix = message.sender.id === me?.id ? 'You: ' : conversation.type === 'GROUP' ? `${message.sender.name.split(' ').at(-1)}: ` : ''
  if (message.type === 'IMAGE') return `${prefix}Sent an image`
  if (message.type === 'FILE') return `${prefix}Sent a file`
  return `${prefix}${message.content ?? 'Message deleted'}`
}
