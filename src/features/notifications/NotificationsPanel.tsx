import { useQuery } from "@tanstack/react-query";
import { Bell, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import type { Conversation } from "@/types/api";
import { useAuth } from "../auth/useAuth";
import { conversationApi } from "../conversations/conversationApi";
import {
  formatConversationTime,
  getConversationAvatar,
  getConversationName,
  lastMessageLabel,
} from "../conversations/conversationUtils";

export function NotificationsPanel({ onSelect }: { onSelect: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: ({ signal }) => conversationApi.list(0, 30, signal),
    refetchInterval: 15_000,
  });
  const unread = (conversations.data?.items ?? []).filter(
    (item) => item.unreadCount > 0,
  );
  const count = unread.reduce((sum, item) => sum + item.unreadCount, 0);
  function select(item: Conversation) {
    onSelect();
    navigate(`/chat/${item.id}`);
  }
  return (
    <section
      className="h-full min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-6 sm:px-8"
      aria-labelledby="notifications-title"
    >
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Inbox
          </p>
          <h1
            id="notifications-title"
            className="mt-1 text-2xl font-bold text-slate-950"
          >
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {count
              ? `${count} unread message${count === 1 ? "" : "s"}`
              : "You are all caught up."}
          </p>
        </header>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {conversations.isLoading && (
            <p className="p-10 text-center text-sm text-slate-400">
              Loading notifications…
            </p>
          )}
          {!conversations.isLoading && unread.length === 0 && (
            <div className="grid place-items-center gap-3 p-14 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Bell size={22} />
              </span>
              <strong className="text-sm text-slate-800">
                No unread messages
              </strong>
              <p className="text-xs text-slate-500">
                New conversation activity will appear here.
              </p>
            </div>
          )}
          {unread.map((item) => {
            const name = getConversationName(item, user?.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => select(item)}
                className="flex w-full gap-3 border-b border-slate-100 p-4 text-left last:border-0 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
              >
                <Avatar
                  name={name}
                  src={getConversationAvatar(item, user?.id)}
                />
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-slate-900">
                    {item.type === "GROUP"
                      ? name
                      : `${name} sent you a message`}
                  </strong>
                  <small className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                    {item.lastMessage?.type === "IMAGE" && <Image size={12} />}
                    {lastMessageLabel(item, user)}
                  </small>
                  <time className="mt-1 block text-[11px] text-slate-400">
                    {formatConversationTime(
                      item.lastMessage?.createdAt ?? item.updatedAt,
                    )}
                  </time>
                </span>
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {item.unreadCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
