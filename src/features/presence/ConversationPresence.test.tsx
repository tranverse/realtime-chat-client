import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Conversation } from "@/types/api";
import { ConversationPresence } from "./ConversationPresence";

const state = vi.hoisted(() => ({
  get: vi.fn(),
  subscribe: vi.fn(),
  callbacks: new Map<string, (frame: { body: string }) => void>(),
  cleanups: new Map<string, ReturnType<typeof vi.fn>>(),
}));
vi.mock("@/lib/apiClient", () => ({ apiClient: { get: state.get } }));
vi.mock("../realtime/RealtimeProvider", () => ({
  useRealtime: () => ({ status: "connected", subscribe: state.subscribe }),
}));
const conversation = {
  type: "PRIVATE",
  memberCount: 2,
  members: [{ user: { id: "me" } }, { user: { id: "peer" } }],
} as Conversation;

describe("conversation presence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.callbacks.clear();
    state.cleanups.clear();
    state.subscribe.mockImplementation((destination, callback) => {
      state.callbacks.set(destination, callback);
      const unsubscribe = vi.fn();
      state.cleanups.set(destination, unsubscribe);
      return unsubscribe;
    });
    state.get.mockResolvedValue({
      data: { data: { userId: "peer", online: true } },
    });
  });
  afterEach(cleanup);
  function mount(value = conversation) {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const content = (item: Conversation) => (
      <QueryClientProvider client={client}>
        <ConversationPresence conversation={item} currentUserId="me" />
      </QueryClientProvider>
    );
    return { ...render(content(value)), content };
  }
  it("shows real online presence from the API", async () => {
    mount();
    expect(await screen.findByText("Online")).toBeVisible();
    expect(state.get).toHaveBeenCalledWith(
      "/users/peer/presence",
      expect.any(Object),
    );
  });
  it("shows offline with neutral styling", async () => {
    state.get.mockResolvedValue({
      data: { data: { userId: "peer", online: false } },
    });
    mount();
    expect(await screen.findByText("Offline")).toHaveClass("text-slate-500");
  });
  it("shows group member count without querying or subscribing to individual presence", async () => {
    mount({ ...conversation, type: "GROUP", memberCount: 4 });
    expect(screen.getByText("4 members")).toBeVisible();
    expect(state.get).not.toHaveBeenCalled();
    expect(state.subscribe).not.toHaveBeenCalled();
  });
  it("updates when a realtime presence transition arrives", async () => {
    mount();
    await screen.findByText("Online");
    act(() =>
      state.callbacks.get("/topic/presence/peer")?.({
        body: JSON.stringify({ userId: "peer", online: false }),
      }),
    );
    expect(await screen.findByText("Offline")).toBeVisible();
  });
  it("unsubscribes the previous participant when switching conversations", async () => {
    const view = mount();
    await screen.findByText("Online");
    const previous = state.cleanups.get("/topic/presence/peer");
    view.rerender(
      view.content({
        ...conversation,
        members: [{ user: { id: "me" } }, { user: { id: "other" } }],
      } as Conversation),
    );
    expect(previous).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(state.subscribe).toHaveBeenCalledWith(
        "/topic/presence/other",
        expect.any(Function),
      ),
    );
  });
  it("never reports an API failure as the other user being offline", async () => {
    state.get.mockRejectedValue(new Error("unavailable"));
    mount();
    expect(await screen.findByText("Presence unavailable")).toBeVisible();
    expect(screen.queryByText("Offline")).not.toBeInTheDocument();
  });
});
