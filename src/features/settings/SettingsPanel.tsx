import {
  LogOut,
  ShieldOff,
  UserRound,
  Monitor,
  Moon,
  Sun,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "../auth/useAuth";
import { useChatPreferences, type Theme } from "./preferences";

export function SettingsPanel({
  onProfile,
  onSessions,
}: {
  onProfile: () => void;
  onSessions: () => void;
}) {
  const { logout, logoutAll } = useAuth();
  const { preferences, setPreferences } = useChatPreferences();
  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];
  return (
    <section
      className="h-full min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-6 sm:px-8"
      aria-labelledby="settings-title"
    >
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Preferences
          </p>
          <h1
            id="settings-title"
            className="mt-1 text-2xl font-bold text-slate-950"
          >
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Make this space feel like yours.
          </p>
        </header>
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Appearance</h2>
            <fieldset className="mt-4">
              <legend className="mb-2 text-sm text-slate-600">Theme</legend>
              <div className="grid grid-cols-3 gap-2">
                {themes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={preferences.theme === value}
                    onClick={() =>
                      setPreferences((current) => ({
                        ...current,
                        theme: value,
                      }))
                    }
                    className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${preferences.theme === value ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Chat</h2>
            <label className="mt-4 flex items-center justify-between gap-4">
              <span>
                <strong className="block text-sm text-slate-800">
                  Enter to send
                </strong>
                <small className="text-xs text-slate-500">
                  Use Shift+Enter for a new line. Turn off to send with the
                  button.
                </small>
              </span>
              <input
                type="checkbox"
                checked={preferences.enterToSend}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    enterToSend: event.target.checked,
                  }))
                }
                className="size-5 shrink-0 accent-indigo-600"
              />
            </label>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Notifications</h2>
            <label className="mt-4 flex items-center justify-between gap-4">
              <span>
                <strong className="block text-sm text-slate-800">
                  Show in-app notifications
                </strong>
                <small className="text-xs text-slate-500">
                  Show the Notifications destination. Your unread messages stay
                  in Messages.
                </small>
              </span>
              <input
                type="checkbox"
                checked={preferences.inAppNotifications}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    inAppNotifications: event.target.checked,
                  }))
                }
                className="size-5 shrink-0 accent-indigo-600"
              />
            </label>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Account</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button
                variant="secondary"
                leftIcon={<UserRound size={15} />}
                onClick={onProfile}
              >
                Edit profile
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Laptop size={15} />}
                onClick={onSessions}
              >
                Active sessions
              </Button>
              <Button
                variant="secondary"
                leftIcon={<LogOut size={15} />}
                onClick={() => void logout()}
              >
                Sign out
              </Button>
              <Button
                variant="danger"
                leftIcon={<ShieldOff size={15} />}
                onClick={() => void logoutAll()}
              >
                Sign out all
              </Button>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
