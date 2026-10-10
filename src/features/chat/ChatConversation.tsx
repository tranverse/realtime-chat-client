import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, Info, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { getErrorMessage } from "../../lib/errors";
import type {
  ChatEvent,
  ChatMessage,
  CreateMessagePayload,
  TypingEvent,
} from "../../types/api";
import { useAuth } from "../auth/useAuth";
import { ConversationDetailsModal } from "../conversations/ConversationDetailsModal";
import { conversationApi } from "../conversations/conversationApi";
import {
  getConversationAvatar,
  getConversationName,
} from "../conversations/conversationUtils";
import { ConversationPresence } from "../presence/ConversationPresence";
import { messageApi } from "./messageApi";
import { applyMessageEvent, type MessagePages } from "./messageCache";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import {
  canMarkConversationRead,
  receiptLabel,
  type ReadSequences,
} from "./readReceipts";
import { useConversationRealtime } from "./useConversationRealtime";
import { useMessageScroll } from "./useMessageScroll";
import { useReplyNavigation } from "./useReplyNavigation";
import { DeleteMessageDialog } from "./DeleteMessageDialog";

export function ChatConversation({
  conversationId,
}: {
  conversationId: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [readSequences, setReadSequences] = useState<ReadSequences>({});
  const [connectionNotice, setConnectionNotice] = useState<
    "hidden" | "reconnecting" | "offline"
  >("hidden");
  const [pageIsActive, setPageIsActive] = useState(
    () => document.visibilityState === "visible" && document.hasFocus(),
  );
  const lastReadRef = useRef<string | null>(null);
  const connectionLostSince = useRef<number | null>(null);
  const typingTimers = useRef(new Map<string, number>());
  const messageHistoryRef = useRef<HTMLDivElement | null>(null);

  const conversation = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: ({ signal }) => conversationApi.detail(conversationId, signal),
  });
  const history = useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) => messageApi.history(conversationId, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page) =>
      page.hasNext
        ? Math.min(...page.items.map((message) => message.sequence))
        : undefined,
  });

  const onRealtimeEvent = useCallback(
    (event: ChatEvent | TypingEvent) => {
      if (event.type === "TYPING") {
        if (event.actorUserId === user?.id) return;
        setTypingUsers((current) => {
          const next = new Set(current);
          if (event.typing) next.add(event.actorUserId);
          else next.delete(event.actorUserId);
          return next;
        });
        window.clearTimeout(typingTimers.current.get(event.actorUserId));
        if (event.typing)
          typingTimers.current.set(
            event.actorUserId,
            window.setTimeout(
              () =>
                setTypingUsers((current) => {
                  const next = new Set(current);
                  next.delete(event.actorUserId);
                  return next;
                }),
              2_500,
            ),
          );
        return;
      }
      if (event.type === "MESSAGES_READ") {
        void queryClient.invalidateQueries({ queryKey: ["conversations"] });
        void queryClient.invalidateQueries({
          queryKey: ["conversation", conversationId],
        });
        setReadSequences((current) => ({
          ...current,
          [event.actorUserId]: Math.max(
            current[event.actorUserId] ?? 0,
            event.sequence,
          ),
        }));
        return;
      }
      queryClient.setQueryData<MessagePages>(
        ["messages", conversationId],
        (current) => applyMessageEvent(current, event),
      );
      if (event.type === "MESSAGE_DELETED")
        void queryClient.invalidateQueries({
          queryKey: ["reply-history", conversationId],
        });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void queryClient.invalidateQueries({
        queryKey: ["conversation", conversationId],
      });
    },
    [conversationId, queryClient, user?.id],
  );

  const onRealtimeConnected = useCallback(() => {
    lastReadRef.current = null;
    void queryClient.invalidateQueries({
      queryKey: ["reply-history", conversationId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["messages", conversationId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["conversation", conversationId],
    });
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [conversationId, queryClient]);

  const realtime = useConversationRealtime(
    conversationId,
    onRealtimeEvent,
    (error) => {
      lastReadRef.current = null;
      toast.error(error.message);
    },
    onRealtimeConnected,
  );
  useEffect(() => {
    if (realtime.status === "connected") {
      connectionLostSince.current = null;
      setConnectionNotice("hidden");
      return;
    }
    connectionLostSince.current ??= Date.now();
    const elapsed = Date.now() - connectionLostSince.current;
    const reconnectingTimer = window.setTimeout(
      () => setConnectionNotice("reconnecting"),
      Math.max(0, 800 - elapsed),
    );
    const offlineTimer = window.setTimeout(
      () => setConnectionNotice("offline"),
      Math.max(0, 8_000 - elapsed),
    );
    return () => {
      window.clearTimeout(reconnectingTimer);
      window.clearTimeout(offlineTimer);
    };
  }, [realtime.status]);
  const latestMessages = useMemo(
    () =>
      (history.data?.pages.flatMap((page) => page.items) ?? []).sort(
        (a, b) => a.sequence - b.sequence,
      ),
    [history.data],
  );
  const replyNavigation = useReplyNavigation(
    conversationId,
    latestMessages,
    messageHistoryRef,
  );
  const messages = replyNavigation.messages;
  const newest = latestMessages.at(-1);
  const latestOwnMessageId = messages.findLast(
    (message) => message.sender.id === user?.id,
  )?.id;
  const {
    historyRef,
    bottomRef,
    unseenMessages,
    isNearBottom,
    handleScroll,
    scrollToBottom,
    loadOlderPreservingPosition,
  } = useMessageScroll(
    newest?.id,
    newest?.sender.id === user?.id,
    replyNavigation.pauseAutoScroll,
    messageHistoryRef,
  );

  useEffect(() => {
    if (
      !newest ||
      replyNavigation.pauseAutoScroll ||
      lastReadRef.current === newest.id ||
      !canMarkConversationRead(
        isNearBottom,
        document.visibilityState === "visible",
        pageIsActive,
      )
    )
      return;
    lastReadRef.current = newest.id;
    if (!realtime.sendRead(newest.id))
      void messageApi
        .markRead(conversationId, newest.id)
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: ["conversations"] });
          void queryClient.invalidateQueries({
            queryKey: ["conversation", conversationId],
          });
        })
        .catch((error: unknown) => {
          lastReadRef.current = null;
          toast.error(getErrorMessage(error));
        });
  }, [
    conversationId,
    isNearBottom,
    newest,
    pageIsActive,
    realtime,
    user?.id,
    queryClient,
    replyNavigation.pauseAutoScroll,
  ]);

  useEffect(() => {
    const updatePageActivity = () =>
      setPageIsActive(
        document.visibilityState === "visible" && document.hasFocus(),
      );
    window.addEventListener("focus", updatePageActivity);
    window.addEventListener("blur", updatePageActivity);
    document.addEventListener("visibilitychange", updatePageActivity);
    return () => {
      window.removeEventListener("focus", updatePageActivity);
      window.removeEventListener("blur", updatePageActivity);
      document.removeEventListener("visibilitychange", updatePageActivity);
    };
  }, []);

  useEffect(
    () => () => {
      typingTimers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const remove = useMutation({
    mutationFn: (id: string) => messageApi.remove(id),
    onSuccess: () => setDeleteTarget(null),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  async function send(payload: CreateMessagePayload) {
    if (realtime.sendMessage(payload)) {
      replyNavigation.returnToLatest();
      return;
    }
    try {
      const created = await messageApi.send(conversationId, payload);
      replyNavigation.returnToLatest();
      onRealtimeEvent({
        type: "MESSAGE_CREATED",
        conversationId,
        actorUserId: created.sender.id,
        messageId: created.id,
        sequence: created.sequence,
        message: created,
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  }

  if (conversation.isLoading || history.isLoading)
    return <Spinner label="Opening conversation…" className="stage-spinner" />;
  if (!conversation.data || conversation.isError)
    return (
      <EmptyState
        icon={<WifiOff size={26} />}
        title="Conversation unavailable"
        description="It may have been removed or you may no longer be a member."
        action={
          <Button variant="secondary" onClick={() => navigate("/")}>
            Back to messages
          </Button>
        }
      />
    );
  const name = getConversationName(conversation.data, user?.id);
  const canManage =
    conversation.data.myRole === "OWNER" ||
    conversation.data.myRole === "ADMIN";
  const typingNames =
    conversation.data.members
      ?.filter((member) => typingUsers.has(member.user.id))
      .map((member) => member.user.name.split(" ")[0]) ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <header className="z-10 flex h-[72px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 sm:px-5">
        <Button
          size="icon"
          variant="ghost"
          className="md:hidden"
          onClick={() => navigate("/")}
        >
          Back
          <ArrowLeft size={19} />
        </Button>
        <Avatar
          name={name}
          src={getConversationAvatar(conversation.data, user?.id)}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-slate-950 sm:text-base">
            {name}
          </h2>
          <p
            className={`mt-0.5 flex items-center gap-1 text-xs ${connectionNotice !== "hidden" ? "text-amber-600" : "text-slate-500"}`}
          >
            {connectionNotice === "offline" ? (
              <WifiOff size={11} />
            ) : connectionNotice === "reconnecting" ? (
              <Wifi size={11} />
            ) : null}
            {typingNames.length ? (
              `${typingNames.join(", ")} typing…`
            ) : connectionNotice !== "hidden" ? (
              connectionNotice === "reconnecting" ? (
                "Reconnecting…"
              ) : (
                "Connection lost"
              )
            ) : (
              <ConversationPresence
                conversation={conversation.data}
                currentUserId={user?.id}
              />
            )}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setDetailsOpen(true)}
        >
          Conversation info
          <Info size={19} />
        </Button>
      </header>
      <div
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50 px-3 pt-5 pb-3 sm:px-6"
        ref={historyRef}
        onScroll={handleScroll}
      >
        {replyNavigation.browsingHistory && (
          <div className="sticky top-0 z-20 mb-4 flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-white p-3 text-xs shadow-sm">
            <span>Viewing earlier messages</span>
            <Button
              size="sm"
              onClick={() => {
                replyNavigation.returnToLatest();
                requestAnimationFrame(() => scrollToBottom());
              }}
            >
              Return to latest
            </Button>
          </div>
        )}
        {replyNavigation.navigating && (
          <p role="status" className="absolute top-3 left-1/2 z-30 -translate-x-1/2 rounded-lg bg-white px-3 py-2 text-center text-xs text-slate-500 shadow-sm">
            Finding original message…
          </p>
        )}
        {(replyNavigation.browsingHistory
          ? replyNavigation.context.hasPreviousPage
          : history.hasNextPage) && (
          <div className="mb-5 flex justify-center">
            <Button
              size="sm"
              variant="secondary"
              loading={
                replyNavigation.browsingHistory
                  ? replyNavigation.context.isFetching
                  : history.isFetchingNextPage
              }
              leftIcon={<ArrowDown size={14} />}
              onClick={() =>
                void loadOlderPreservingPosition(
                  replyNavigation.browsingHistory
                    ? replyNavigation.context.fetchPreviousPage
                    : history.fetchNextPage,
                )
              }
            >
              Load older messages
            </Button>
          </div>
        )}
        {messages.length === 0 && (
          <EmptyState
            icon={<Wifi size={26} />}
            title="Say hello"
            description="This conversation is ready for its first message."
          />
        )}
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              mine={message.sender.id === user?.id}
              showAuthor={
                index === 0 ||
                messages[index - 1].sender.id !== message.sender.id
              }
              canDelete={message.sender.id === user?.id || canManage}
              receipt={
                message.id === latestOwnMessageId
                  ? receiptLabel(
                      conversation.data,
                      message.sender.id,
                      user?.id,
                      message.sequence,
                      readSequences,
                    )
                  : null
              }
              onReply={() => setReplyingTo(message)}
              onNavigateReply={replyNavigation.navigateTo}
              highlighted={replyNavigation.highlightId === message.id}
              onDelete={() => setDeleteTarget(message)}
            />
          ))}
          {replyNavigation.browsingHistory &&
            replyNavigation.context.hasNextPage && (
              <Button
                variant="secondary"
                size="sm"
                loading={replyNavigation.context.isFetching}
                onClick={() =>
                  void replyNavigation.context
                    .fetchNextPage()
                    .catch(() => toast.error("Could not load newer messages."))
                }
              >
                Load newer messages
              </Button>
            )}
        </div>
        <div ref={bottomRef} />
        {!replyNavigation.browsingHistory && unseenMessages > 0 && (
          <Button
            className="sticky bottom-2 left-1/2 z-10 -translate-x-1/2 shadow-lg"
            size="sm"
            leftIcon={<ArrowDown size={14} />}
            onClick={() => scrollToBottom()}
          >
            {unseenMessages} new {unseenMessages === 1 ? "message" : "messages"}
          </Button>
        )}
      </div>
      <MessageComposer
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSend={send}
        onTyping={realtime.sendTyping}
        disabled={history.isError}
      />
      {detailsOpen && (
        <ConversationDetailsModal
          key={conversationId}
          conversation={conversation.data}
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
        />
      )}
      <DeleteMessageDialog
        message={deleteTarget}
        deleting={remove.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
