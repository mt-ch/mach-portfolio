# mach-portfolio

Recruiter/client-facing portfolio site. Next.js (App Router) + TypeScript + Tailwind, backed by an embedded Sanity Studio.

## Setup

```bash
pnpm install
cp .env.local.example .env.local
```

Fill in `.env.local` with a Sanity project ID (create one at sanity.io if you don't have one yet), the `production` dataset, and a revalidation webhook secret.

## Scripts

- `pnpm dev` — run the app locally (site at `/`, Studio at `/studio`)
- `pnpm build` / `pnpm start` — production build and serve
- `pnpm lint` / `pnpm typecheck` / `pnpm test` — the checks CI runs
- `pnpm typegen` — regenerate `sanity.types.ts` after changing the schema or GROQ queries in `lib/sanity`

## Architecture

- `sanity/` — Studio config, schema types (Project, Experience, About), desk structure
- `lib/sanity/` — the only module that talks to the Sanity client; typed fetch functions (`getProjects`, `getProject`, `getExperience`, `getAbout`) consumed by pages and components
- `app/api/revalidate` — signed webhook endpoint that triggers on-demand ISR on publish
- See `CONTEXT.md` and `docs/adr/` for domain language and architectural decisions
