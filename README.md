# mach-portfolio

Recruiter/client-facing portfolio site. Next.js (App Router) + TypeScript + Tailwind, backed by an embedded Sanity Studio.

## Setup

```bash
pnpm install
cp .env.local.example .env.local
```

Fill in `.env.local` with a Sanity project ID (create one at sanity.io if you don't have one yet), the `production` dataset, and a revalidation webhook secret.

For corpus reindexing (`/api/reindex`), configure two webhooks in the Sanity dashboard (Settings → API → Webhooks), both signed with `SANITY_REINDEX_SECRET`:

- **Publish** — trigger on Create/Update, projection `{"_id": _id, "_type": _type}`.
- **Delete** — trigger on Delete, projection `{"_id": _id, "_type": before()._type}` (the document is already gone, so the projection reads its prior state via `before()`).

Both send the same `{_id, _type}` shape; the route always refetches the document fresh by id rather than trusting the payload, so a Delete event (refetch comes back empty) and a Publish event fall through the same delete-then-upsert path.

## Scripts

- `pnpm dev` — run the app locally (site at `/`, Studio at `/studio`)
- `pnpm build` / `pnpm start` — production build and serve
- `pnpm lint` / `pnpm typecheck` / `pnpm test` — the checks CI runs
- `pnpm typegen` — regenerate `sanity.types.ts` after changing the schema or GROQ queries in `lib/sanity`

## Architecture

- `sanity/` — Studio config, schema types (Project, Experience, About), desk structure
- `lib/sanity/` — the only module that talks to the Sanity client; typed fetch functions (`getProjects`, `getProject`, `getExperience`, `getAbout`) consumed by pages and components
- `app/api/revalidate` — signed webhook endpoint that triggers on-demand ISR on publish
- `lib/corpus/` — chunking/embedding/vector-store pipeline for the Q&A chatbot corpus (see `pnpm backfill`)
- `app/api/reindex` — signed webhook endpoint that keeps the vector index in sync with Sanity publish/delete events
- See `CONTEXT.md` and `docs/adr/` for domain language and architectural decisions
