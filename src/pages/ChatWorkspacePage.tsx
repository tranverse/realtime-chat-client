import { MessageCircleHeart } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { AppRail, type WorkspaceView } from "../components/layout/AppRail";
import { EmptyState } from "../components/ui/EmptyState";
import { ConversationList } from "../features/conversations/ConversationList";
import { ChatConversation } from "../features/chat/ChatConversation";
import { CreateConversationModal } from "../features/conversations/CreateConversationModal";
import { ProfileModal } from "../features/profile/ProfileModal";
import { NotificationsPanel } from "../features/notifications/NotificationsPanel";
import { SettingsPanel } from "../features/settings/SettingsPanel";
import { useChatPreferences } from "../features/settings/preferences";
import { useConversationSync } from "../features/conversations/useConversationSync";

export function ChatWorkspacePage() {
  useConversationSync();
  const { conversationId } = useParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSection, setProfileSection] = useState<"profile" | "sessions">(
    "profile",
  );
  const { preferences } = useChatPreferences();
  const [view, setView] = useState<WorkspaceView>("messages");
  const activeView =
    view === "notifications" && !preferences.inAppNotifications
      ? "messages"
      : view;
  return (
    <main className="flex h-dvh min-h-0 overflow-hidden bg-white pb-16 text-slate-950 md:pb-0">
      <AppRail
        view={activeView}
        onView={setView}
        onProfile={() => {
          setProfileSection("profile");
          setProfileOpen(true);
        }}
      />
      {activeView === "messages" && (
        <>
          <div
            className={
              conversationId
                ? "hidden h-full min-h-0 w-full shrink-0 md:block md:w-[340px]"
                : "h-full min-h-0 w-full shrink-0 md:block md:w-[340px]"
            }
          >
            <ConversationList onCreate={() => setCreateOpen(true)} />
          </div>
          <section
            className={
              conversationId
                ? "h-full min-h-0 min-w-0 flex-1 bg-slate-50"
                : "hidden h-full min-h-0 min-w-0 flex-1 bg-slate-50 md:block"
            }
          >
            {conversationId ? (
              <ChatConversation
                key={conversationId}
                conversationId={conversationId}
              />
            ) : (
              <EmptyState
                icon={<MessageCircleHeart size={27} />}
                title="Choose a conversation"
                description="Realtime messages, attachments, and read receipts will appear here."
              />
            )}
          </section>
        </>
      )}
      {activeView === "notifications" && (
        <NotificationsPanel onSelect={() => setView("messages")} />
      )}
      {activeView === "settings" && (
        <SettingsPanel
          onProfile={() => {
            setProfileSection("profile");
            setProfileOpen(true);
          }}
          onSessions={() => {
            setProfileSection("sessions");
            setProfileOpen(true);
          }}
        />
      )}
      <CreateConversationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      {profileOpen && (
        <ProfileModal
          key={profileSection}
          open
          onClose={() => setProfileOpen(false)}
          section={profileSection}
        />
      )}
    </main>
  );
}
