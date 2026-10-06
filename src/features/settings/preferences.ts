import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";
export interface ChatPreferences {
  theme: Theme;
  enterToSend: boolean;
  inAppNotifications: boolean;
}
const KEY = "chat.preferences";
const defaults: ChatPreferences = {
  theme: "system",
  enterToSend: true,
  inAppNotifications: true,
};
const listeners = new Set<() => void>();

function read(): ChatPreferences {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return {
      theme: ["light", "dark", "system"].includes(value.theme)
        ? value.theme
        : "system",
      enterToSend:
        typeof value.enterToSend === "boolean" ? value.enterToSend : true,
      inAppNotifications:
        typeof value.inAppNotifications === "boolean"
          ? value.inAppNotifications
          : true,
    };
  } catch {
    return defaults;
  }
}
let snapshot = read();
function notify() {
  listeners.forEach((listener) => listener());
}
window.addEventListener("storage", (event) => {
  if (event.key === KEY || event.key === null) {
    snapshot = read();
    notify();
  }
});
export function getChatPreferences() {
  return snapshot;
}
export function setChatPreferences(
  update: ChatPreferences | ((current: ChatPreferences) => ChatPreferences),
) {
  snapshot = typeof update === "function" ? update(snapshot) : update;
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* Preferences remain usable when browser storage is unavailable. */
  }
  notify();
}
export function useChatPreferences() {
  const preferences = useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, getChatPreferences);
  return { preferences, setPreferences: setChatPreferences };
}

export function applyTheme(
  theme: Theme,
  systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches,
) {
  const dark = theme === "dark" || (theme === "system" && systemDark);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  return dark ? "dark" : "light";
}
