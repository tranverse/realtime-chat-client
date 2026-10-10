import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type RefObject } from "react";
import { toast } from "sonner";
import type { ChatMessage } from "@/types/api";
import { messageApi } from "./messageApi";

export function centeredScrollTop(container: HTMLElement, target: HTMLElement) {
  return Math.max(
    0,
    container.scrollTop +
      target.getBoundingClientRect().top -
      container.getBoundingClientRect().top -
      (container.clientHeight - target.offsetHeight) / 2,
  );
}

/** Separate cursor window: never splice a disconnected range into the latest-history cache. */
export function useReplyNavigation(
  conversationId: string,
  latestMessages: ChatMessage[],
  historyRef: RefObject<HTMLDivElement | null>,
) {
  const [contextTarget, setContextTarget] = useState<string | null>(null);
  const [goal, setGoal] = useState<{ id: string } | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const context = useInfiniteQuery({
    queryKey: ["reply-history", conversationId, contextTarget],
    queryFn: ({ pageParam, signal }) =>
      messageApi.context(conversationId, pageParam, signal),
    initialPageParam: contextTarget ?? "",
    enabled: contextTarget !== null,
    placeholderData: keepPreviousData,
    getNextPageParam: (page) =>
      page.hasNewer ? page.items.at(-1)?.id : undefined,
    getPreviousPageParam: (page) =>
      page.hasOlder ? page.items[0]?.id : undefined,
    retry: false,
  });
  const messages = useMemo(() => {
    if (!contextTarget || !context.data) return latestMessages;
    const unique = new Map(
      context.data.pages
        .flatMap((page) => page.items)
        .map((message) => [message.id, message]),
    );
    return [...unique.values()].sort((a, b) => a.sequence - b.sequence);
  }, [contextTarget, context.data, latestMessages]);

  function navigateTo(id: string) {
    if (!messages.some((message) => message.id === id)) {
      setContextTarget(
        latestMessages.some((message) => message.id === id) ? null : id,
      );
    }
    setHighlightId(null);
    setGoal({ id });
  }

  useEffect(() => {
    if (!goal) return;
    if (contextTarget && !context.isError && (context.isPlaceholderData || !context.data)) return;
    const frame = requestAnimationFrame(() => {
      if (contextTarget && context.isError) {
        toast.error("Original message could not be found or is no longer accessible.");
        setGoal(null);
        setContextTarget(null);
        return;
      }
      if (!messages.some((message) => message.id === goal.id)) {
        toast.error("Original message could not be found.");
        setGoal(null);
        return;
      }
      const container = historyRef.current;
      const target = Array.from(
        container?.querySelectorAll<HTMLElement>("[data-message-id]") ?? [],
      ).find((element) => element.dataset.messageId === goal.id);
      if (!container || !target) return;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      container.scrollTo({
        top: centeredScrollTop(container, target),
        behavior: reduced ? "auto" : "smooth",
      });
      target.focus({ preventScroll: true });
      setHighlightId(goal.id);
      setGoal(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [
    goal,
    messages,
    contextTarget,
    context.isError,
    context.isPlaceholderData,
    context.data,
    historyRef,
  ]);

  useEffect(() => {
    if (!highlightId) return;
    const timer = window.setTimeout(() => setHighlightId(null), 1600);
    return () => window.clearTimeout(timer);
  }, [highlightId]);

  return {
    messages,
    context,
    navigateTo,
    highlightId,
    browsingHistory: contextTarget !== null,
    navigating: goal !== null,
    pauseAutoScroll:
      contextTarget !== null || goal !== null || highlightId !== null,
    returnToLatest: () => {
      setGoal(null);
      setHighlightId(null);
      setContextTarget(null);
    },
  };
}
