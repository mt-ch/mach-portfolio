// Master switch for the "Ask" chat assistant on the public site.
//
// While this is `false`:
//   - ChatShell renders no chat entry point (no "Ask" toggle, no drawer, no
//     chat-open signal to the custom cursor) — the theme toggle and page
//     scroll container it also owns are unaffected.
//   - `checkIndexHealth` is a no-op, so `pnpm build` no longer needs a
//     populated Upstash vector index.
//
// The API routes (`/api/chat`, `/api/reindex`) and the whole corpus /
// guardrail pipeline stay live regardless. Re-enabling the feature is this
// one-line change. See docs/adr/0013-ask-temporarily-disabled.md.
export const ASK_ENABLED = false;
