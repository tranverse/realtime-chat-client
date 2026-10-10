import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { useConversationSync } from "./useConversationSync";
const state = vi.hoisted(() => ({
  user: { id: "me" },
  status: "connected",
  navigate: vi.fn(),
  list: vi.fn(),
  subscribe: vi.fn(),
  toast: vi.fn(),
  handlers: new Map<string, (frame: { body: string }) => void>(),
}));
vi.mock("@/features/auth/useAuth", () => ({
  useAuth: () => ({ user: state.user }),
}));
vi.mock("@/features/realtime/RealtimeProvider", () => ({
  useRealtime: () => ({ status: state.status, subscribe: state.subscribe }),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => state.navigate }));
vi.mock("sonner", () => ({
  toast: { success: state.toast, info: state.toast },
}));
vi.mock("./conversationApi", () => ({ conversationApi: { list: state.list } }));
beforeEach(() => {
  vi.clearAllMocks();
  state.handlers.clear();
  state.status = "connected";
  state.subscribe.mockImplementation((destination, handler) => {
    state.handlers.set(destination, handler);
    return () => state.handlers.delete(destination);
  });
  state.list.mockResolvedValue({
    items: [{ id: "known", unreadCount: 2 }],
    page: 0,
    size: 30,
    totalElements: 1,
    totalPages: 1,
    hasNext: false,
  });
});
afterEach(cleanup);
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useConversationSync(), { wrapper });
  return { ...hook, client };
}
it("discovers new groups through the user queue without a prior group subscription", async () => {
  const { client } = mount();
  await waitFor(() =>
    expect(state.handlers.has("/user/queue/conversations")).toBe(true),
  );
  const invalidate = vi.spyOn(client, "invalidateQueries");
  act(() =>
    state.handlers.get("/user/queue/conversations")?.({
      body: JSON.stringify({
        type: "CONVERSATION_CHANGED",
        conversationId: "new",
        conversationName: "Team",
        added: true,
        removed: false,
      }),
    }),
  );
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["conversations"] });
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: ["conversation", "new"],
  });
  expect(state.toast).toHaveBeenCalledWith("You were added to Team.");
});
it("refreshes roles and join requests, removes inaccessible caches", async () => {
  const { client } = mount();
  await waitFor(() =>
    expect(state.handlers.has("/user/queue/conversations")).toBe(true),
  );
  const invalidate = vi.spyOn(client, "invalidateQueries");
  act(() =>
    state.handlers.get("/user/queue/conversations")?.({
      body: JSON.stringify({
        type: "CONVERSATION_CHANGED",
        conversationId: "known",
        reason: "ROLE_UPDATED",
      }),
    }),
  );
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: ["conversation", "known"],
  });
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: ["join-requests", "known"],
  });
  client.setQueryData(["conversation", "known"], { myRole: "OWNER" });
  client.setQueryData(["messages", "known"], { pages: [] });
  act(() =>
    state.handlers.get("/user/queue/conversations")?.({
      body: JSON.stringify({
        type: "CONVERSATION_CHANGED",
        conversationId: "known",
        removed: true,
      }),
    }),
  );
  expect(client.getQueryData(["conversation", "known"])).toBeUndefined();
  expect(client.getQueryData(["messages", "known"])).toBeUndefined();
});
it("refreshes canonical unread state on read events without opening Notifications", async () => {
  const { client, rerender } = mount();
  await waitFor(() =>
    expect(state.handlers.has("/topic/conversations/known")).toBe(true),
  );
  const invalidate = vi.spyOn(client, "invalidateQueries");
  act(() =>
    state.handlers.get("/topic/conversations/known")?.({
      body: JSON.stringify({
        type: "MESSAGES_READ",
        conversationId: "known",
        actorUserId: "me",
        sequence: 5,
      }),
    }),
  );
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["conversations"] });
  state.status = "offline";
  rerender();
  invalidate.mockClear();
  state.status = "connected";
  rerender();
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["conversation"] });
});
