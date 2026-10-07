# Realtime Chat Client

Frontend for realtime private and group chat. Built with React and TypeScript, using Vite—not Next.js.

**Stack:** React, TypeScript, Tailwind CSS, React Router, TanStack Query, Axios, STOMP.js and SockJS.

[Backend](https://github.com/tranverse/realtime-chat-server) · [Full system](https://github.com/tranverse/realtime-chat-application)

## Architecture

```text
                    React / TypeScript SPA
                             |
       +---------------------+---------------------+
       |                     |                     |
  Router / Auth        TanStack Query          Preferences
       |                server cache          localStorage
       |                     |
  RealtimeProvider      Axios REST client
       |                     |
  STOMP + SockJS             |
      /ws                /api/v1/**
       |                     |
       +---------------------+
                             |
                 Spring Boot Backend
```

- **REST:** authentication, conversations, history, image uploads and presence snapshots.
- **STOMP:** messages, typing, read receipts and presence updates.
- **TanStack Query:** server-state caching and synchronization.
- **Preferences:** theme, Enter-to-send and in-app notification visibility.

One realtime connection is shared across the authenticated session. Switching conversations changes subscriptions; reconnect refetches persisted state. Auth tokens and preferences are stored in localStorage.

## Features

- OTP registration, password recovery and Google sign-in.
- Private/group chat, member management, invitations and join requests.
- Image sharing, replies, edit/delete, typing, Sent/Seen status and cursor history.
- Online/Offline peer presence and unread-conversation notifications.
- Responsive desktop/mobile layout, Light/Dark/System themes and profile settings.

## Run

Use Node.js 22 and start the backend at `http://localhost:8080`. Copy `.env.example` to `.env` if overriding defaults.

```sh
npm ci
npm run dev
```

Open **http://localhost:5173**. Vite proxies API, WebSocket and backend OAuth routes.

| Variable | Default |
| --- | --- |
| `VITE_API_BASE_URL` | `/api/v1` |
| `VITE_WS_URL` | `/ws` |

These are public build-time settings; never add backend secrets.

## Tests and build

```sh
npm run lint
npm test
npm run build
```

Vitest and React Testing Library cover helpers, components, realtime state, presence and preferences. Full-system Playwright/k6 tests live in the [parent repository](https://github.com/tranverse/realtime-chat-application).

The Docker image serves the build through Nginx; `BACKEND_HOST` configures its backend proxy. `npm run preview` is a static preview without Vite's API proxy.
