import { describe, expect, it } from "vitest";
import type { ChatEvent, ChatMessage, PageResponse } from "../../types/api";
import { applyMessageEvent, type MessagePages } from "./messageCache";

const message = {
  id: "m1",
  conversationId: "c1",
  content: "Hello",
  type: "TEXT",
  sequence: 1,
  sender: {
    id: "u1",
    name: "Alex",
    username: null,
    email: "a@b.com",
    avatar: null,
  },
  replyTo: null,
  attachments: [],
  editedAt: null,
  createdAt: "",
  updatedAt: "",
} satisfies ChatMessage;
const page = {
  items: [message],
  page: 0,
  size: 50,
  totalElements: 1,
  totalPages: 1,
  hasNext: false,
} satisfies PageResponse<ChatMessage>;
const data: MessagePages = { pages: [page], pageParams: [undefined] };

describe("applyMessageEvent", () => {
  it("soft-deletes a message without mutating the old cache", () => {
    const afterDelete = applyMessageEvent(data, {
      type: "MESSAGE_DELETED",
      conversationId: "c1",
      actorUserId: "u1",
      messageId: "m1",
      sequence: 1,
    } satisfies ChatEvent)!;
    expect(afterDelete.pages[0].items[0].content).toBeNull();
    expect(data.pages[0].items[0].content).toBe("Hello");
  });
});
