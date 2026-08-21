# Chat drawer supersedes the command-bar widget

Issue #49 shipped the chat widget as an always-visible, bottom-center command bar with no launcher — that was its acceptance criteria, and it was implemented and tested exactly as specified. After seeing it live, the site owner decided they didn't like that visual design and hand-designed a different one: a full-height side panel that slides in from a persistent launcher tab, matching the rest of the redesigned homepage.

Issue #56 replaces `ChatWidget` (the command bar) with `ChatDrawer` (the slide-in panel) wholesale. The underlying conversation logic — `useChatConversation`, the `/api/chat` SSE contract, session persistence, rate limiting, and the refusal/grounding guardrails from issues #47/#48 — is unchanged; only the chrome around it changed. A new `useDrawerVisibility` hook owns the open/closed state independently of conversation state: push layout with no backdrop above the `sm` breakpoint, full-width overlay with a dismissible backdrop below it.

This is recorded here so that a future reader looking at the git history — a command-bar widget deleted and replaced by a drawer with a launcher, seemingly contradicting the acceptance criteria that shipped it — understands this was a post-ship design change, not a regression or a mistake in issue #49's implementation.
