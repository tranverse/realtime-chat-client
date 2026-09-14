# Luma Realtime Chat Client

Luma is the React single-page frontend for a full-stack realtime chat MVP. It consumes the REST and STOMP contracts from [`realtime-chat-server`](https://github.com/tranverse/realtime-chat-server), a Spring Boot modular monolith.

## Highlights

- Complete email authentication: register OTP, sign in, token rotation, sign out, password recovery, and Google OAuth callback.
- Direct and group conversations with user search, member administration, ownership transfer, invitation links, and join-request review.
- Realtime STOMP messaging with authenticated reconnect, typing indicators, read receipts, replies, editing, deletion, and REST fallback.
- Cursor-based history, TanStack Query cache synchronization, route-level code splitting, responsive mobile layout, and accessible UI states.
- Profile management and session revocation.

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, Axios, STOMP.js, SockJS, Zod, Lucide, Vitest, Testing Library, and project-specific CSS.

This repository intentionally does **not** use Next.js. The browser application is a static SPA; all business logic remains in the Spring Boot monolith.

## Run locally

Requirements: Node.js 22+ and the backend running on `http://localhost:8080`.

```bash
npm install
npm run dev
```

Vite serves the application at `http://localhost:5173`. It proxies API, WebSocket, and only the server-side OAuth endpoints to the backend; `/oauth2/callback` remains a React route. Copy `.env.example` to `.env` only when you need different endpoints.

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

## Development workflow

Changes are developed on focused feature, fix, test, or documentation branches, merged
through `develop`, and then integrated into `main`.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the client structure and backend integration decisions.
