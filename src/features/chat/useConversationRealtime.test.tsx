import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useConversationRealtime } from './useConversationRealtime'

const realtime = vi.hoisted(() => ({
  status: 'connected' as 'connecting' | 'connected' | 'offline',
  subscribe: vi.fn(() => vi.fn()),
  publish: vi.fn(() => true),
}))

vi.mock('@/features/realtime/RealtimeProvider', () => ({ useRealtime: () => realtime }))

describe('useConversationRealtime', () => {
  beforeEach(() => { vi.clearAllMocks(); realtime.status = 'connected' })

  it('changes conversation subscriptions without creating a new transport', () => {
    const { rerender } = renderHook(({ id }) => useConversationRealtime(id, vi.fn(), vi.fn(), vi.fn()), { initialProps: { id: 'conversation-1' } })
    expect(realtime.subscribe).toHaveBeenCalledWith('/topic/conversations/conversation-1', expect.any(Function))
    expect(realtime.subscribe).toHaveBeenCalledWith('/user/queue/errors', expect.any(Function))
    rerender({ id: 'conversation-2' })
    expect(realtime.subscribe).toHaveBeenCalledWith('/topic/conversations/conversation-2', expect.any(Function))
  })

  it('publishes chat events through the shared connection', () => {
    const { result } = renderHook(() => useConversationRealtime('conversation-1', vi.fn(), vi.fn(), vi.fn()))
    result.current.sendMessage({ content: 'Hello', type: 'TEXT', replyToMessageId: null, attachments: [] })
    result.current.sendTyping(true); result.current.sendRead('message-1')
    expect(realtime.publish).toHaveBeenCalledWith('/app/conversations/conversation-1/messages', expect.objectContaining({ content: 'Hello' }))
    expect(realtime.publish).toHaveBeenCalledWith('/app/conversations/conversation-1/typing', { typing: true })
    expect(realtime.publish).toHaveBeenCalledWith('/app/conversations/conversation-1/read', { messageId: 'message-1' })
  })
})
