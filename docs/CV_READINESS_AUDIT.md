# CV-readiness frontend audit

Audit date: 2026-09-10

The system-wide audit and stabilization plan lives in the backend repository at
`docs/CV_READINESS_AUDIT.md`. This file records the client-specific baseline.

## Baseline

- React 19 and TypeScript SPA built with Vite.
- Lint passes, 5 tests pass and the production build succeeds.
- Authentication refresh requests use a shared single-flight promise.
- Message-created events are deduplicated by the server-generated message ID.
- STOMP reconnect reads the latest access token and component cleanup deactivates the
  previous client.
- Nginx includes SPA fallback plus REST, OAuth and WebSocket proxy locations.

## P0 gaps

- `MESSAGES_READ` events are received but not represented in UI state.
- Loading older pages triggers bottom scrolling rather than preserving viewport position.
- Reconnect restores subscriptions but does not refetch messages/conversation state to
  recover events missed while offline.
- Current tests do not cover send/reconcile, pagination, refresh races or reconnect.
- The repository has an image-level Docker setup but no system-level Compose command.

## Scope guardrails

Fix the verified chat flows before adding presence, reactions, binary uploads, calls or
other optional features. The backend remains the only business application; this SPA
must not introduce another backend or imply a microservice architecture.
