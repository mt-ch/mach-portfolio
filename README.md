# mach-portfolio

Recruiter/client-facing portfolio site. Next.js (App Router) + TypeScript + Tailwind, backed by an embedded Sanity Studio.

## Setup

```bash
pnpm install
cp .env.local.example .env.local
```

Fill in `.env.local` with a Sanity project ID (create one at sanity.io if you don't have one yet), the `production` dataset, and a revalidation webhook secret.

For corpus reindexing (`/api/reindex`), configure two webhooks in the Sanity dashboard (Settings → API → Webhooks) per indexed document type — `project`, `experience`, `about`, and `knowledgeBaseEntry` — all signed with `SANITY_REINDEX_SECRET`:

- **Publish** — trigger on Create/Update, filter `_type == "<type>"`, projection `{"_id": _id, "_type": _type}`.
- **Delete** — trigger on Delete, filter `_type == "<type>"`, projection `{"_id": _id, "_type": before()._type}` (the document is already gone, so the projection reads its prior state via `before()`).

Both send the same `{_id, _type}` shape; the route always refetches the document fresh by id rather than trusting the payload, so a Delete event (refetch comes back empty) and a Publish event fall through the same delete-then-upsert path.

## Scripts

- `pnpm dev` — run the app locally (site at `/`, Studio at `/studio`)
- `pnpm build` / `pnpm start` — production build and serve
- `pnpm lint` / `pnpm typecheck` / `pnpm test` — the checks CI runs
- `pnpm typegen` — regenerate `sanity.types.ts` after changing the schema or GROQ queries in `lib/sanity`

## Architecture

- `app/layout.tsx` — document shell only (fonts, theme bootstrap `<script>`, `ThemeProvider`)
- `app/(site)/` — the public site as a route group (no URL segment); its layout owns the cursor, chat shell, and navigation
- `app/studio/` — embedded Sanity Studio, outside `(site)` so it renders no site chrome
- `components/` — three buckets only: `ui/` (generic/presentational), `layout/` (site chrome), `features/` (`home/`, `project/`, `chat/`, `theme/`)
- `sanity/` — Studio config, schema types (Project, Experience, About), desk structure
- `lib/sanity/` — the only module that talks to the Sanity client; typed fetch functions (`getProjects`, `getProject`, `getExperience`, `getAbout`) consumed by pages and components
- `lib/assistant/` — the Q&A chatbot: `chat/`, `corpus/` (chunking/embedding/vector-store pipeline — see `pnpm backfill`), `guardrails/`. Currently hidden from the site behind `ASK_ENABLED` in `lib/assistant/config.ts` while the experience is refined — see `docs/adr/0013-ask-temporarily-disabled.md`
- `lib/theme/` — shared theme constants read by both the pre-hydration `<script>` and the theme hook
- `app/api/revalidate` — signed webhook endpoint that triggers on-demand ISR on publish
- `app/api/reindex` — signed webhook endpoint that keeps the vector index in sync with Sanity publish/delete events
- See `CONTEXT.md` and `docs/adr/` for domain language, project structure, and architectural decisions
