# Corpus audit: is the Sanity content enough to ground a Q&A chatbot?

Research for issue #33 (child of map issue #31, "Wayfinder map: Scoped portfolio Q&A
chatbot (replacing reframe)"). Extends issue #8's data audit
(`docs/research/sanity-data-audit-for-intent-framing.md`, branch
`research/sanity-data-audit-for-intent-framing`, commit `f28b2ab`) but asks a different
question: not "can the LLM classify intent and pick a project" but "does the corpus have
enough narrative depth, specifics, and structured facts for an open-ended Q&A bot to
answer conversationally, truthfully, and specifically." Does not design retrieval,
chunking, or the guardrail/refusal behavior — those are separate #31 tickets.

Sources read directly: `lib/sanity/queries.ts`, `lib/sanity/types.ts`,
`lib/sanity/client.ts`, `sanity/schemaTypes/project.ts`, `sanity/schemaTypes/about.ts`,
`sanity/schemaTypes/experience.ts`, `.env.local` (for connection config only — no
secrets reproduced here), and **live production content pulled directly from the Sanity
dataset** (method below).

## 0. Live data was accessible — this audit is grounded in real content, not schema guesses

`lib/sanity/client.ts` builds a `next-sanity` client from `projectId`/`dataset`/
`apiVersion` in `sanity/env.ts`, with `useCdn: true` and no auth token — i.e. the app
reads the dataset unauthenticated, which meant the dataset's GROQ HTTP API was reachable
the same way. `.env.local` has real values checked in locally (not committed —
confirmed via `git status`/`.gitignore`, not reproduced here beyond the public
`NEXT_PUBLIC_*` values already visible client-side in any deployed build):
`NEXT_PUBLIC_SANITY_PROJECT_ID=w3mg41r0`, `NEXT_PUBLIC_SANITY_DATASET=production`,
`NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01`.

Queried directly with curl, no token required (dataset is publicly readable):

```
curl "https://w3mg41r0.api.sanity.io/v2024-01-01/data/query/production?query=*%5B_type%20%3D%3D%20%22project%22%5D"
curl "https://w3mg41r0.api.sanity.io/v2024-01-01/data/query/production?query=*%5B_type%20%3D%3D%20%22about%22%5D%5B0%5D"
curl "https://w3mg41r0.api.sanity.io/v2024-01-01/data/query/production?query=*%5B_type%20%3D%3D%20%22experience%22%5D"
```

This returned the full production dataset: 1 About document, 4 Project documents, 2
Experience documents. All findings below are from this live content, not inferred from
schema shape alone.

## 1. What's actually in the dataset today

### About (singleton, 1 document)

