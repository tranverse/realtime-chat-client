import { Bell, MessageCircle, Settings } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { BrandMark } from "../brand/BrandMark";
import { useAuth } from "../../features/auth/useAuth";
import { useChatPreferences } from "../../features/settings/preferences";

export type WorkspaceView = "messages" | "notifications" | "settings";

export function AppRail({
  view,
  onView,
  onProfile,
}: {
  view: WorkspaceView;
  onView: (view: WorkspaceView) => void;
  onProfile: () => void;
}) {
  const { user } = useAuth();
  const { preferences } = useChatPreferences();
  const items = [
    { id: "messages" as const, label: "Messages", icon: MessageCircle },
    ...(preferences.inAppNotifications
      ? [{ id: "notifications" as const, label: "Notifications", icon: Bell }]
      : []),
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex h-16 shrink-0 items-center justify-around border-t border-slate-800 bg-slate-950 px-3 md:static md:h-dvh md:w-[72px] md:flex-col md:justify-start md:border-r md:border-t-0 md:py-4"
      aria-label="Main navigation"
    >
      <div className="hidden md:block">
        <BrandMark compact />
      </div>
      <div className="flex items-center gap-2 md:mt-8 md:flex-col">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onView(id)}
            className={`grid size-10 place-items-center rounded-xl transition-colors ${view === id ? "bg-indigo-500 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
            aria-label={label}
            aria-current={view === id ? "page" : undefined}
            title={label}
          >
            <Icon size={19} />
          </button>
        ))}
      </div>
      {user && (
        <button
          className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 md:mt-auto"
          onClick={onProfile}
          aria-label="Open profile"
        >
          <Avatar name={user.name} src={user.avatar} size="sm" />
        </button>
      )}
    </nav>
  );
}
