import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ChatMessage } from "@/types/api";
import { MessageBubble } from "./MessageBubble";

afterEach(cleanup);
const sender = {
  id: "user",
  name: "User",
  username: "user",
  email: "user@example.com",
  avatar: null,
};
const message: ChatMessage = {
  id: "reply",
  conversationId: "one",
  sequence: 2,
  content: "Reply content",
  type: "TEXT",
  sender,
  replyTo: { id: "original", sequence: 1, content: "Original", sender },
  attachments: [],
  editedAt: "2026-06-01T00:00:00Z",
  createdAt: "2026-06-01T00:00:00Z",
  updatedAt: "2026-06-01T00:00:00Z",
};
it("has no editing UI even for historical edited messages, while reply and delete remain", () => {
  const reply = vi.fn(),
    remove = vi.fn();
  render(
    <MessageBubble
      message={message}
      mine
      canDelete
      receipt="Sent"
      onReply={reply}
      onDelete={remove}
      onNavigateReply={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  expect(
    screen.queryByRole("button", { name: "Edit" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.getByText("Reply content")).toBeVisible();
  fireEvent.click(
    screen.getAllByRole("button", { name: "Reply" }).at(-1)!,
  );
  expect(reply).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  expect(remove).toHaveBeenCalledOnce();
});
it("exposes a native keyboard-accessible quoted button with a stable target ID", () => {
  const navigate = vi.fn();
  render(
    <MessageBubble
      message={message}
      mine
      canDelete
      receipt={null}
      onReply={vi.fn()}
      onDelete={vi.fn()}
      onNavigateReply={navigate}
      highlighted
    />,
  );
  const quote = screen.getByRole("button", {
    name: "Go to original message from User",
  });
  quote.focus();
  expect(quote).toHaveFocus();
  fireEvent.click(quote);
  expect(navigate).toHaveBeenCalledWith("original");
  expect(screen.getByRole("article")).toHaveAttribute(
    "data-message-id",
    "reply",
  );
  expect(screen.getByRole("article")).toHaveAttribute(
    "data-highlighted",
    "true",
  );
});
it("keeps a deleted-original preview navigable", () => {
  const navigate = vi.fn();
  render(
    <MessageBubble
      message={{ ...message, replyTo: { ...message.replyTo!, content: null } }}
      mine
      canDelete
      receipt={null}
      onReply={vi.fn()}
      onDelete={vi.fn()}
      onNavigateReply={navigate}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Go to original message from User" }),
  );
  expect(screen.getByText("Deleted message")).toBeVisible();
  expect(navigate).toHaveBeenCalledWith("original");
});
