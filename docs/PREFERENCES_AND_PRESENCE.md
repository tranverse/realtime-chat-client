# Presence and application preferences

## Presence

Direct-chat headers display the other participant's server presence. Group headers display member count. The client's socket state is a separate concern: transport interruptions show delayed `Reconnecting…` / `Connection lost` notices and do not determine the remote user's online status.

`useUserPresence` obtains an authenticated snapshot, subscribes to `/topic/presence/{userId}`, cleans the previous subscription on conversation changes and reconciles on reconnect/every 30 seconds. Realtime events cancel stale snapshot requests before updating query state. Unavailable snapshots display unknown/unavailable presence; they do not fabricate Offline.

The session-scoped `RealtimeProvider` retains one STOMP client across navigation. Presence heartbeats use `/app/presence/heartbeat`, with the interval retrieved from the backend. Heartbeat timers and pending configuration requests stop on disconnect/logout and restart on reconnect. The old user avatar's hardcoded online indicator is removed.

## Preferences

`chat.preferences` in localStorage contains validated `theme`, `enterToSend` and `inAppNotifications` values. A shared external store updates all mounted consumers and synchronizes changes between tabs through the storage event. Legacy density is no longer consumed or displayed.

- Theme defaults to System. Light/Dark override the OS; System responds to `prefers-color-scheme` changes. The root class is applied before React renders. Tailwind's class-based dark variant, a shared surface palette and legacy CSS variables cover workspace, authentication, dialogs, forms and notifications. Toasts follow the resolved theme.
- Enter-to-send defaults to enabled. Shift+Enter always inserts a line break; disabling it uses Enter for new lines and the Send button for submission. IME composition and legacy key code 229 do not submit messages. Message text preserves line breaks.
- Disabling in-app notifications hides the Notifications destination, while retaining unread counts, conversation data, messaging subscriptions and read receipts. It does not claim browser push/email notification support.
- Account actions open the existing Profile/session-management UI or use existing sign-out operations. Active sessions links to session revocation controls; no device/session enumeration API is invented.

Profile/group image uploads continue to use the existing media API. Notifications stays a stable destination. The viewport/flex scrolling layout and shared messaging subscriptions remain in place.

## Verification

Tests cover API/realtime presence, offline/unavailable states, group counts, subscription cleanup, one transport across navigation, heartbeat lifecycle/reconnect, theme and notification persistence, cross-tab preferences, and keyboard/IME behavior. Run `npm run lint`, `npm test`, `npm run build` and the parent system E2E workflow. System browser results and merged SHAs are recorded in the parent implementation report after verification.
