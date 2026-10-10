import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setChatPreferences } from "../settings/preferences";
import { MessageComposer } from "./MessageComposer";

describe("message composer keyboard preferences", () => {
  const send = vi.fn(() => Promise.resolve());
  beforeEach(() => {
    send.mockClear();
    setChatPreferences({
      theme: "light",
      enterToSend: true,
      inAppNotifications: true,
    });
  });
  afterEach(cleanup);
  function mount() {
    render(
      <MessageComposer
        replyingTo={null}
        onCancelReply={vi.fn()}
        onSend={send}
        onTyping={vi.fn()}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(input, { target: { value: "Hello" } });
    return input;
  }
  it("Enter sends when enabled", async () => {
    fireEvent.keyDown(mount(), { key: "Enter" });
    await waitFor(() => expect(send).toHaveBeenCalledOnce());
  });
  it("does not reserve a top margin when no reply or upload status is present", () => {
    const input = mount();
    expect(input.closest("form")).not.toHaveClass("mt-2");
    expect(input.closest("form")?.parentElement).toHaveClass("shrink-0");
    expect(input.closest("form")?.parentElement).toHaveClass("border-t");
    expect(input.closest("form")).toHaveClass("w-full");
    expect(input.closest("form")).not.toHaveClass("max-w-5xl");
    expect(input.closest("form")).not.toHaveClass("border", "shadow-sm", "rounded-2xl");
    expect(input.closest("form")?.parentElement).not.toHaveClass("px-3", "py-3", "pb-3");
  });
  it("Enter does not send when disabled and the button still sends", async () => {
    setChatPreferences((current) => ({ ...current, enterToSend: false }));
    fireEvent.keyDown(mount(), { key: "Enter" });
    expect(send).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
    await waitFor(() => expect(send).toHaveBeenCalledOnce());
  });
  it("Shift+Enter preserves newline input without sending", () => {
    fireEvent.keyDown(mount(), { key: "Enter", shiftKey: true });
    expect(send).not.toHaveBeenCalled();
  });
  it("IME composition Enter never sends", () => {
    fireEvent.keyDown(mount(), { key: "Enter", isComposing: true });
    expect(send).not.toHaveBeenCalled();
  });
  it("legacy IME key code 229 never sends", () => {
    fireEvent.keyDown(mount(), { key: "Enter", keyCode: 229 });
    expect(send).not.toHaveBeenCalled();
  });
});
