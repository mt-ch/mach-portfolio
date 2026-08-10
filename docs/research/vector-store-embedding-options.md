# Vector store & embedding provider options

Research for issue #32 (child of map issue #31, "Wayfinder map: Scoped portfolio Q&A
chatbot"). Feeds the follow-on decision ticket, issue #34 ("Decide: vector store &
embedding provider"). Scope: survey concrete embedding-provider and vector-store
options against primary sources, for a low-traffic, low-volume personal-portfolio
corpus (About singleton, a handful of Projects with a `body` field, a handful of
Experience entries). **Does not decide** — that's issue #34's job.

Standing architecture context (locked, not re-litigated here, per issue #31): retrieval
is embeddings + vector search, not full-context stuffing. This repo already runs
Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`) for the reframe feature's
rate-limit guardrails (`lib/guardrails/rateLimit.ts`), so Upstash Vector carries real
operational-familiarity value, not just green-field appeal.

## Summary / leaning recommendation

For this corpus size (dozens of chunks, not thousands) and traffic (personal-portfolio,
not production SaaS), **every contender surveyed here is well within its free tier
indefinitely** — this is not a pricing decision. The differentiators are integration
friction and infra surface area:

- **Embeddings: Voyage AI, `voyage-4-lite`.** There is no real alternative — Anthropic
  says so directly (see below) — and `voyage-4-lite` is Voyage's own
  latency/cost-optimized recommendation, well-suited to short portfolio-content chunks.
  200M free tokens covers this corpus many times over (a full re-embed of the entire
  site content is likely a few thousand tokens).
- **Vector store: Upstash Vector is the leaning pick**, on the strength of
  infra-overlap (same account/billing/operational model as the existing Redis rate
  limiter, same REST-based serverless SDK shape that fits a Next.js Route Handler
  without connection-pooling concerns), a free tier that comfortably exceeds this
  corpus's needs, and native metadata filtering for citing a project slug.
  Pinecone is a close, credible second (arguably the more
  battle-tested/well-documented vector-specific product) and would be a reasonable
  pick too. **pgvector is not recommended** — it requires standing up an entirely new
  Postgres instance for a corpus this small, which is added infra/cost/ops surface
  with no retrieval-quality upside over a managed vector store at this scale.

This is a leaning, not a final call — issue #34 makes the actual decision and should
weigh factors this research doesn't cover (e.g. exact chunking strategy, whether
citation UI needs range queries beyond simple equality filters, long-term willingness
to hold another Upstash-family credential vs. diversifying vendors).

## Embeddings

### Anthropic does not serve embeddings natively

Confirmed directly from Anthropic's own docs
(`https://platform.claude.com/docs/en/build-with-claude/embeddings`, the current
location — `docs.claude.com/.../embeddings` 302-redirects here):

> "Anthropic does not offer its own embedding model. One embeddings provider that has
> a wide variety of options and capabilities encompassing all of the preceding
> considerations is Voyage AI."

The rest of Anthropic's own embeddings guide is written *for* Voyage AI — it documents
Voyage's Python/HTTP APIs, the `input_type="query"` vs `"document"` convention, and
links Voyage's pricing/rate-limit pages as the source of truth. Anthropic does caveat
"you should assess a variety of embeddings vendors," but doesn't name any others — Voyage
is the only partner path the docs actually walk through.

### Voyage AI models (current, per Anthropic's embeddings guide and Voyage's own docs)

| Model | Context length | Embedding dimensions | Notes |
|---|---|---|---|
| `voyage-4-large` | 32,000 tokens | 1024 (default), 256, 512, 2048 | Best general-purpose/multilingual quality |
| `voyage-4` | 32,000 tokens | 1024 (default), 256, 512, 2048 | Balanced quality/efficiency |
| `voyage-4-lite` | 32,000 tokens | 1024 (default), 256, 512, 2048 | Optimized for latency and cost |
| `voyage-4-nano` | 32,000 tokens | 1024 (default), 256, 512, 2048 | Open-weight (Apache 2.0), on Hugging Face |
| `voyage-code-3` | 32,000 tokens | 1024 (default), 256, 512, 2048 | Code retrieval |
| `voyage-finance-2` | 32,000 tokens | 1024 | Finance domain |
| `voyage-law-2` | 16,000 tokens | 1024 | Legal / long-context domain |
| `voyage-context-4` | 120,000 tokens | 1024 (default), 256, 512, 2048 | Contextualized *chunk-level* embeddings — captures full-document context per chunk without manual metadata augmentation; called via `contextualized_embed()` instead of `embed()` |

