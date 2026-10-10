import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { UnreadBadge } from "./UnreadBadge";

afterEach(cleanup);
it.each([1, 12, 99, 123])("keeps count %s in the same fixed non-stretching circle", count => {
  render(<UnreadBadge count={count} />);
  const badge = screen.getByLabelText(`${count} unread messages`);
  expect(badge).toHaveTextContent(count > 99 ? "99+" : String(count));
  expect(badge).toHaveClass("size-7", "min-h-7", "min-w-7", "shrink-0", "grow-0", "self-center", "items-center", "justify-center", "rounded-full", "p-0");
});
it("removes the badge when the count becomes zero", () => {
  const result = render(<UnreadBadge count={12} />);
  result.rerender(<UnreadBadge count={0} />);
  expect(result.container).toBeEmptyDOMElement();
});
