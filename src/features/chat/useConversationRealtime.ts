import { Client, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { appConfig } from '../../lib/config'
import { tokenStore } from '../../lib/tokens'
import type { ChatEvent, CreateMessagePayload, TypingEvent, WebSocketError } from '../../types/api'

type IncomingEvent = ChatEvent | TypingEvent

export function useConversationRealtime(conversationId: string, onEvent: (event: IncomingEvent) => void, onError: (error: WebSocketError) => void) {
  const clientRef = useRef<Client | null>(null)
  const callbacksRef = useRef({ onEvent, onError })
  const [status, setStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting')

  useEffect(() => { callbacksRef.current = { onEvent, onError } }, [onEvent, onError])

  useEffect(() => {
    const socketUrl = /^https?:\/\//.test(appConfig.wsUrl) ? appConfig.wsUrl : `${window.location.origin}${appConfig.wsUrl.startsWith('/') ? '' : '/'}${appConfig.wsUrl}`
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 4_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      connectHeaders: { Authorization: `Bearer ${tokenStore.getAccessToken() ?? ''}` },
      beforeConnect: async () => { client.connectHeaders = { Authorization: `Bearer ${tokenStore.getAccessToken() ?? ''}` }; setStatus('connecting') },
      onConnect: () => {
        setStatus('connected')
        client.subscribe(`/topic/conversations/${conversationId}`, (frame: IMessage) => callbacksRef.current.onEvent(JSON.parse(frame.body) as IncomingEvent))
        client.subscribe('/user/queue/errors', (frame: IMessage) => callbacksRef.current.onError(JSON.parse(frame.body) as WebSocketError))
      },
      onWebSocketClose: () => setStatus('offline'),
      onStompError: () => setStatus('offline'),
    })
    clientRef.current = client
    client.activate()
    return () => { clientRef.current = null; void client.deactivate() }
  }, [conversationId])

  const publish = useCallback((destination: string, body: unknown) => {
    const client = clientRef.current
    if (!client?.connected) return false
    client.publish({ destination, body: JSON.stringify(body) })
    return true
  }, [])

  const sendMessage = useCallback((payload: CreateMessagePayload) => publish(`/app/conversations/${conversationId}/messages`, payload), [conversationId, publish])
  const sendTyping = useCallback((typing: boolean) => publish(`/app/conversations/${conversationId}/typing`, { typing }), [conversationId, publish])
  const sendRead = useCallback((messageId: string) => publish(`/app/conversations/${conversationId}/read`, { messageId }), [conversationId, publish])

  return {
    status,
    sendMessage,
    sendTyping,
    sendRead,
  }
}
