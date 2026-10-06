import { useEffect, useRef } from "react";
import { useRealtime } from "@/features/realtime/RealtimeProvider";
import type { ChatEvent } from "@/types/api";

export function useInboxRealtime(
  conversationIds: string[],
  onEvent: (event: ChatEvent) => void,
) {
  const { subscribe } = useRealtime();
  const onEventRef = useRef(onEvent);
  const subscriptionKey = [...conversationIds].sort().join(",");
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);
  useEffect(() => {
    const unsubscribes = subscriptionKey
      ? subscriptionKey
          .split(",")
          .map((id) =>
            subscribe(`/topic/conversations/${id}`, (frame) =>
              onEventRef.current(JSON.parse(frame.body) as ChatEvent),
            ),
          )
      : [];
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [subscribe, subscriptionKey]);
}
