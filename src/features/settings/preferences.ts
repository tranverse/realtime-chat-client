import { useEffect, useState } from "react";

export type MessageDensity = "comfortable" | "compact";
export interface ChatPreferences {
  enterToSend: boolean;
  density: MessageDensity;
}

const STORAGE_KEY = "chat.preferences";
const defaults: ChatPreferences = { enterToSend: true, density: "comfortable" };

export function getChatPreferences(): ChatPreferences {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"),
    };
  } catch {
    return defaults;
  }
}

export function useChatPreferences() {
  const [preferences, setPreferences] = useState(getChatPreferences);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);
  return { preferences, setPreferences };
}
