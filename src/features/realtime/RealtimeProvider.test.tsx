import { act, cleanup, render } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RealtimeProvider, useRealtime } from './RealtimeProvider'

const mocks = vi.hoisted(() => ({
  auth: { status: 'authenticated', user: { id: 'user-1' } },
  clients: [] as { connected: boolean; config: Record<string, unknown>; activate: ReturnType<typeof vi.fn>; deactivate: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn>; publish: ReturnType<typeof vi.fn> }[],
  get: vi.fn(),
}))
vi.mock('@/features/auth/useAuth', () => ({ useAuth: () => mocks.auth }))
vi.mock('@/lib/apiClient', () => ({ apiClient: { get: mocks.get } }))
vi.mock('sockjs-client', () => ({ default: class {} }))
vi.mock('@stomp/stompjs', () => ({ Client: class {
  connected = false; config: Record<string, unknown>; connectHeaders = {}
  activate = vi.fn(); deactivate = vi.fn(() => Promise.resolve()); publish = vi.fn()
  subscribe = vi.fn(() => ({ unsubscribe: vi.fn() }))
  constructor(config: Record<string, unknown>) { this.config = config; mocks.clients.push(this) }
} }))

function Subscriber({ peer }: { peer: string }) {
  const { subscribe } = useRealtime()
  useEffect(() => subscribe(`/topic/presence/${peer}`, () => {}), [peer, subscribe])
  return null
}

describe('session-scoped realtime transport', () => {
  beforeEach(() => { vi.useFakeTimers(); mocks.clients.length = 0; mocks.auth.status = 'authenticated'; mocks.get.mockResolvedValue({ data: { data: { heartbeatMillis: 25_000 } } }) })
  afterEach(() => { cleanup(); vi.useRealTimers() })
  it('keeps one transport across navigation and stops heartbeat on logout', async () => {
    const view = render(<RealtimeProvider><Subscriber peer="peer-a" /></RealtimeProvider>)
    const client = mocks.clients[0]
    client.connected = true
    await act(async () => { (client.config.onConnect as () => void)(); await Promise.resolve() })
    expect(client.publish).toHaveBeenCalledWith({ destination: '/app/presence/heartbeat', body: '{}' })
    view.rerender(<RealtimeProvider><Subscriber peer="peer-b" /></RealtimeProvider>)
    expect(mocks.clients).toHaveLength(1)
    expect(client.deactivate).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(25_000))
    expect(client.publish).toHaveBeenCalledTimes(2)
    mocks.auth.status = 'anonymous'
    view.rerender(<RealtimeProvider><Subscriber peer="peer-b" /></RealtimeProvider>)
    expect(client.deactivate).toHaveBeenCalledOnce()
    act(() => vi.advanceTimersByTime(75_000))
    expect(client.publish).toHaveBeenCalledTimes(2)
  })
  it('restores subscriptions and heartbeat after a real transport reconnect', async () => {
    render(<RealtimeProvider><Subscriber peer="peer-a" /></RealtimeProvider>)
    const client = mocks.clients[0]; client.connected = true
    await act(async () => { (client.config.onConnect as () => void)(); await Promise.resolve() })
    act(() => { client.connected = false; (client.config.onWebSocketClose as () => void)() })
    act(() => vi.advanceTimersByTime(25_000))
    expect(client.publish).toHaveBeenCalledTimes(1)
    client.connected = true
    await act(async () => { (client.config.onConnect as () => void)(); await Promise.resolve() })
    expect(client.subscribe).toHaveBeenCalledTimes(2)
    expect(client.publish).toHaveBeenCalledTimes(2)
    expect(mocks.clients).toHaveLength(1)
  })
})