Dimensions are Matryoshka (truncatable): the model natively supports asking for a
shorter vector (e.g. 256) and getting a coarse-to-fine truncation of the full
embedding, useful for trading a little retrieval quality for storage/cost if the
default 1024 turns out to be overkill for a corpus this small (it won't be — storage
isn't the constraint here). Quantization (`int8`, `uint8`, `binary`) is also supported
for 4x–32x storage reduction, again not a meaningful lever at this scale.

None of this is a compelling reason to look past `voyage-4-lite` for a personal
portfolio: content is short (bio paragraphs, project case-study blurbs, experience
summaries), so 32K context is far more than needed per chunk, and the "optimized for
cost/latency" tier is exactly matched to a widget answering occasional visitor
questions, not a high-QPS production search product.

**API access**: official `voyageai` Python package, a TypeScript/npm client, and a
plain REST endpoint (`POST https://api.voyageai.com/v1/embeddings`). Max 1,000 texts
per request. Embeddings are pre-normalized to unit length, so cosine similarity and
dot-product are equivalent (dot-product is cheaper to compute) — relevant to how a
vector store's default similarity metric should be configured.

### Voyage pricing (from Voyage's pricing docs, linked from Anthropic's guide)

| Model | Price |
|---|---|
| `voyage-4-lite` | $0.02 / million tokens |
| `voyage-4` | $0.06 / million tokens |
| `voyage-4-large`, `voyage-context-4` | $0.12 / million tokens |
| `voyage-multilingual-2`, `voyage-finance-2`, `voyage-law-2`, `voyage-code-2` | $0.12 / million tokens |
| `voyage-code-3` | $0.18 / million tokens |

**Free tier**: yes — "the first 200 million tokens for `voyage-4-large`, `voyage-4`,
`voyage-4-lite`, `voyage-context-4`, and `voyage-code-3`... are free for every
account"; specialized/legacy models get 50M free tokens instead. For a corpus of a
handful of Projects/Experience entries plus one About bio, the entire content set is
almost certainly under 50K tokens — the free allocation alone covers thousands of full
re-embeds (i.e. re-embedding the whole site on every content change, indefinitely,
without ever billing).

**Rate limits** (Voyage's rate-limits docs): free/Tier-1 accounts get 8M TPM / 2000 RPM
on `voyage-4`/`voyage-3.5`, 16M TPM / 2000 RPM on the lite variants, 3M TPM / 2000 RPM
on `voyage-3-large`/`voyage-context-3`. Limits scale up automatically (2x at $100
spent, 3x at $1000 spent) — irrelevant at this project's request volume, since a
content re-index touches at most a few dozen chunks at once and live query-time
embedding is one short string per visitor question.

## Vector store options

### Upstash Vector

**Integration**: official `@upstash/vector` npm package — "Vector database client for
AI and LLM apps." Server-side usage is a one-line REST client init, the same shape as
the existing `@upstash/redis` client in `lib/guardrails/rateLimit.ts`:

```ts
const index = new Index({ url: "UPSTASH_VECTOR_REST_URL", token: "UPSTASH_VECTOR_REST_TOKEN" });
```

This is REST-over-HTTP, not a persistent connection — the same reason `@upstash/redis`
was a good fit for serverless Route Handlers (no connection-pool lifecycle to manage
across Next.js's per-request/edge execution model), and it applies identically here.

**Metadata filtering**: yes, documented explicitly — queries support metadata filter
expressions, which is what's needed to tag each chunk with its source (`project:<slug>`,
`about`, `experience:<id>`) and filter/cite accordingly.

**Dimension limits**: free tier caps at 1,536 dimensions max — comfortably above
Voyage's default 1024 (and even `voyage-4-large`'s max 2048 option would need the paid
tier's 3,072-dimension ceiling, but the default 1024 fits free-tier easily).

**Latency**: Upstash's own docs don't publish fixed latency numbers, but the console
provides mean/P99 latency charts per index — observable but not a documented SLA.
Upstash Vector is "eventually consistent" — newly written/updated vectors may not be
immediately queryable, worth knowing for a "re-embed on content webhook, then query"
pipeline (per the existing `docs/adr/0003-on-demand-isr-via-webhook.md` precedent),
though the delay is typically small and not disqualifying for a content-update-then-query
flow that isn't latency-critical.

**Pricing** (Upstash's vector pricing page): free tier — up to 200M vectors, 1,536 max
dimensions, 10K requests/day, 1GB storage, 100 namespaces, $0/month. This is dramatically
beyond what a few dozen portfolio chunks and occasional visitor queries will ever use.
Paid tiers (pay-as-you-go: $0.4/100K requests + $0.25/GB storage, or a $60/month fixed
plan) are not relevant at this scale.

### Pinecone

**Integration**: Pinecone is a dedicated, longer-established vector-database product
with first-party Node/TypeScript SDKs and documented Next.js integration guides
(including an official Anthropic cookbook recipe linked directly from Anthropic's own
embeddings guide: `platform.claude.com/cookbook/third-party-pinecone-rag-using-pinecone`
— i.e. Anthropic's docs treat Pinecone as the reference RAG vector store). Comparable
integration complexity to Upstash Vector — both are REST/SDK-based managed services with
no infrastructure to provision beyond an index.

**Metadata filtering**: yes, well-documented — filter operators (`$eq`, `$ne`, `$gt`,
`$in`, `$and`, `$or`) on arbitrary metadata fields (strings, numbers, booleans, string
lists), which comfortably supports filtering/citing by project slug.

**Free tier fit** (Pinecone's pricing page, "Starter" plan): up to 2GB storage, 2M
write units/month, 1M read units/month, 1GB egress/month, up to 5 indexes, "genuinely
free with no time limitation mentioned" — explicitly pitched as "for trying out and for
small applications." This is again far beyond what a personal-portfolio corpus needs.

**Constraints not confirmed from primary sources in this pass**: exact serverless
dimension ceiling and published latency figures weren't surfaced by the specific page
fetched (`docs.pinecone.io/guides/index-data/indexing-overview`) — Pinecone supports
high-dimension vectors broadly (well above Voyage's 1024/2048 range) based on general
product knowledge, but issue #34 should pull the exact number from
`docs.pinecone.io` directly if it matters to the final decision.

**No existing operational overlap** — unlike Upstash, this repo has no existing
Pinecone account/credential/billing relationship, so adopting it adds a net-new vendor
account versus Upstash Vector's net-new-product-under-an-existing-vendor.

### pgvector (only relevant if Postgres is introduced from scratch)

This repo has **no Postgres today** — Sanity is the only CMS/datastore in use (per
`CONTEXT.md` and the schema audit in
`docs/research/sanity-data-audit-for-intent-framing.md`). Adopting pgvector means
standing up a *new* managed Postgres instance purely to host embeddings for this
feature — it is not "use what's already there," it's a new piece of infrastructure.

Quantifying that added cost/complexity against two of the more popular managed-Postgres
options (both support the `pgvector` extension out of the box):

- **Supabase** (`supabase.com/pricing`): free tier gives 500MB storage but **pauses the
  project after 1 week of inactivity** — a real problem for a low-traffic personal site
  where the widget might genuinely go days without a visitor query, risking a paused
  database serving 500 errors until manually resumed. Avoiding that means the Pro tier
  at **$25/month base** plus compute (a further **$10/month** minimum for the smallest
  "Micro" instance, credited but still a floor) — i.e. real recurring cost for a feature
  the other two options serve for $0.
- **Neon** (`neon.com/pricing`): free tier is permanent (no pause-and-delete), 0.5GB
  storage, 100 CU-hours/month compute, and importantly **scales to zero after 5 minutes
  of idle** rather than pausing the whole project — so it doesn't have Supabase's
  "comes back only on manual action" failure mode, just a cold-start latency hit on the
  first query after idle. This is the more viable of the two if pgvector were chosen,
  but still means running and monitoring a database server (backups, extension
  management, connection pooling from a serverless Route Handler — Postgres needs a
  pooler like PgBouncer/Neon's built-in pooler for serverless environments, which
  Upstash Vector's and Pinecone's REST APIs don't need at all) for a corpus that's a
  handful of documents.

Net: pgvector is technically capable (dimension limits, metadata via ordinary SQL
`WHERE` clauses, indexing via `ivfflat`/`HNSW` are all mature and well-documented), but
it's the only option here that requires introducing and operating a new category of
infrastructure — a database server, not just an API client — for a workload this small.
That operational overhead (connection pooling, backups, an extra account/service to
monitor) isn't justified unless a future, unrelated need for Postgres emerges
independently.

### Other options considered

- **Cloudflare Vectorize** (`developers.cloudflare.com/vectorize/platform/pricing`):
  genuinely viable at this scale — Workers Free plan includes 30M queried + 5M stored
  vector dimensions/month, and paid-plan overage pricing ($0.01/million queried
  dimensions, $0.05/100M stored) is negligible for a corpus this small. Not
  cost-differentiated from Upstash/Pinecone at this volume. The tradeoff: it only makes
  sense if this app is deployed on Cloudflare Workers/Pages — this repo is a Next.js app
  with no evidence of a Cloudflare deployment target, so adopting Vectorize would mean
  either running Next.js on Cloudflare's runtime or calling Vectorize's API from outside
  the Workers ecosystem (less first-class than Upstash/Pinecone's plain-REST model).
  Metadata filtering support wasn't confirmed from the pricing page fetched in this pass
  and should be checked in Cloudflare's Vectorize API docs (not just pricing) if this
  option is pursued further.
- **Chroma Cloud**: not fetched directly in this pass; flagging it only as a name that
  comes up in this space for open-source-first teams, without primary-source pricing or
  integration facts verified here. Given Upstash and Pinecone already clear every bar at
  this scale with primary-source confirmation, it wasn't worth spending further
  fetch budget on a third confirmed-fine option.
- **In-memory/on-disk index rebuilt from Sanity on each deploy** (e.g. a flat-file
  vector index checked into the build or rebuilt at build time, with brute-force cosine
  similarity computed in the Route Handler): plausible at this corpus size — a few dozen
  vectors is trivial to hold in memory and brute-force-search in microseconds, avoiding
  a vector-store vendor entirely while still doing real vector search (embeddings +
  similarity ranking, not context-stuffing). The tradeoff is operational: it ties index
  freshness to deploys/build-time regeneration rather than the existing
  webhook-driven on-demand-ISR content-sync pattern (`docs/adr/0003-on-demand-isr-via-webhook.md`),
  so a content edit in Sanity wouldn't be queryable until the next deploy or a
  purpose-built rebuild step — a real regression from how content freshness works
  today. Worth issue #34 weighing explicitly given the ADR precedent, but not the
  leaning pick here because it reintroduces a freshness gap the existing architecture
  already solved for.

## Comparison table

| | Voyage AI (embeddings) | Upstash Vector | Pinecone | pgvector (via Neon) | Cloudflare Vectorize |
|---|---|---|---|---|---|
| Free tier fit at this scale | Yes — 200M free tokens | Yes — 200M vectors, 1GB storage | Yes — 2GB storage, 2M writes/mo | Yes, but see caveats | Yes — 30M queried dims/mo |
| Existing account/infra overlap | N/A (new vendor either way) | Yes — same family as `@upstash/redis` | No | No | No |
| New infra category introduced | No | No | No | **Yes — a Postgres server** | Depends on deploy target |
| Metadata filtering | N/A | Yes, documented | Yes, documented (operators) | Yes, via SQL `WHERE` | Not confirmed here |
| Dimension ceiling (free tier) | Up to 2048 available | 1,536 | Not confirmed (likely ample) | No hard limit (Postgres column) | Not confirmed here |
| Integration shape for a Route Handler | REST client, per-call | REST client, no pooling needed | REST/SDK client, no pooling needed | Needs a connection pooler | REST/binding |
| Fits current deploy target as-is | Yes | Yes | Yes | Yes (with pooler) | Only if on Cloudflare runtime |

## Recommendation (leaning, non-final)

**Embeddings**: Voyage AI's `voyage-4-lite`, with no serious alternative — Anthropic's
own docs name Voyage as the path, and `voyage-4-lite` is Voyage's own
cost/latency-optimized tier, a good match for short portfolio-content chunks and
occasional query-time embedding calls.

**Vector store**: leaning **Upstash Vector**, primarily for the operational-overlap
reason called out in the ticket — this repo already has an Upstash account, an
established REST-client pattern in `lib/guardrails/rateLimit.ts`, and presumably shared
billing/monitoring. Its free tier is not remotely a constraint at this corpus size, and
metadata filtering covers the project-slug citation requirement. **Pinecone is a
credible, close alternative** — arguably the more purpose-built, widely-documented
vector product, and it's the option Anthropic's own cookbook demonstrates — so issue #34
shouldn't treat this as a foregone conclusion, just a lean.

**pgvector is not recommended** given this repo has zero existing Postgres footprint:
it's the only surveyed option that requires standing up and operating a new category of
infrastructure (a database server + connection pooling), and the cost isn't trivial
either (Supabase Pro at $25+/month to avoid inactivity pausing, or Neon's free tier
which is more viable but still adds server-ops surface) — with no retrieval-quality
benefit over Upstash/Pinecone at this scale to justify it.

The in-memory/on-disk rebuilt-index approach is a legitimate scale-appropriate
alternative worth issue #34's explicit consideration, but its main cost — breaking the
existing webhook-driven content-freshness pattern — is a real regression the ticket
should weigh deliberately rather than default into.

**This is a leaning, not a decision.** Issue #34 ("Decide: vector store & embedding
provider") makes the actual call and should pull in factors this research pass didn't
cover: exact chunking strategy and its interaction with `voyage-context-4`'s
contextualized-chunk embeddings, whether the citation UI needs anything beyond
equality-filtering on slug, and Pinecone's exact dimension/latency numbers if that
option is seriously considered.

## Sources

- `https://platform.claude.com/docs/en/build-with-claude/embeddings` (Anthropic's
  embeddings guide; `docs.claude.com/en/docs/build-with-claude/embeddings` redirects
  here) — confirmed Anthropic has no native embedding model, confirmed Voyage AI is the
  documented partner, confirmed the current Voyage model table (context lengths,
  dimensions, descriptions) as reproduced by Anthropic, confirmed the Python/REST API
  shape and `input_type` convention, confirmed the linked Pinecone RAG cookbook.
- `https://docs.voyageai.com/docs/embeddings` — cross-checked Voyage's own model list
  and endpoint/rate-limit framing (used to corroborate the Anthropic-page table above).
- `https://docs.voyageai.com/docs/pricing` — confirmed per-model pricing and the 200M
  (50M for specialized models) free-token allocation.
- `https://docs.voyageai.com/docs/rate-limits` — confirmed free/Tier-1 RPM/TPM figures
  per model family and the spend-based tier scaling (2x at $100, 3x at $1000).
- `https://upstash.com/docs/vector/overall/getstarted` — confirmed the `@upstash/vector`
  SDK, its REST client init pattern, metadata filtering support, dimension-selection
  requirement, and the "eventually consistent" note.
- `https://upstash.com/pricing/vector` — confirmed free-tier limits (200M vectors, 1,536
  dims, 10K requests/day, 1GB storage, 100 namespaces) and paid-tier pricing.
- `https://www.pinecone.io/pricing/` — confirmed the Starter (free) plan's storage,
  read/write-unit, egress, and index-count limits, and that it's not time-limited.
- `https://docs.pinecone.io/guides/index-data/indexing-overview` — confirmed metadata
  filtering support and operator set; did not surface dimension-ceiling or latency
  figures (flagged as unconfirmed above).
- `https://developers.cloudflare.com/vectorize/platform/pricing/` — confirmed Vectorize
  free-tier and paid pricing structure (queried/stored vector dimensions); metadata
  filtering not confirmed from this page.
- `https://supabase.com/pricing` — confirmed free-tier storage limit and the 1-week
  inactivity pause behavior, and Pro-tier ($25/month + compute) pricing.
- `https://neon.com/pricing` — confirmed free-tier storage/compute limits, scale-to-zero
  (vs. Supabase's pause) behavior, and pay-as-you-go paid pricing; confirmed pgvector is
  supported on all plans.
- `gh issue view 31 --repo mt-ch/mach-portfolio` and `gh issue view 32 --repo
  mt-ch/mach-portfolio` — ticket language and standing architecture decisions.
- `lib/guardrails/rateLimit.ts` (this repo) — confirmed the existing `@upstash/redis` /
  `@upstash/ratelimit` integration pattern cited as the operational-overlap precedent
  for Upstash Vector.
