import { Client, type IMessage } from '@stomp/stompjs'
import { useEffect, useRef } from 'react'
import SockJS from 'sockjs-client'
import { appConfig } from '@/lib/config'
import { tokenStore } from '@/lib/tokens'
import type { ChatEvent } from '@/types/api'

export function useInboxRealtime(conversationIds: string[], onEvent: (event: ChatEvent) => void) {
  const onEventRef = useRef(onEvent)
  const subscriptionKey = [...conversationIds].sort().join(',')

  useEffect(() => { onEventRef.current = onEvent }, [onEvent])

  useEffect(() => {
    if (!subscriptionKey) return
    const ids = subscriptionKey.split(',')
    const socketUrl = /^https?:\/\//.test(appConfig.wsUrl)
      ? appConfig.wsUrl
      : `${window.location.origin}${appConfig.wsUrl.startsWith('/') ? '' : '/'}${appConfig.wsUrl}`
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 4_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      connectHeaders: { Authorization: `Bearer ${tokenStore.getAccessToken() ?? ''}` },
      beforeConnect: async () => { client.connectHeaders = { Authorization: `Bearer ${tokenStore.getAccessToken() ?? ''}` } },
      onConnect: () => ids.forEach((id) => client.subscribe(`/topic/conversations/${id}`, (frame: IMessage) => {
        onEventRef.current(JSON.parse(frame.body) as ChatEvent)
      })),
    })
    client.activate()
    return () => { void client.deactivate() }
  }, [subscriptionKey])
}