- `name`: `"Matt "` (trailing space — minor data-quality issue, cosmetic but would leak
  into a bot's answers verbatim if not trimmed).
- `headline`: `"Building interfaces that actually work"`.
- `bio`: one Portable Text paragraph, ~80 words, genuinely written prose (not
  placeholder): a first-person description of being a frontend engineer at "my
  startup," concerned with the gap between user needs and what gets built, interface
  architecture and interaction detail. It is real content — issue #8 flagged `bio` as
  optional-and-possibly-empty; today it is populated. But it's a single generic
  paragraph with no named companies, no named projects, no quantified outcomes, and no
  explicit leadership/people-management language.
- `email`: `"hello@test.com"` — a placeholder value, not a real contact address. A Q&A
  bot asked "how do I contact Matt" would currently surface a fake email.
- `resumeFile`: present (a PDF asset), `socialLinks`: one LinkedIn URL.

### Project (4 documents)

| Project | `summary` | `body` | `impact` | `skills` | `techStack` | `dateCompleted` |
|---|---|---|---|---|---|---|
| The Home Hospital | "Treatment that transcends limits" | **absent** | 3 bullets (incl. "Led frontend software development") | accessibility, design systems, data visualization | Vue, TypeScript, Figma | 2026-08-01 |
| ISE Partners | "A fresh face for a forwards company" | **Lorem ipsum placeholder** | absent | data visualization | .NET, Umbraco | 2024-01-01 |
| Mother Goods | "Commerce that connects with culture" | **Lorem ipsum placeholder** | absent | absent | React, Shopify, Motion | 2022-01-01 |
| Pertemps | "From salary doubt to career direction" | **Lorem ipsum placeholder** | 2 bullets, quantified ("Increased application volume 38%", "Increased website traffic 80%") | data visualization, performance, backend/infra | Vue, TypeScript, .NET | 2024-04-01 |

Every `summary` is a short marketing tagline (4-6 words), not a factual description —
none of them state what was actually built or what problem it solved in plain terms.

**All three populated `body` fields are literally Lorem Ipsum boilerplate** — zero real
case-study prose exists anywhere in the corpus today. This is the single biggest gap:
issue #8 flagged `body` as "optional, presence unverified"; this audit confirms it is
present-but-fake on every project that has it, and entirely absent on one (The Home
Hospital, the most recently updated/most complete-looking project by its `impact` and
`skills` fields).

`impact` and `skills` (both added since issue #8, per issue #31's notes) are populated
on 2 of 4 and 3 of 4 projects respectively — real, useful, but terse: `impact` is a
list of one-line bullets, not sentences with context (team size, timeframe, the
visitor's likely follow-up "how did you achieve that?" has no answer in the data).

### Experience (2 documents)

| Company | Title | Start | End | `summary` |
|---|---|---|---|---|
| The Home Hospital | Frontend Developer | 2024-04-01 | *(none — ongoing)* | **absent** |
| Pertemps | Software Engineer | 2021-04-01 | 2024-04-01 | **absent** |

Both Experience documents have **no `summary` content at all** (the field wasn't even
present in the query response, i.e. empty/never authored). `startDate`/`endDate` are
populated and give exact tenure (Pertemps: 3 years; The Home Hospital: ongoing since
April 2024, ~2 years 4 months as of today 2026-08-10), which is a solid structured
signal for tenure/duration questions. But there is zero narrative about what the role
involved, what was built, team size, or scope — a bot asked "what did you do at
Pertemps" has only a job title and two project-impact bullets from the *Project*
documents to lean on (see cross-linking gap below).

## 2. The delta from issue #8's angle: what open Q&A needs that intent-matching didn't

Issue #8 audited whether the schema gives an LLM enough signal to *classify* a
free-text visitor intent and pick/rank a project (a narrow, single-shot decision).
Issue #33's chatbot instead has to sustain a multi-turn conversation and answer
open-ended factual/narrative questions directly from the content, which needs:

- **Narrative depth per project**, not just classification signal. `techStack`/`skills`
  tell a bot *that* a project used React; only `body` prose could explain *what he did*
  with it, what problem it solved, what decisions he made. That prose doesn't exist —
  every `body` is placeholder text, so "tell me about a project where he did [X]"
  degrades to reciting a one-line `summary` tagline and a list of tech names, with no
  substance behind either.
- **Quantified impact with context**, not just classification-supporting keywords.
  `impact` bullets ("Reduced load time 40%") are good raw material but lack the
  who/how/when a visitor would naturally ask as a follow-up ("how did you do that?",
  "over what timeframe?") — there's no second layer of detail to retrieve.
  Intent-matching didn't need this follow-up depth; open Q&A does.
- **Dates/duration for tenure questions.** This is one place the corpus is
  *stronger* than issue #8 needed: `Experience.startDate`/`endDate` give exact,
  reliable tenure math today (unlike `body`/`bio`, no authoring gap here). "What roles
  has he held and for how long?" is answerable purely from structured dates — title,
  company, start, end — with no narrative required.
- **Leadership/people-management language**, which intent-matching never needed but
  open Q&A explicitly will ("has he led a team?"). The only signal in the entire
  corpus is one `impact` bullet on one project: "Led frontend software development."
  It's ambiguous (led an initiative vs. led people) and unelaborated — no team size, no
  reporting structure, no duration. Every other project and both Experience entries are
  silent on leadership/scope. This is close to the "conspicuously missing" territory
  issue #8 flagged for `impact`/outcomes generally, except now that field exists and
  the gap has moved from "no field" to "field exists, one thin data point."
- **Technology-specific "experience with X" depth.** `techStack` gives literal
  breadth (Vue, TypeScript, Figma, .NET, Umbraco, React, Shopify, Motion, across 4
  projects) — a bot can correctly say "yes, he's used React" — but with `body` empty of
  real content, it cannot go further than naming the project and reciting the tagline
  summary. Issue #8 noted `techStack` conflates tech names with conceptual capabilities
  visitors ask about; for open Q&A the more acute problem is that even where the tech
  name matches, there's no narrative to answer the natural follow-up "what did he build
  with it."
- **Cross-linking between Project and Experience**, flagged as missing by issue #8 for
  copy-generation purposes, is now more directly load-bearing: 4 Projects reference 4
  different client/company names (The Home Hospital, ISE Partners, Mother Goods,
  Pertemps) but only 2 Experience entries exist (The Home Hospital, Pertemps). Whether
  ISE Partners and Mother Goods were done as freelance work, under one of the two
  tracked roles, or something else is not encoded anywhere. A visitor asking "what did
  he do at [role]?" cannot be reliably answered by joining Project ↔ Experience because
  no join key exists — the bot would have to guess from company-name string matching,
  which fails for 2 of 4 projects.
- **Contact/social data correctness** matters more for a conversational agent that
  might be asked directly "how do I reach him" than it did for reframe's homepage copy
  generation. `email: hello@test.com` is a placeholder that would currently be quoted
  verbatim to a recruiter as a real contact address.

## 3. Summary: is the corpus substantive enough today?

**No — not yet.** The schema itself is now in reasonable shape (issue #8's
recommended `skills`/`impact` fields were added, per issue #31's notes, and are
populated on most projects), so this is a content-authoring problem, not primarily a
further schema-change problem, echoing issue #8's own conclusion that the schema gap
was more about content population than shape:

- **Blocking**: `body` on every Project is placeholder Lorem Ipsum (or absent). This is
  the single largest gap — there is no real long-form case-study prose anywhere in the
  corpus for a Q&A bot to draw on for "tell me about a project where he did X"-style
  questions.
- **Blocking**: both `Experience.summary` fields are empty. "What did you do at
  Pertemps" has no first-party narrative answer today.
- **Should-fix before launch**: `About.email` is a placeholder (`hello@test.com`), not
  real contact info — a correctness/trust problem for a bot representing Matt directly
  to recruiters, not just a thinness problem.
- **Should-fix**: leadership/people-management signal is one ambiguous bullet across
  the whole corpus; if "has he led a team?" is an expected question class (it's named
  explicitly in issue #33), either author explicit content for it, or the guardrails
  ticket needs to design a graceful "I don't have detail on that, but here's what I do
  know" fallback rather than the bot inferring beyond the one ambiguous bullet.
- **Should-fix**: no Project↔Experience join, so "which role was this project done
  under" cannot be answered from data as it stands.
- **Working well / lower priority**: `Experience.startDate`/`endDate` give reliable,
  structured tenure data already — no authoring needed for "how long" questions.
  `techStack`/`skills`/`impact` give a bot enough to answer "has he used X" and cite
  one-line outcomes correctly, provided the bot is scoped to not fabricate depth beyond
  what's there (a guardrails-ticket concern, not a content one).

**Recommendation**: before the chatbot ships, prioritize authoring real `body` content
per project (replacing every Lorem Ipsum instance) and real `Experience.summary`
content for both roles, fix `About.email` to a real address, and either author explicit
leadership-scope content or make sure the guardrails ticket designs for graceful
under-specification rather than inference/fabrication when a question (like "has he led
a team") outruns the one thin data point available. None of this requires new schema
fields beyond what issue #8 already recommended and #31 already added — it's authoring
work on fields that already exist and are already wired into the queries.
