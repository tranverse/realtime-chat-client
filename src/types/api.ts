export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface MessageResponse {
  message: string
}

export interface UserSummary {
  id: string
  name: string
  username: string | null
  email: string
  avatar: string | null
}

export interface UserProfile extends UserSummary {
  phone: string | null
  dob: string | null
  role: 'USER' | 'ADMIN'
  provider: 'LOCAL' | 'GOOGLE'
  createdAt: string
}

export type ConversationType = 'PRIVATE' | 'GROUP'
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type MemberStatus = 'ACTIVE' | 'LEFT' | 'REMOVED'
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'

export interface Attachment {
  id?: string
  fileUrl: string
  fileType: string
  fileSize: number | null
}

export interface MediaUpload extends Omit<Attachment, 'id'> {
  publicId: string
  width: number | null
  height: number | null
}

export interface ReplyMessage {
  id: string
  content: string | null
  sequence: number
  sender: UserSummary
}

export interface ChatMessage {
  id: string
  conversationId: string
  content: string | null
  type: MessageType
  sequence: number
  sender: UserSummary
  replyTo: ReplyMessage | null
  attachments: Attachment[]
  editedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ConversationMember {
  id: string
  user: UserSummary
  role: MemberRole
  status: MemberStatus
  joinedAt: string
  lastReadSequence: number | null
}

export interface Conversation {
  id: string
  name: string | null
  type: ConversationType
  avatar: string | null
  maxMembers: number | null
  memberCount: number
  unreadCount: number
  myRole: MemberRole
  lastMessage: ChatMessage | null
  members?: ConversationMember[]
  createdAt: string
  updatedAt: string
}

export interface InviteLink {
  id: string
  conversationId: string
  code: string
  requireApproval: boolean
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  expiredAt: string
}

export interface JoinRequest {
  id: string
  conversationId: string
  requestedBy: UserSummary
  message: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  reviewedAt: string | null
}

export interface JoinResult {
  joined: boolean
  conversation: Conversation | null
  joinRequest: JoinRequest | null
}

export interface CreateMessagePayload {
  content: string
  type: MessageType
  replyToMessageId: string | null
  attachments: Array<Omit<Attachment, 'id'>>
}

export interface ChatEvent {
  type: 'MESSAGE_CREATED' | 'MESSAGE_UPDATED' | 'MESSAGE_DELETED' | 'MESSAGES_READ'
  conversationId: string
  actorUserId: string
  messageId: string
  sequence: number
  message?: ChatMessage
}

export interface TypingEvent {
  type: 'TYPING'
  conversationId: string
  actorUserId: string
  typing: boolean
  timestamp: string
}

export interface WebSocketError {
  code: string
  message: string
  timestamp: string
}
