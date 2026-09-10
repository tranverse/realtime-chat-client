import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useConversationRealtime } from './useConversationRealtime'

const stomp = vi.hoisted(() => ({
  config: undefined as { onConnect?: () => void } | undefined,
  subscribe: vi.fn(),
  activate: vi.fn(),
  deactivate: vi.fn(() => Promise.resolve()),
}))

vi.mock('@stomp/stompjs', () => ({
  Client: class {
    connected = false
    connectHeaders = {}
    subscribe = stomp.subscribe
    activate = stomp.activate
    deactivate = stomp.deactivate
    publish = vi.fn()

    constructor(config: { onConnect?: () => void }) {
      stomp.config = config
      Object.assign(this, config)
    }
  },
}))

vi.mock('sockjs-client', () => ({ default: class SockJS {} }))

describe('useConversationRealtime', () => {
  it('requests authoritative synchronization after initial connect and reconnect', () => {
    const onConnected = vi.fn()
    const { unmount } = renderHook(() =>
      useConversationRealtime('conversation-1', vi.fn(), vi.fn(), onConnected),
    )

    expect(stomp.activate).toHaveBeenCalledOnce()
    act(() => stomp.config?.onConnect?.())
    act(() => stomp.config?.onConnect?.())

    expect(onConnected).toHaveBeenCalledTimes(2)
    expect(stomp.subscribe).toHaveBeenCalledTimes(4)
    unmount()
    expect(stomp.deactivate).toHaveBeenCalledOnce()
  })
})
