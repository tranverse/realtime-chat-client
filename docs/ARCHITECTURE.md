# Frontend architecture

## Scope

Luma Client is a static React + TypeScript SPA. It is not a Next.js application and it does not contain a second business backend. The Spring Boot application remains the single modular monolith; this repository is only its web client.

```mermaid
flowchart LR
    Browser[React SPA]
    REST[REST /api/v1]
    WS[STOMP /ws]
    App[Spring Boot modular monolith]
    Browser -->|JWT + JSON| REST --> App
    Browser <-->|SockJS / WebSocket| WS <--> App
```

## Source boundaries

| Area | Responsibility |
| --- | --- |
| `features/auth` | Token lifecycle, session bootstrap, OTP and OAuth flows |
| `features/conversations` | Conversation list/detail, membership, invite, and join-request operations |
| `features/chat` | Cursor history, STOMP lifecycle, message cache, composer, and message actions |
| `features/profile` | Current-user search and profile operations |
| `components/ui` | Reusable accessible primitives without business logic |
| `lib` | API client, runtime configuration, errors, tokens, and query client |

## Session model

The backend returns access and refresh tokens in JSON. The access token is cached in module memory and mirrored to local storage so the SPA can restore a session after reload. The Axios interceptor performs a single-flight refresh on the first eligible `401`, rotates both tokens, retries the original request once, and emits a session-expired event if rotation fails.

STOMP CONNECT always reads the current access token. Reconnect therefore uses a rotated token instead of retaining a stale token from the first page load.

## Realtime and cache consistency

The active conversation subscribes to `/topic/conversations/{id}` and `/user/queue/errors`. Created, updated, and deleted events update the infinite-message cache. Conversation summaries are invalidated so the server remains authoritative for unread count and last-message metadata.

When the socket is temporarily unavailable, sending and read receipts fall back to REST. Cursor pagination uses `beforeSequence`, matching the monolith contract and avoiding offset drift while new messages arrive.

## Attachment boundary

The composer accepts JPEG, PNG, WebP, and GIF files from the user's device. It validates a 10 MB per-image limit and a maximum of ten images per message, then uploads each file as multipart data to the authenticated backend endpoint `/api/v1/media/images`. The backend returns Cloudinary metadata, which the client includes in the message payload. Partial upload failures keep the failed files available for retry while successfully uploaded images are sent.

## Container packaging

The included Dockerfile builds static assets and serves them from Nginx. The Nginx template provides SPA route fallback and proxy configuration for REST, OAuth, SockJS, and native WebSocket traffic. These files are a local container-packaging option.
