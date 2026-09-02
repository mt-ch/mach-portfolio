# Ask is temporarily disabled behind `ASK_ENABLED`

Issue #205. The "Ask" chat assistant works end to end, but its retrieval
tuning, prompt, and UX are still being refined and shouldn't be live for
recruiters and clients. It was mounted unconditionally on every public page,
so there was no way to take it off the site short of removing the feature.

## The flag

`lib/assistant/config.ts` exports a single build-time constant:

```
export const ASK_ENABLED = false;
```

No environment variable, no per-environment configuration — it's flipped by
editing the file, so its state is visible in a diff and in the source. Turning
Ask back on is this one-line change.

## What the flag gates

- **`ChatShell`** splits on the flag. When `false` it renders only the page
  scroll container and the fixed top-right cluster holding `ThemeToggle`
  alone — no `ChatDrawerToggle`, no `ChatDrawer`/`AnimatePresence`, no
  `useDrawerVisibility` subscription, and no `data-chat-open` attribute on
  `<html>`. `ChatShell` owns more than chat (the scroll container and the
  theme toggle, per ADR 0006), which is why the flag gates parts of it rather
  than simply not mounting it.
- **`checkIndexHealth`** returns immediately when the flag is `false`, without
  reading the vector store. `pnpm build` keeps running
  `check-index-health && next build` unchanged — the bypass lives in the
  function — so a deploy during the refine period no longer needs `pnpm
  backfill`, and the empty-index gate restores itself the moment the flag
  goes back to `true`.

## What deliberately keeps running

- `/api/chat` and `/api/reindex` — untouched, live, unflagged. `/api/chat` has
  no UI caller; `/api/reindex` keeps the corpus in sync with Sanity
  publish/delete so the knowledge base stays warm for re-enable.
- The whole corpus / embedding / guardrail pipeline, `chatSession`
  (`sessionStorage` keys included), `useChatConversation`, suggested
  questions, chat motion helpers, the Knowledge Base Entry schema, and the
  `backfill` script.

Re-enabling is a true restore: flip `ASK_ENABLED`, and ADRs 0005, 0008, 0009,
0011, and 0012 all still describe the behaviour you get back.
