import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { ApiResponse } from '@/types/api'
import { useRealtime } from '../realtime/RealtimeProvider'

export interface PresenceState { userId: string; online: boolean }
export function useUserPresence(userId?: string) {
  const { status, subscribe } = useRealtime()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['presence', userId], enabled: Boolean(userId),
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get<ApiResponse<PresenceState>>(`/users/${userId}/presence`, { signal })
      return data.data
    },
    refetchInterval: 30_000,
  })
  useEffect(() => {
    if (!userId) return
    return subscribe(`/topic/presence/${userId}`, (frame) => {
      const event = JSON.parse(frame.body) as PresenceState
      if (event.userId !== userId) return
      // An older HTTP snapshot must not overwrite a newer realtime event.
      void queryClient.cancelQueries({ queryKey: ['presence', userId] })
      queryClient.setQueryData(['presence', userId], event)
    })
  }, [queryClient, subscribe, userId])
  useEffect(() => {
    if (status === 'connected' && userId) void queryClient.invalidateQueries({ queryKey: ['presence', userId] })
  }, [queryClient, status, userId])
  // After transport loss the cached remote state is unknown until a new snapshot arrives.
  return { ...query, online: status === 'connected' ? query.data?.online : undefined }
}
