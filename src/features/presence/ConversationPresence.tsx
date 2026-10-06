import type { Conversation } from "@/types/api";
import { getConversationPeer } from "../conversations/conversationUtils";
import { useUserPresence } from "./useUserPresence";

export function ConversationPresence({
  conversation,
  currentUserId,
}: {
  conversation: Conversation;
  currentUserId?: string;
}) {
  const peer = getConversationPeer(conversation, currentUserId);
  const presence = useUserPresence(peer?.id);
  if (conversation.type === "GROUP")
    return (
      <span>
        {conversation.memberCount}{" "}
        {conversation.memberCount === 1 ? "member" : "members"}
      </span>
    );
  if (presence.online === undefined)
    return (
      <span>
        {presence.isError ? "Presence unavailable" : "Checking presence…"}
      </span>
    );
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${presence.online ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}`}
    >
      <span
        className={`size-1.5 rounded-full ${presence.online ? "bg-emerald-500" : "bg-slate-400"}`}
        aria-hidden="true"
      />
      {presence.online ? "Online" : "Offline"}
    </span>
  );
}
