import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { toast } from "sonner";
import type { ChatMessage, MessageContext } from "@/types/api";
import { messageApi } from "./messageApi";
import { centeredScrollTop, useReplyNavigation } from "./useReplyNavigation";

vi.mock("./messageApi", () => ({ messageApi: { context: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
const message = (id: string, sequence: number): ChatMessage => ({
  id,
  sequence,
  conversationId: "one",
  content: id,
  type: "TEXT",
  replyTo: null,
  sender: {
    id: "user",
    name: "User",
    username: "user",
    email: "user@example.com",
    avatar: null,
  },
  attachments: [],
  editedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
const windowOf = (id: string): MessageContext => ({
  items: [message(id, 1)],
  hasOlder: false,
  hasNewer: false,
});
const scroll = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  HTMLElement.prototype.scrollTo = scroll;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Harness({ conversationId = "one" }: { conversationId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const navigation = useReplyNavigation(
    conversationId,
    [message("loaded", 100)],
    ref,
  );
  return (
    <>
      {["loaded", "old", "other", "missing"].map((id) => (
        <button key={id} onClick={() => navigation.navigateTo(id)}>
          jump {id}
        </button>
      ))}
      <button onClick={navigation.returnToLatest}>latest</button>
      <button onClick={() => void navigation.context.fetchPreviousPage()}>
        older
      </button>
      <button onClick={() => void navigation.context.fetchNextPage()}>
        newer
      </button>
      <div ref={ref}>
        {navigation.messages.map((item) => (
          <article
            tabIndex={-1}
            key={item.id}
            data-message-id={item.id}
            data-highlighted={navigation.highlightId === item.id}
          >
            {item.content ?? "Message deleted"}
          </article>
        ))}
      </div>
    </>
  );
}
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const result = render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  );
  return { ...result, client };
}

it("centers a loaded target without fetching, highlights temporarily and respects reduced motion", async () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  mount();
  fireEvent.click(screen.getByText("jump loaded"));
  await waitFor(() =>
    expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: "auto" }),
  );
  expect(messageApi.context).not.toHaveBeenCalled();
  expect(screen.getByText("loaded")).toHaveAttribute(
    "data-highlighted",
    "true",
  );
  await waitFor(
    () =>
      expect(screen.getByText("loaded")).toHaveAttribute(
        "data-highlighted",
        "false",
      ),
    { timeout: 3000 },
  );
});

it("loads a deep target in one bounded request and keeps latest cache independent", async () => {
  vi.mocked(messageApi.context).mockResolvedValue(windowOf("old"));
  const { client } = mount();
  client.setQueryDefaults(["messages", "one"], { gcTime: Infinity });
  client.setQueryData(["messages", "one"], { untouched: true });
  fireEvent.click(screen.getByText("jump old"));
  await waitFor(() =>
    expect(screen.getByText("old")).toHaveAttribute("data-highlighted", "true"),
  );
  expect(messageApi.context).toHaveBeenCalledTimes(1);
  expect(client.getQueryData(["messages", "one"])).toEqual({ untouched: true });
  fireEvent.click(screen.getByText("latest"));
  expect(screen.getByText("loaded")).toBeVisible();
});

it("displays a deleted tombstone and reports inaccessible targets", async () => {
  vi.mocked(messageApi.context)
    .mockResolvedValueOnce({
      ...windowOf("old"),
      items: [{ ...message("old", 1), content: null }],
    })
    .mockRejectedValueOnce(new Error("Forbidden"));
  mount();
  fireEvent.click(screen.getByText("jump old"));
  await screen.findByText("Message deleted");
  fireEvent.click(screen.getByText("jump missing"));
  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("no longer accessible"),
    ),
  );
});

it("rapid clicks cannot let the older response steal the scroll target", async () => {
  let resolveOld!: (value: MessageContext) => void;
  vi.mocked(messageApi.context).mockImplementation((_conversation, id) =>
    id === "old"
      ? new Promise((resolve) => {
          resolveOld = resolve;
        })
      : Promise.resolve(windowOf(id)),
  );
  mount();
  fireEvent.click(screen.getByText("jump old"));
  await waitFor(() => expect(messageApi.context).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByText("jump other"));
  await waitFor(() =>
    expect(screen.getByText("other")).toHaveAttribute(
      "data-highlighted",
      "true",
    ),
  );
  const calls = scroll.mock.calls.length;
  await act(async () => resolveOld(windowOf("old")));
  expect(scroll).toHaveBeenCalledTimes(calls);
  expect(screen.queryByText("old")).not.toBeInTheDocument();
});

it("conversation switch aborts an in-flight navigation and prevents late scrolling", async () => {
  let signal: AbortSignal | undefined;
  vi.mocked(messageApi.context).mockImplementation(
    (_conversation, _id, requestSignal) => {
      signal = requestSignal;
      return new Promise(() => {});
    },
  );
  const result = mount();
  fireEvent.click(screen.getByText("jump old"));
  await waitFor(() => expect(signal).toBeDefined());
  result.rerender(
    <QueryClientProvider client={result.client}>
      <Harness key="two" conversationId="two" />
    </QueryClientProvider>,
  );
  expect(signal?.aborted).toBe(true);
  expect(scroll).not.toHaveBeenCalled();
});

it("expands history in both directions without duplicates and ignores background refetch for navigation", async () => {
  vi.mocked(messageApi.context).mockImplementation(
    async (_conversation, id) => {
      if (id === "old")
        return {
          items: [message("first", 1), message("old", 2), message("third", 3)],
          hasOlder: true,
          hasNewer: true,
        };
      if (id === "first")
        return {
          items: [message("zero", 0), message("first", 1), message("old", 2)],
          hasOlder: false,
          hasNewer: true,
        };
      return {
        items: [message("old", 2), message("third", 3), message("fourth", 4)],
        hasOlder: true,
        hasNewer: false,
      };
    },
  );
  const { client } = mount();
  fireEvent.click(screen.getByText("jump old"));
  await screen.findByText("old");
  fireEvent.click(screen.getByText("older"));
  await screen.findByText("zero");
  fireEvent.click(screen.getByText("newer"));
  await screen.findByText("fourth");
  expect(screen.getAllByText("old")).toHaveLength(1);
  await waitFor(() => expect(scroll).toHaveBeenCalledTimes(1));
  await act(async () => {
    await client.invalidateQueries({ queryKey: ["reply-history", "one"] });
  });
  expect(scroll).toHaveBeenCalledTimes(1);
});

it("calculates centering relative to the chat container, not the document", () => {
  const container = document.createElement("div"),
    target = document.createElement("article");
  Object.defineProperties(container, {
    scrollTop: { value: 200 },
    clientHeight: { value: 400 },
  });
  Object.defineProperty(target, "offsetHeight", { value: 40 });
  container.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
  target.getBoundingClientRect = () => ({ top: 500 }) as DOMRect;
  expect(centeredScrollTop(container, target)).toBe(420);
});
