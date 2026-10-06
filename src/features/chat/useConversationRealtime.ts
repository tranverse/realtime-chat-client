import { useCallback, useEffect, useRef } from 'react'
import { useRealtime } from '@/features/realtime/RealtimeProvider'
import type { ChatEvent, CreateMessagePayload, TypingEvent, WebSocketError } from '@/types/api'

type IncomingEvent = ChatEvent | TypingEvent
export function useConversationRealtime(conversationId: string, onEvent: (event: IncomingEvent) => void, onError: (error: WebSocketError) => void, onConnected: () => void) {
  const { status, subscribe, publish } = useRealtime()
  const callbacksRef = useRef({ onEvent, onError, onConnected })
  const previousStatus = useRef(status)
  useEffect(() => { callbacksRef.current = { onEvent, onError, onConnected } }, [onEvent, onError, onConnected])
  useEffect(() => subscribe(`/topic/conversations/${conversationId}`, (frame) => callbacksRef.current.onEvent(JSON.parse(frame.body) as IncomingEvent)), [conversationId, subscribe])
  useEffect(() => subscribe('/user/queue/errors', (frame) => callbacksRef.current.onError(JSON.parse(frame.body) as WebSocketError)), [subscribe])
  useEffect(() => { if (status === 'connected' && previousStatus.current !== 'connected') callbacksRef.current.onConnected(); previousStatus.current = status }, [status])
  return {
    status,
    sendMessage: useCallback((payload: CreateMessagePayload) => publish(`/app/conversations/${conversationId}/messages`, payload), [conversationId, publish]),
    sendTyping: useCallback((typing: boolean) => publish(`/app/conversations/${conversationId}/typing`, { typing }), [conversationId, publish]),
    sendRead: useCallback((messageId: string) => publish(`/app/conversations/${conversationId}/read`, { messageId }), [conversationId, publish]),
  }
}
