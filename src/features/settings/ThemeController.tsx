import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { applyTheme, useChatPreferences } from "./preferences";

export function ThemeController() {
  const { preferences } = useChatPreferences();
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    applyTheme(preferences.theme),
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function update() {
      setResolved(applyTheme(preferences.theme, media.matches));
    }
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [preferences.theme]);
  return (
    <Toaster theme={resolved} position="top-right" richColors closeButton />
  );
}
