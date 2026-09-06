import { apiClient } from '../../lib/apiClient'
import type { ApiResponse, Conversation, ConversationMember, InviteLink, JoinRequest, JoinResult, MemberRole, MessageResponse, PageResponse } from '../../types/api'

export interface CreateConversationPayload {
  type: 'PRIVATE' | 'GROUP'
  name?: string
  memberIds: string[]
  maxMembers?: number
  avatar?: string | null
}

export const conversationApi = {
  async list(page = 0, size = 30) {
    const { data } = await apiClient.get<ApiResponse<PageResponse<Conversation>>>('/conversations', { params: { page, size } })
    return data.data
  },
  async detail(id: string) {
    const { data } = await apiClient.get<ApiResponse<Conversation>>(`/conversations/${id}`)
    return data.data
  },
  async create(payload: CreateConversationPayload) {
    const { data } = await apiClient.post<ApiResponse<Conversation>>('/conversations', payload)
    return data.data
  },
  async update(id: string, payload: { name?: string; maxMembers?: number; avatar?: string | null }) {
    const { data } = await apiClient.patch<ApiResponse<Conversation>>(`/conversations/${id}`, payload)
    return data.data
  },
  async addMembers(id: string, userIds: string[]) {
    const { data } = await apiClient.post<ApiResponse<Conversation>>(`/conversations/${id}/members`, { userIds })
    return data.data
  },
  async removeMember(id: string, userId: string) {
    const { data } = await apiClient.delete<ApiResponse<MessageResponse>>(`/conversations/${id}/members/${userId}`)
    return data.data
  },
  async updateRole(id: string, userId: string, role: MemberRole) {
    const { data } = await apiClient.patch<ApiResponse<ConversationMember>>(`/conversations/${id}/members/${userId}/role`, { role })
    return data.data
  },
  async transferOwnership(id: string, userId: string) {
    const { data } = await apiClient.post<ApiResponse<Conversation>>(`/conversations/${id}/transfer-ownership`, { userId })
    return data.data
  },
  async leave(id: string) {
    const { data } = await apiClient.post<ApiResponse<MessageResponse>>(`/conversations/${id}/leave`)
    return data.data
  },
  async createInvite(id: string, requireApproval: boolean, expiresInHours: number) {
    const { data } = await apiClient.post<ApiResponse<InviteLink>>(`/conversations/${id}/invite-links`, { requireApproval, expiresInHours })
    return data.data
  },
  async revokeInvite(id: string, linkId: string) {
    await apiClient.delete(`/conversations/${id}/invite-links/${linkId}`)
  },
  async join(code: string, message: string) {
    const { data } = await apiClient.post<ApiResponse<JoinResult>>(`/conversations/invite-links/${code}/join`, { message })
    return data.data
  },
  async joinRequests(id: string) {
    const { data } = await apiClient.get<ApiResponse<JoinRequest[]>>(`/conversations/${id}/join-requests`)
    return data.data
  },
  async reviewJoinRequest(id: string, requestId: string, approved: boolean) {
    await apiClient.post(`/conversations/${id}/join-requests/${requestId}/review`, { approved })
  },
}
