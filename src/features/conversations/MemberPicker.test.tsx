import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemberPicker } from "./MemberPicker";
import { userApi } from "@/features/profile/userApi";
vi.mock("@/features/profile/userApi", () => ({ userApi: { search: vi.fn() } }));
const bob = {
  id: "bob",
  name: "Bob",
  username: "bob",
  email: "bob@example.com",
  avatar: null,
};
const carol = { ...bob, id: "carol", name: "Carol", username: "carol" };
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
function mount(onAdd = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemberPicker memberIds={["owner"]} pending={false} onAdd={onAdd} />
    </QueryClientProvider>,
  );
  return onAdd;
}
it("keeps input focused, debounces search and confirms multiple unique selections", async () => {
  vi.mocked(userApi.search).mockResolvedValue({
    items: [bob, carol, { ...bob, id: "owner", name: "Owner" }],
    page: 0,
    size: 20,
    totalElements: 3,
    totalPages: 1,
    hasNext: false,
  });
  const add = mount();
  const input = screen.getByRole("textbox", { name: "Search people to add" });
  input.focus();
  fireEvent.change(input, { target: { value: "b" } });
  fireEvent.change(input, { target: { value: "bo" } });
  expect(await screen.findByRole("button", { name: /Bob/ })).toBeVisible();
  expect(input).toHaveFocus();
  expect(userApi.search).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: /Owner/ })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: /Bob @bob/ }));
  fireEvent.click(screen.getByRole("button", { name: /Carol @carol/ }));
  expect(add).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Add members" }));
  expect(add).toHaveBeenCalledWith(["bob", "carol"], expect.any(Function));
  fireEvent.click(screen.getByRole("button", { name: /Bob @bob/ }));
  expect(screen.getByText("1 selected")).toBeVisible();
});
it("shows empty results", async () => {
  vi.mocked(userApi.search).mockResolvedValue({
    items: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
  });
  mount();
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "nobody" },
  });
  expect(await screen.findByText(/No people found/)).toBeVisible();
});
it("shows API errors without losing focus and allows retry", async () => {
  vi.mocked(userApi.search).mockRejectedValue(new Error("network"));
  mount();
  const input = screen.getByRole("textbox");
  input.focus();
  fireEvent.change(input, { target: { value: "error" } });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "People could not be loaded",
  );
  expect(input).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(userApi.search).toHaveBeenCalledTimes(2));
});
