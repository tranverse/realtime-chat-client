# CV-readiness frontend audit

Audit updated: 2026-09-12

The system-wide audit and stabilization plan lives in the backend repository at
`docs/CV_READINESS_AUDIT.md`. This file records the client-specific baseline.

## Baseline

- React 19 and TypeScript SPA built with Vite.
- Lint, 23 unit/component tests, and the optimized application build pass.
- Google OAuth returns a short-lived one-time code instead of tokens in the callback URL.
- Authentication refresh requests use a shared single-flight promise.
- Message-created events are deduplicated by the server-generated message ID.
- STOMP reconnect reads the latest access token and component cleanup deactivates the
  previous client.
- Nginx includes SPA fallback plus REST, OAuth and WebSocket proxy locations.

## Remaining hardening

- Move refresh-token persistence from local storage to an HttpOnly, Secure cookie.
- Add browser-level two-user tests for send, receive, read, reconnect and Google OAuth.
- Add Cloudinary cleanup when upload succeeds but final message creation fails.
- File attachments, reactions and calls remain intentionally outside the current MVP.

## Scope guardrails

Fix the verified chat flows before adding presence, reactions, binary uploads, calls or
other optional features. The backend remains the only business application; this SPA
must not introduce another backend or imply a microservice architecture.
