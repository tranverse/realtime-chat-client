# Frontend UI Refactor Summary

## Areas Refactored

- Responsive application shell, desktop navigation rail, conversation sidebar, and mobile list-to-chat navigation.
- Conversation search, filters, selected/unread states, timestamps, truncation, loading, error, and empty states.
- Chat header, independently scrollable message history, grouped message presentation, read receipts, typing status, and new-message control.
- Message composer, reply context, image retry feedback, attachment controls, and disabled/focus states.
- Notification popover, shared buttons, avatars, dialogs, empty states, and neutral product branding.

## Components Changed

- `BrandMark`, `Button`, `Modal`, `EmptyState`, `Avatar`, and `AppRail`.
- `ChatWorkspacePage`, `ConversationList`, `ChatConversation`, `MessageBubble`, and `MessageComposer`.
- `NotificationButton`, conversation dialogs, authentication copy, and invitation copy.

## CSS and Dependencies

- Core workspace and messaging presentation moved from legacy selector blocks to Tailwind utilities.
- Obsolete brand, button, layout, conversation, message, composer, and notification CSS was removed.
- `react-icons` was removed; Lucide React is now the single icon system.
- No UI framework or animation dependency was added.

## Responsive Improvements

- Desktop uses a 72px navigation rail, 340px conversation sidebar, and flexible chat panel.
- Mobile shows either the conversation list or selected chat, with an explicit back control.
- The viewport shell is fixed to `100dvh`; only conversation and message lists scroll.
- Message widths, composer controls, and notification positioning adapt to smaller screens without horizontal scrolling.

## Accessibility Improvements

- Icon-only actions retain accessible names through the shared button component.
- Interactive controls have visible keyboard focus rings and semantic button elements.
- Dialogs preserve modal semantics, Escape handling, and labelled headings.
- Search, message, upload, role, notification, and navigation controls keep explicit labels.
- Text and secondary metadata use contrast-aware neutral colors.

## Verification

- `npm run lint`: passed.
- `npm test`: 12 files and 27 tests passed.
- `npm run build`: passed.
- Playwright system E2E: not run because the Docker Desktop engine was not accessible from this environment (`dockerDesktopLinuxEngine` named-pipe access denied).

## Known UI Limitations

- Presence remains limited to the existing connection/online information supplied by the application.
- File attachments other than images remain disabled because the product behavior is not implemented.
- Some administration and authentication form styles remain in the shared stylesheet; they were retained to avoid changing established form behavior.
