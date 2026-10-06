import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyTheme,
  getChatPreferences,
  setChatPreferences,
  useChatPreferences,
} from "./preferences";

describe("shared application preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    setChatPreferences({
      theme: "system",
      enterToSend: true,
      inAppNotifications: true,
    });
  });
  afterEach(cleanup);
  it("persists theme and removes obsolete density settings", () => {
    setChatPreferences((current) => ({ ...current, theme: "dark" }));
    expect(JSON.parse(localStorage.getItem("chat.preferences")!)).toEqual({
      theme: "dark",
      enterToSend: true,
      inAppNotifications: true,
    });
    applyTheme(getChatPreferences().theme, false);
    expect(document.documentElement).toHaveClass("dark");
  });
  it("system theme follows OS preference and explicit light ignores OS dark", () => {
    applyTheme("system", true);
    expect(document.documentElement).toHaveClass("dark");
    applyTheme("system", false);
    expect(document.documentElement).not.toHaveClass("dark");
    applyTheme("light", true);
    expect(document.documentElement).not.toHaveClass("dark");
  });
  it("updates every consumer immediately and persists notification preference", () => {
    const first = renderHook(useChatPreferences),
      second = renderHook(useChatPreferences);
    act(() =>
      first.result.current.setPreferences((current) => ({
        ...current,
        inAppNotifications: false,
        enterToSend: false,
      })),
    );
    expect(second.result.current.preferences.inAppNotifications).toBe(false);
    expect(second.result.current.preferences.enterToSend).toBe(false);
    expect(
      JSON.parse(localStorage.getItem("chat.preferences")!).inAppNotifications,
    ).toBe(false);
  });
  it("accepts updated preferences from another browser tab", () => {
    const hook = renderHook(useChatPreferences);
    localStorage.setItem(
      "chat.preferences",
      JSON.stringify({
        theme: "light",
        enterToSend: false,
        inAppNotifications: false,
      }),
    );
    act(() =>
      window.dispatchEvent(
        new StorageEvent("storage", { key: "chat.preferences" }),
      ),
    );
    expect(hook.result.current.preferences.theme).toBe("light");
    expect(hook.result.current.preferences.enterToSend).toBe(false);
  });
});
