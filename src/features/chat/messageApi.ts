import { apiClient } from "../../lib/apiClient";
import type {
  ApiResponse,
  ChatMessage,
  CreateMessagePayload,
  MessageResponse,
  MessageContext,
  PageResponse,
} from "../../types/api";

export const messageApi = {
  async context(
    conversationId: string,
    messageId: string,
    signal?: AbortSignal,
  ) {
    const { data } = await apiClient.get<ApiResponse<MessageContext>>(
      `/conversations/${conversationId}/messages/${messageId}/context`,
      { signal },
    );
    return data.data;
  },
  async history(conversationId: string, beforeSequence?: number, size = 50) {
    const { data } = await apiClient.get<
      ApiResponse<PageResponse<ChatMessage>>
    >(`/conversations/${conversationId}/messages`, {
      params: { beforeSequence, size },
    });
    return data.data;
  },
  async send(conversationId: string, payload: CreateMessagePayload) {
    const { data } = await apiClient.post<ApiResponse<ChatMessage>>(
      `/conversations/${conversationId}/messages`,
      payload,
    );
    return data.data;
  },
  async markRead(conversationId: string, messageId: string) {
    const { data } = await apiClient.post<ApiResponse<MessageResponse>>(
      `/conversations/${conversationId}/read`,
      { messageId },
    );
    return data.data;
  },
  async remove(messageId: string) {
    await apiClient.delete(`/messages/${messageId}`);
  },
};
