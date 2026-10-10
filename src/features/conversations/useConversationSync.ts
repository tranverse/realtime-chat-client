import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useRealtime } from "@/features/realtime/RealtimeProvider";
import { useAuth } from "@/features/auth/useAuth";
import { useInboxRealtime } from "@/features/notifications/useInboxRealtime";
import { conversationApi } from "./conversationApi";

export interface ConversationChanged {
  type: "CONVERSATION_CHANGED";
  conversationId: string;
  conversationName: string | null;
  reason: string;
  added: boolean;
  removed: boolean;
}

/** One workspace observer: unread and group metadata share the canonical query cache. */
export function useConversationSync() {
  const { user } = useAuth();
  const { status, subscribe } = useRealtime();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: ({ signal }) => conversationApi.list(0, 30, signal),
    enabled: !!user,
    refetchInterval: 30_000,
  });
  useInboxRealtime(
    (conversations.data?.items ?? []).map((item) => item.id),
    (event) => {
      if (event.type === "TYPING") return;
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (event.type === "MESSAGES_READ")
        void queryClient.invalidateQueries({
          queryKey: ["conversation", event.conversationId],
        });
    },
  );
  useEffect(() => {
    if (!user) return;
    return subscribe("/user/queue/conversations", (frame) => {
      const event = JSON.parse(frame.body) as ConversationChanged;
      if (event.type !== "CONVERSATION_CHANGED") return;
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void queryClient.invalidateQueries({
        queryKey: ["join-requests", event.conversationId],
      });
      if (event.removed) {
        void queryClient.cancelQueries({
          queryKey: ["conversation", event.conversationId],
        });
        void queryClient.cancelQueries({
          queryKey: ["messages", event.conversationId],
        });
        queryClient.removeQueries({
          queryKey: ["conversation", event.conversationId],
        });
        queryClient.removeQueries({
          queryKey: ["messages", event.conversationId],
        });
        toast.info("You no longer have access to this group.");
        if (window.location.pathname === `/chat/${event.conversationId}`)
          navigate("/", { replace: true });
      } else {
        void queryClient.invalidateQueries({
          queryKey: ["conversation", event.conversationId],
        });
        if (event.added)
          toast.success(
            `You were added to ${event.conversationName || "a conversation"}.`,
          );
      }
    });
  }, [subscribe, user, queryClient, navigate]);
  useEffect(() => {
    if (status !== "connected" || !user) return;
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    void queryClient.invalidateQueries({ queryKey: ["conversation"] });
    void queryClient.invalidateQueries({ queryKey: ["join-requests"] });
  }, [status, user, queryClient]);
}
