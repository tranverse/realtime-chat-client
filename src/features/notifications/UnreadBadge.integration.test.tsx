import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import type { Conversation, PageResponse } from "@/types/api";
import { NotificationsPanel } from "./NotificationsPanel";
import { ConversationList } from "../conversations/ConversationList";
import { conversationApi } from "../conversations/conversationApi";

vi.mock("../auth/useAuth", () => ({ useAuth: () => ({ user: { id: "me" } }) }));
vi.mock("../conversations/conversationApi", () => ({ conversationApi: { list: vi.fn() } }));
afterEach(cleanup);
const item: Conversation = {
  id: "group", name: "Team", type: "GROUP", avatar: null, maxMembers: 10, memberCount: 2,
  unreadCount: 12, myRole: "MEMBER", lastMessage: null,
  createdAt: "2026-10-10T00:00:00Z", updatedAt: "2026-10-10T00:00:00Z",
};
const page: PageResponse<Conversation> = { items: [item], page: 0, size: 30, totalElements: 1, totalPages: 1, hasNext: false };

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(["conversations"], page);
  const select = vi.fn();
  render(<QueryClientProvider client={client}><MemoryRouter>
    <NotificationsPanel onSelect={select} /><ConversationList onCreate={vi.fn()} />
  </MemoryRouter></QueryClientProvider>);
  return { client, select };
}
it("uses identical badge geometry in notification cards and the sidebar", () => {
  mount();
  const badges = screen.getAllByLabelText("12 unread messages");
  expect(badges).toHaveLength(2);
  expect(badges[0].className).toBe(badges[1].className);
  expect(badges[0].closest("button")).toHaveClass("items-center", "p-4");
});
it("does not clear on selection, then removes both badges after confirmed server read state", async () => {
  vi.mocked(conversationApi.list).mockResolvedValue({ ...page, items: [{ ...item, unreadCount: 0 }] });
  const { client, select } = mount();
  fireEvent.click(screen.getByRole("button", { name: /Team/ }));
  expect(select).toHaveBeenCalledOnce();
  expect(screen.getAllByLabelText("12 unread messages")).toHaveLength(2);
  await act(async () => { await client.invalidateQueries({ queryKey: ["conversations"] }); });
  await waitFor(() => expect(screen.queryByLabelText("12 unread messages")).not.toBeInTheDocument());
  expect(screen.getByText("No unread messages")).toBeVisible();
});
