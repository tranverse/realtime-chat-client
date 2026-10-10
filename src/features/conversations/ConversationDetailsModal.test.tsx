import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ConversationDetailsModal } from "./ConversationDetailsModal";
import { conversationApi } from "./conversationApi";
import { userApi } from "@/features/profile/userApi";
import type { Conversation } from "@/types/api";
vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ user: { id: "owner" } }),
}));
vi.mock("../../components/ui/AvatarUpload", () => ({
  AvatarUpload: () => null,
}));
vi.mock("./conversationApi", () => ({
  conversationApi: {
    joinRequests: vi.fn(),
    addMembers: vi.fn(),
    transferOwnership: vi.fn(),
    updateRole: vi.fn(),
    removeMember: vi.fn(),
  },
}));
vi.mock("@/features/profile/userApi", () => ({ userApi: { search: vi.fn() } }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
const owner = {
  id: "owner",
  name: "Owner",
  username: "owner",
  email: "owner@example.com",
  avatar: null,
};
const bob = { ...owner, id: "bob", name: "Bob", username: "bob" };
const group: Conversation = {
  id: "group",
  name: "Team",
  type: "GROUP",
  avatar: null,
  maxMembers: 10,
  memberCount: 2,
  unreadCount: 0,
  myRole: "OWNER",
  lastMessage: null,
  createdAt: "",
  updatedAt: "",
  members: [
    {
      id: "m1",
      user: owner,
      role: "OWNER",
      status: "ACTIVE",
      joinedAt: "",
      lastReadSequence: null,
    },
    {
      id: "m2",
      user: bob,
      role: "MEMBER",
      status: "ACTIVE",
      joinedAt: "",
      lastReadSequence: null,
    },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(conversationApi.joinRequests).mockResolvedValue([]);
});
afterEach(cleanup);
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConversationDetailsModal conversation={group} open onClose={vi.fn()} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}
it("requires confirmation and explains ownership transfer, reports success only after response", async () => {
  let resolve!: (value: Conversation) => void;
  vi.mocked(conversationApi.transferOwnership).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Transfer ownership" }));
  expect(screen.getByText(/You will become an admin/)).toBeVisible();
  expect(conversationApi.transferOwnership).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() =>
    expect(conversationApi.transferOwnership).toHaveBeenCalledWith(
      "group",
      "bob",
    ),
  );
  expect(toast.success).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  resolve(group);
  await waitFor(() => expect(toast.success).toHaveBeenCalled());
});
it("confirms role changes and leaves confirmation available on API failure", async () => {
  vi.mocked(conversationApi.updateRole).mockRejectedValue(new Error("Denied"));
  mount();
  fireEvent.change(screen.getByRole("combobox", { name: "Role for Bob" }), {
    target: { value: "ADMIN" },
  });
  expect(conversationApi.updateRole).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() => expect(toast.error).toHaveBeenCalled());
  expect(toast.success).not.toHaveBeenCalled();
  expect(
    screen.getByRole("dialog", { name: "Change member role?" }),
  ).toBeVisible();
});
it("does not remove a member when confirmation is cancelled", () => {
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Remove member" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(conversationApi.removeMember).not.toHaveBeenCalled();
});
it("keeps selections after failed addition and clears them after confirmed success", async () => {
  const carol = { ...bob, id: "carol", name: "Carol", username: "carol" };
  vi.mocked(userApi.search).mockResolvedValue({
    items: [carol],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    hasNext: false,
  });
  vi.mocked(conversationApi.addMembers)
    .mockRejectedValueOnce(new Error("Denied"))
    .mockResolvedValue(group);
  mount();
  fireEvent.change(
    screen.getByRole("textbox", { name: "Search people to add" }),
    { target: { value: "carol" } },
  );
  fireEvent.click(
    await screen.findByRole(
      "button",
      { name: /Carol @carol/ },
      { timeout: 5000 },
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Add members" }));
  await waitFor(() => expect(toast.error).toHaveBeenCalled());
  expect(screen.getByText("1 selected")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Add members" }));
  await waitFor(() => expect(screen.getByText("0 selected")).toBeVisible());
  expect(conversationApi.addMembers).toHaveBeenCalledWith("group", ["carol"]);
});
