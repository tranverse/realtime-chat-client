# Realtime Chat Client

React/TypeScript single-page application for private and group messaging, image sharing, read tracking and real peer presence. The interface talks to a Spring Boot modular-monolith backend through REST and STOMP over SockJS. It uses Vite, not Next.js.

Related repositories: [backend](https://github.com/tranverse/realtime-chat-server) · [system architecture and E2E harness](https://github.com/tranverse/realtime-chat-application).

## Features

- Email/OTP registration, login, password recovery and Google OAuth2 callback/code exchange.
- Private/group conversations, search and All/Unread/Groups filters; member/role management, ownership transfer, invitations and join-request review.
- Realtime text/image messaging, reply previews, edit/delete, typing, Sent/Seen state and cursor history with reconnect reconciliation.
- Profile/group image uploads through the backend media API; image-upload validation and retry feedback.
- Direct-chat Online/Offline presence from the server; group member counts instead of group presence.
- Stable Messages, Notifications and Settings destinations; separate Profile dialog and account/session-revocation actions.
- Persisted Light/Dark/System theme, Enter-to-send and in-app notification visibility, with responsive desktop/mobile chat layout.

## Technology

| Area | Repository configuration |
| --- | --- |
| UI | React 19.2, TypeScript 6.0, Tailwind CSS 4.3 |
| Build | Vite 8.2, Node.js 22 in Docker/CI |
| Routing | React Router 7.18 |
| Server state | TanStack Query 5.102 |
| HTTP/validation | Axios 1.20, Zod 4.5 |
| Realtime | STOMP.js 7.3, SockJS client 1.6 |
| Tests | Vitest 3.2, React Testing Library 16.3, jsdom 27 |
| Quality | TypeScript build checks, oxlint 1.79 |
| Container | Multi-stage Node build, Nginx 1.29 serving the SPA/proxy |

These version lines reflect `package.json` ranges; `package-lock.json` pins the installed dependency graph.

## Architecture

```text
                         React application
                                |
        +-----------------------+-----------------------+
        |                       |                       |
   Router / Auth          TanStack Query            Preferences
        |                  server cache          external store
        |                       |                       |
        |                 Axios REST client         localStorage
        |                       |                 theme / keyboard /
        |                    /api/v1              notifications
        |
   RealtimeProvider (one authenticated-session transport)
        |
   STOMP.js -> SockJS /ws -> Spring Boot
        |
   conversation topics / peer-presence topics / user errors
        |
   cache update, invalidation and REST reconciliation
```

| Boundary | Responsibility |
| --- | --- |
| `src/pages`, router/auth guards | Route composition and protected access |
| `src/features/auth` | Session bootstrap, token acceptance, login/logout and profile loading |
| `src/features/realtime` | Session-scoped connection, subscription registry, reconnect and presence heartbeat |
| `src/features/chat`, `conversations` | Message UI, cursor history, conversation operations and permission-aware controls |
| `src/features/presence` | Snapshot/query state and peer transition subscriptions |
| `src/features/notifications` | Unread-conversation view and inbox reconciliation |
| `src/features/settings`, `profile` | Local preferences, separate profile and existing session actions |
| `src/components`, `src/lib` | Shared UI, HTTP client, token storage, configuration and query client |

REST owns initial/profile/conversation data, mutations, media uploads, history and presence snapshots. STOMP delivers conversation events, typing, read state and presence transitions. TanStack Query owns server-state caching; local preferences are a separate shared external store. Public imports can use the configured `@` alias for `src`.

## Authentication and data flow

```text
Login / OTP / OAuth code exchange -> token store -> GET /users/me
   -> authenticated routes -> RealtimeProvider connects

REST response -> TanStack Query -> UI
STOMP event -> update/invalidate query state -> UI
Reconnect -> restore subscriptions -> refetch persisted state
```

`luma.accessToken` and `luma.refreshToken` are stored in localStorage; the access token also has an in-memory copy. Axios attaches bearer access tokens. A 401 on a non-auth request uses one shared in-flight refresh request per page, rotates the tokens and retries once. Refresh failure clears the local session. This is not an HttpOnly-cookie authentication model, and page-local refresh coordination is not cross-tab token-rotation coordination.

Google login goes through the backend callback, then the client exchanges a short-lived single-use code; raw JWTs are not expected in the callback URL. Sign-out clears client tokens and tears down its socket; logout-all revokes server refresh sessions, not every already-issued access token immediately.

## Realtime lifecycle

`RealtimeProvider` is scoped to the authenticated application session, not the selected conversation. It maintains one STOMP client and a registry of destination callbacks. A destination is unsubscribed when its last consumer is removed.

```text
Login -> connect once
Switch conversation -> clean old conversation/peer subscriptions -> attach new ones
Transport interruption -> delayed Reconnecting / Connection lost notice
Reconnect -> reattach registered topics -> REST refetch/reconcile
Logout -> cancel heartbeat/config request -> deactivate transport
```

Conversation selection does not recreate the connection. CONNECT uses the latest access token. Reconnect delay is 4 seconds; transport heartbeats are separate from the presence heartbeat retrieved from the server. Obsolete-client callbacks cannot overwrite the current client's status.

History uses `beforeSequence` through `useInfiniteQuery`. Created/edited/deleted/read events synchronize message/conversation state; reconnect refetches persisted data. There is no durable socket event replay or guaranteed exactly-once event stream. Controls and authorization ultimately rely on server checks, not UI visibility alone.

## Presence

Direct headers display the other participant's Online/Offline state; groups display `N members`. A green online dot and neutral offline styling do not represent the current client's own transport.

`useUserPresence` combines authenticated `GET /api/v1/users/{userId}/presence` with `/topic/presence/{userId}` transitions. It cleans old peer subscriptions on navigation, cancels stale HTTP snapshots before applying events, refetches on reconnect and reconciles every 30 seconds. Unknown/unavailable data is not fabricated Offline; cached peer presence becomes unknown while the local socket is disconnected.

The shared transport sends `/app/presence/heartbeat` using backend timing (default 25 seconds). The backend tracks tabs/devices independently, with 75-second expiry and a 5-second sweep. Losing one of several sessions does not make the user Offline.

## Settings

`chat.preferences` in localStorage contains validated preferences. `useSyncExternalStore` updates mounted consumers and the browser `storage` event synchronizes changes between tabs.

| Section | Implemented behavior |
| --- | --- |
| Appearance | Light/Dark override the OS; System follows `prefers-color-scheme`, including changes. Root theme is applied before rendering; Tailwind/legacy surfaces and toasts use the resolved palette. |
| Chat | Enter-to-send defaults ON. Shift+Enter inserts a newline. OFF uses Enter for newlines and the send button for submission. IME composition/key code 229 cannot accidentally send. |
| Notifications | Toggles the in-app Notifications destination/badge surfaces without discarding message data or unread state. No browser-push/email preference is advertised. |
| Account | Opens Profile or its existing session controls; sign-out/sign-out-all use existing auth operations. |

Settings does not duplicate the Profile form. Active sessions navigates to existing revocation controls; it does not list device metadata from a nonexistent enumeration API. Notifications is a stable view derived from unread conversations, not a floating popover or durable backend notification feed.

## Responsive UI

The workspace uses a bounded viewport/flex layout. Conversation list and message history scroll within their panels; the composer stays at the bottom of the chat above mobile navigation. Mobile switches between inbox and selected conversation, while desktop keeps both visible. Dialogs, image bubbles and multiline text use the shared Tailwind design system.

## Testing

```sh
npm ci
npm run lint
npm test
npm run build
```

The verified frontend suite has **45 tests across 16 files**, covering validation/helpers, component behavior, media requests, realtime lifecycle/cache synchronization, peer presence, preference persistence/cross-tab updates and keyboard/IME input. Vitest/Testing Library tests use controlled dependencies; they are not a replacement for full-system browser tests.

Lint passes with three non-blocking React warnings; the TypeScript/Vite production build passes. The [parent repository](https://github.com/tranverse/realtime-chat-application) owns Playwright with real backend/MySQL/Redis and k6 regression smoke; its recorded system run passed 7/7 journeys.

## Local development

Use Node.js 22. Start the backend at `http://localhost:8080`, copy `.env.example` to `.env` if overriding defaults, then:

```sh
npm ci
npm run dev
```

Vite runs at `http://localhost:5173`, proxying `/api`, `/ws`, Google authorization and backend OAuth callback routes. Production build/preview:

```sh
npm run build
npm run preview
```

Vite preview is a static build preview; it does not provide the dev server's API proxy. Use the Nginx image or explicit backend URLs for a functional built application:

```sh
docker build -t realtime-chat-client .
docker run --rm -p 5173:80 -e BACKEND_HOST=host.docker.internal:8080 realtime-chat-client
```

`host.docker.internal` works with Docker Desktop; Linux needs an accessible backend hostname/network (or a host-gateway mapping). The parent Compose harness provides the backend service hostname directly.

## Environment variables

| Variable | Default / purpose |
| --- | --- |
| `VITE_API_BASE_URL` | `/api/v1`; build-time REST base URL |
| `VITE_WS_URL` | `/ws`; build-time SockJS endpoint, relative or absolute HTTP(S) URL |
| `BACKEND_HOST` | Nginx runtime upstream; `host.docker.internal:8080` in the Docker image |

Vite-prefixed variables are public build configuration, never a place for JWT signing keys, Google client secrets or Cloudinary API secrets. Image upload credentials stay on the backend. Changing Vite variables requires rebuilding; `BACKEND_HOST` is substituted when Nginx starts.
