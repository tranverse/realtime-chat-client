# Luma Realtime Chat Client

Luma is a portfolio-ready realtime chat frontend built as a React single-page application. It consumes the REST and STOMP contracts from [`realtime-chat-server`](https://github.com/tranverse/realtime-chat-server), a Spring Boot modular monolith.

## Highlights

- Complete email authentication: register OTP, sign in, token rotation, sign out, password recovery, and Google OAuth callback.
- Direct and group conversations with user search, member administration, ownership transfer, invitation links, and join-request review.
- Realtime STOMP messaging with authenticated reconnect, typing indicators, read receipts, replies, editing, deletion, and REST fallback.
- Cursor-based history, TanStack Query cache synchronization, route-level code splitting, responsive mobile layout, and accessible UI states.
- Profile management and session revocation.
- Production Docker image with Nginx SPA fallback and REST/WebSocket reverse proxy.

## Stack

React 19, TypeScript, Vite, React Router, TanStack Query, Axios, STOMP.js, SockJS, Zod, Lucide, Vitest, Testing Library, and plain CSS.

This repository intentionally does **not** use Next.js. The browser application is a static SPA; all business logic remains in the Spring Boot monolith.

## Run locally

Requirements: Node.js 22+ and the backend running on `http://localhost:8080`.

```bash
npm install
npm run dev
```

Vite serves the application at `http://localhost:5173` and proxies `/api`, `/ws`, and `/oauth2` to the backend. Copy `.env.example` to `.env` only when you need different endpoints.

```env
VITE_API_BASE_URL=/api/v1
VITE_WS_URL=/ws
```

For direct calls without the Vite/Nginx proxy, use absolute values such as `VITE_API_BASE_URL=http://localhost:8080/api/v1` and `VITE_WS_URL=http://localhost:8080/ws`.

## Quality checks

```bash
npm run lint
npm run test
npm run build
```

## Docker

```bash
docker build -t luma-chat-client .
docker run --rm -p 3000:80 -e BACKEND_HOST=host.docker.internal:8080 luma-chat-client
```

Open `http://localhost:3000`. In a Compose network, set `BACKEND_HOST` to the backend service name, for example `chat-server:8080`.

## Git branches

| Branch | Responsibility |
| --- | --- |
| `chore/frontend-foundation` | Vite/TypeScript setup, design system, API types, test foundation |
| `feature/authentication-ui` | Authentication, OAuth callback, refresh-token handling |
| `feature/conversation-management` | Conversation, membership, invitation, and profile features |
| `feature/realtime-messaging` | History, STOMP events, composer, replies, edits, deletes, read/typing state |
| `chore/frontend-delivery` | Docker, CI, branding, and documentation |
| `feature/chat-client-mvp` | Integration branch containing the complete MVP |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the client structure and backend integration decisions.
