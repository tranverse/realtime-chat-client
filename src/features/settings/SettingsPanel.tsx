import { LogOut, ShieldOff, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "../auth/useAuth";
import { useChatPreferences } from "./preferences";

export function SettingsPanel({ onProfile }: { onProfile: () => void }) {
  const { logout, logoutAll } = useAuth();
  const { preferences, setPreferences } = useChatPreferences();
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
            Personalize messaging and manage your session.
          </p>
        </header>
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Messaging</h2>
            <label className="mt-4 flex items-center justify-between gap-4">
              <span>
                <strong className="block text-sm text-slate-800">
                  Enter to send
                </strong>
                <small className="text-xs text-slate-500">
                  When disabled, use the Send button.
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
                className="size-5 accent-indigo-600"
              />
            </label>
            <div className="mt-5">
              <span className="text-sm font-medium text-slate-800">
                Message density
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["comfortable", "compact"] as const).map((density) => (
                  <button
                    key={density}
                    type="button"
                    onClick={() =>
                      setPreferences((current) => ({ ...current, density }))
                    }
                    className={`rounded-xl border px-4 py-3 text-left text-sm capitalize ${preferences.density === density ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Account and sessions
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                leftIcon={<UserRound size={15} />}
                onClick={onProfile}
              >
                Edit profile
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
                Sign out everywhere
              </Button>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
