# Corpus audit refresh: what content exists now, and what's still missing for grounded first-person answers

Research for issue #151 (child of map issue #148, "Wayfinder map: Chat-response
overhaul (voice, content, rendering)"). Re-runs the audit from issue #33
(`docs/research/chatbot-corpus-audit.md`, branch `research/chatbot-corpus-audit`,
commit `a092728`) against current `main` (`ebacbd9`), now that the chatbot has shipped
and content has been authored. Same question as #33: does the corpus have enough
narrative depth, specifics, and structured facts for an open-ended Q&A bot — but with
#148's added lens of **first-person answers in Matt's voice**. Does not design the
voice/prompt, retrieval, or rendering changes — those are separate #148 tickets.

Sources read directly: `sanity/schemaTypes/project.ts`, `sanity/schemaTypes/experience.ts`,
`sanity/schemaTypes/about.ts`, `sanity/schemaTypes/blocks/textBlock.ts`,
`sanity/schemaTypes/blocks/imageBlock.ts`, `lib/sanity/queries.ts`, `lib/sanity/types.ts`,
`lib/sanity/client.ts`, `sanity/env.ts`, `lib/assistant/corpus/templates.ts`,
`lib/assistant/corpus/chunk.ts`, `lib/assistant/corpus/portableText.ts`,
`lib/assistant/corpus/types.ts`, `lib/assistant/chat/context.ts`,
`lib/assistant/chat/generateAnswer.ts`, `lib/assistant/corpus/chunk.test.ts`, and
**live production Sanity content** pulled the same way as the #33 audit.

## 0. Live data was accessible again — this audit is grounded in real content

`lib/sanity/client.ts` still builds an unauthenticated `next-sanity` client
(`useCdn: true`, no token) from the public `NEXT_PUBLIC_SANITY_*` values in `.env.local`
(`sanity/env.ts:1-13`): `projectId=w3mg41r0`, `dataset=production`,
`apiVersion=2024-01-01`. The dataset's GROQ HTTP API is publicly readable, so the live
corpus was queried directly, no token:

```
curl -G "https://w3mg41r0.api.sanity.io/v2024-01-01/data/query/production" \
  --data-urlencode 'query=*[_type=="project"]{title,summary,heroText,role,story,techStack,skills,impact,dateCompleted}'
curl -G "https://w3mg41r0.api.sanity.io/v2024-01-01/data/query/production" \
  --data-urlencode 'query=*[_type=="experience"]{company,title,startDate,endDate,summary,order}'
curl -G "https://w3mg41r0.api.sanity.io/v2024-01-01/data/query/production" \
  --data-urlencode 'query=*[_type=="about"][0]{name,headline,footerText,bio,email,socialLinks,"resumeUrl":resumeFile.asset->url}'
```

Returned: 1 About, 4 Project, 2 Experience documents — same document count as #33.
There are no seed/fixture files in the repo (only unit-test in-line factories, e.g.
`lib/assistant/corpus/chunk.test.ts`); all content lives in the live dataset.

## 1. The big change since #33: Project stories are now real

The `story` field (renamed from `body`; `project.ts:44-51`, an array of `textBlock` /
`imageBlock` — `sanity/schemaTypes/blocks/`) is **fully authored on all 4 projects.
Every Lorem Ipsum instance from the #33 audit is gone.** Each story is ~8 blocks
alternating image and text, with 4–5 substantive prose paragraphs of genuine
case-study narrative.

| Project | `story` | `heroText` | `role` | `impact` | `skills` | `techStack` | `dateCompleted` |
|---|---|---|---|---|---|---|---|
| The Home Hospital | **real, 4 text blocks** (headings: The Challenge / The Approach / Design at Scale / The Outcome) | real, 2 sentences | "Web Development, Branding" | "Led frontend software development", "Rebranded company", "Reduced load time 40%" | accessibility, design systems, data visualization | Vue, Typescript, Figma | 2026-08-01 |
| Pertemps | **real, 4 text blocks** (no headings) | real, 2 sentences | "Web Development" | "Increased application volume 38%", "Increased website traffic 80%" | data visualization, performance, backend/infra | Vue, Typescript, .NET | 2024-04-01 |
| ISE Partners | **real, 4 text blocks** (no headings) | real, 2 sentences | "Web Development" | *(null)* | data visualization | .NET, Umbraco | 2024-01-01 |
| Mother Goods | **real, 4 text blocks** (no headings) | real, 2 sentences | "Web Development" | *(null)* | *(null)* | React, Shopify, Motion | 2022-01-01 |

The prose is good: each story states the problem, the approach, the tech choices with
rationale, and (for Home Hospital / Pertemps) a quantified outcome. "Tell me about a
project where he did X" is now answerable with substance for all four projects —
the single biggest blocking gap from #33 is closed.

**Two content caveats for #148's first-person lens:**

- **Voice mismatch.** Every story is written in agency first-person-**plural** — "We
  worked together to shape a site…", "We rebuilt the frontend in Vue…", "once our
  engagement wrapped", "gave the in-house team a durable foundation". `About.bio` is
  first-person-**singular** ("I'm a frontend engineer…"). A bot answering *as Matt* in
  first person will be pulling from "we" source text and must rewrite the pronoun and
  the framing on the fly. The corpus never states which parts of "we" were Matt
  personally versus the studio/other people — so "what did *you* personally build on
  Pertemps" has no clean answer; the bot can only relay the team-level narrative.
- **Client vs. employer ambiguity persists.** The stories read as external client
  engagements ("We worked together", "our engagement wrapped"), but two of the four
  companies (The Home Hospital, Pertemps) are *also* `Experience` employers (§3). Was
  ISE Partners / Mother Goods freelance, studio work, or something under one of the two
  tracked roles? Still not encoded anywhere (§3, join gap).

## 2. What the retrieval pipeline actually exposes to embeddings — and what it drops

### Project — `templateProjectHeader` (`lib/assistant/corpus/templates.ts:9-20`) + `chunkProject` (`chunk.ts:36-58`)

Emitted into the embedded chunk text: `Title`, `Summary`, `Tech stack`, `Skills`,
`Impact`, `Date completed`, then the flattened story prose as the chunk body.

**Omitted from embeddings:**

- **`heroText`** — not selected by `projectsForIndexQuery` (`lib/sanity/queries.ts:71-82`)
  and not in the template. This is the most valuable *factual* one-liner about each
  project ("The Home Hospital is a virtual hospital delivering consultant-led treatment
  and continuous clinical oversight to patients at home…") — a plain-language "what is
  this project / company" that the marketing-tagline `summary` ("Treatment that
  transcends limits") does not provide. Cheap, high-value add.
- **`role`** — not selected by `projectsForIndexQuery`, not in the template. Populated
  on all 4 ("Web Development, Branding" etc.). Directly answers "what was Matt's role on
  X"; currently invisible to retrieval.
- **`links`** — selected by `projectBySlugQuery` but not `projectsForIndexQuery`; not in
  the template. Live URLs to the shipped work; a bot asked "is it live / can I see it"
  can't answer.

### Project story — section headings are silently discarded

`flattenStory` (`portableText.ts:23-33`) unwraps each `textBlock`'s `content` array
**but drops the `textBlock.heading` field** (`return block.content;` — heading never
read). `splitAtHeadings` (`portableText.ts:63-95`) only splits on Portable Text
*styles* `h1`–`h6` *inside* `content` (`chunk.test.ts:75-105` confirms this is the only
split path). The Home Hospital story authors real section headings ("The Challenge",
"The Approach", "Design at Scale", "The Outcome") via the `heading` field on each
`textBlock` (`sanity/schemaTypes/blocks/textBlock.ts:8-12`), not as inline `h2` blocks
— so in production **every project story collapses into one unstructured chunk**, and
the authored structure never reaches the embedding or the model. Not a correctness bug,
but a retrieval-quality gap: a question about "how did he approach X" can't match a
tighter "The Approach" sub-chunk because that sub-chunk is never formed.

### Experience — `templateExperienceHeader` (`templates.ts:22-30`) + `chunkExperience` (`chunk.ts:60-77`)

Emitted: `Company`, `Title`, `Dates` (start – end/"present"). The chunk body is
`entry.summary`.

**The schema field exists — the gap is purely content.** `experience.ts:32-37` defines
`summary` as `type: "array", of: [{ type: "block" }]` (Portable Text). It *is* selected
by `experienceQuery` / `experienceEntryByIdQuery` (`queries.ts:113-136`) and *is* passed
as the chunk body by `chunkExperience` (`chunk.ts:74`). So the wiring is complete — but
**both live Experience documents have `summary: null`** (unchanged from #33). Contrary
to a first read of the ticket, no schema change is needed for Experience narrative; it's
an authoring gap. What the *template header* omits is nothing that exists — there is no
location, no seniority, no team-size field to expose.

Structured dates are solid: Pertemps `2021-04-01 → 2024-04-01` (3 years), The Home
Hospital `2024-04-01 → present` (~2y 4m as of 2026-08). Tenure/duration questions are
fully answerable.

### About — `templateAboutHeader` (`templates.ts:32-34`) + `chunkAbout` (`chunk.ts:79-88`)

Emitted into the embedded chunk text: `Name`, `Headline`, then `about.bio` as the body.

**Omitted from the text the model sees:**

- **`email`** — put in chunk *metadata* only (`chunk.ts:84`), and `buildContext`
  (`lib/assistant/chat/context.ts:46-60`) stuffs only `chunk.text` into the prompt,
  never metadata. So the contact address is **completely absent from what the LLM
  receives.** "How do I get in touch with Matt" retrieves the About chunk but the text
  has only name + headline + bio.
- **`email` is still the placeholder `hello@test.com`** (unchanged from #33) — a
  correctness problem if it ever *is* exposed.
- **`socialLinks`** (one real LinkedIn URL, `https://www.linkedin.com/in/mattchan1998/`)
  and **`resumeUrl`** (a real published PDF asset) — selected by `aboutQuery`
  (`queries.ts:138-150`) but neither is in `chunkAbout` metadata *or* text. "Is he on
  LinkedIn / does he have a CV" is unanswerable.
- **`footerText`** ("is available for collaborations and full time roles:") — carries a
  genuine availability signal, not exposed.

### About content richness

- `name`: `"Matt Chan"` — the trailing-space data-quality bug from #33 is fixed.
- `headline`: `"is a frontend engineer based in London. Specialising in product design
  and UX/UI since 2020."` — richer than #33's version; now carries location (London)
  and a since-2020 timeframe. Note it's a sentence *fragment* designed to follow the
  name on the homepage ("[Matt Chan] is a frontend engineer based in London…"); a bot
  quoting `Headline:` verbatim gets an ungrammatical fragment.
- `bio`: one ~90-word first-person paragraph — genuine, well-written, unchanged from
  #33. Still generic: "my startup" (no company named), no named projects, no
  quantified outcomes, no explicit leadership/people-management language.

### System prompt

`generateAnswer.ts:3-8` — the current prompt says "Answer … in a few sentences",
"direct, conversational", "using only the supplied portfolio context". It does **not**
instruct first person / speak-as-Matt (it's third-person "Matt Chan's portfolio site"),
and it hard-caps length at "a few sentences". Both are #148 voice-ticket concerns, noted
here only as the current baseline.

## 3. Still-open gaps from #33

- **`Experience.summary` empty on both roles.** "What did you do at Pertemps / The Home
  Hospital" has no first-party role narrative — only the *Project* stories for the
  same-named companies, which describe client engagements, not the employment.
- **No Project ↔ Experience join.** 4 projects name 4 companies (The Home Hospital, ISE
  Partners, Mother Goods, Pertemps); only 2 have `Experience` entries. No reference
  field on either schema (`project.ts`, `experience.ts` — checked in full). "Which job
  was this project built under" can't be answered from data; string-matching company
  names would wrongly imply ISE Partners / Mother Goods were jobs.
- **Role-title inconsistency.** The Home Hospital: `Experience.title` = "Frontend
  Developer", but `Project.role` = "Web Development, Branding". Pertemps:
  `Experience.title` = "Software Engineer" vs `Project.role` = "Web Development". A bot
  may surface both and read as contradictory.
- **Leadership signal is still one ambiguous bullet** — `impact: "Led frontend software
  development"` on The Home Hospital only. Ambiguous (led an effort vs. led people), no
  team size, no duration. "Has he led a team / managed people" outruns the data.
- **`About.email` placeholder** (`hello@test.com`).

## 4. Checklist

### Content to author (no schema change needed)

- [ ] **`Experience.summary` for both roles** (The Home Hospital, Pertemps) — 2–4
  sentences of first-person role narrative: scope, what was owned, team context,
  seniority. Field exists and is fully wired into retrieval (`chunk.ts:74`); just empty.
- [ ] **`About.email`** — replace `hello@test.com` with the real address. (`About.email`
  has `.email()` validation but no value check — `about.ts:39-43`.)
- [ ] **`impact` for ISE Partners and Mother Goods** — currently null; even one outcome
  bullet each brings them to parity with the other two.
- [ ] **Leadership / team-scope content** — if "has he led a team" is an expected
  question (it is, per #33), author an explicit line (in `Experience.summary` or
  `About.bio`) rather than leaning on the one ambiguous `impact` bullet. Otherwise the
  #148 voice/guardrail ticket must design a graceful "I don't have detail on that"
  fallback.
- [ ] **Decide the "we" vs "I" story convention** — either (a) leave stories as agency
  "we" and have the #148 prompt handle the first-person rewrite explicitly, or (b)
  add a short first-person "my role" note per project. Recommend (a) + a prompt rule;
  cheaper and keeps the public project pages reading naturally.
- [ ] **Clarify client-vs-employer for ISE Partners / Mother Goods** — a sentence in
  each story (or a new About paragraph) on how that work related to Matt's roles, so
  the bot isn't silent on it.
- [ ] **`About.bio` enrichment (optional / lower priority)** — name at least one company
  or concrete project so "give me a quick summary of Matt" isn't purely abstract.

### Schema / pipeline changes

- [ ] **Add `heroText` to `projectsForIndexQuery` + `projectForIndexByIdQuery`
  (`lib/sanity/queries.ts:71-95`), to `ProjectForIndex` (`lib/sanity/types.ts`), and to
  `templateProjectHeader` (`templates.ts:9-20`).** Highest value-to-effort item: turns
  the vague `summary` tagline into a real "what this project/company is".
- [ ] **Add `role` the same way** — one line, answers "what was his role".
- [ ] **Fix `flattenStory` to keep `textBlock.heading`** (`portableText.ts:23-33`) —
  emit it as an `h2`-style block (or a `## ` prefix) so `splitAtHeadings` forms
  per-section sub-chunks. Improves retrieval precision on multi-section stories (The
  Home Hospital today; more as stories grow). Update `chunk.test.ts` accordingly.
- [ ] **Expose contact info to the model.** Either (a) add `email` / `socialLinks` /
  `resumeUrl` into `templateAboutHeader` text (not just metadata), or (b) have the
  #148 answer-assembly step inject contact details from `aboutQuery` when the question
  is contact-intent. Today `buildContext` (`context.ts:46-60`) passes only
  `chunk.text`, so metadata-only `email` never reaches the LLM.
- [ ] **Add a Project ↔ Experience link** — a `reference` field (e.g.
  `experience.projects[]` → project, or `project.experience` → experience) so "which
  role was this under" is answerable and the two same-named companies are
  disambiguated from the two that aren't employers. Then surface the linked
  company/role in `templateProjectHeader`.
- [ ] **Reconcile `Project.role` vs `Experience.title`** — content fix, but worth a
  schema note: decide which is canonical for a given company or make the bot aware they
  describe different things (engagement scope vs. job title).

### Not needed

- No new narrative *field* for Experience — `summary` already exists and is wired.
- No new field for Project stories — `story` exists, is authored, and flattens into
  chunks today.
- Retrieval provider, vector store, chunk-size strategy — locked by map #31, untouched
  here.

## 5. Verdict

**Much closer than #33, but not yet ready for first-person answers.** The blocking
content gap from #33 — placeholder project bodies — is fully resolved: all four
stories are real, substantive case studies. What remains:

- **Two authoring must-dos:** `Experience.summary` on both roles, and the real
  `About.email`.
- **One pipeline must-do:** get contact info (email / LinkedIn / résumé) into the text
  the model actually sees — it's completely absent today.
- **Three high-value cheap pipeline adds:** `heroText`, `role`, and story-heading
  sub-chunking.
- **One voice decision the #148 prompt ticket must own:** the corpus speaks as agency
  "we"; a first-person-as-Matt bot needs an explicit rewrite rule, and it should be
  told it cannot attribute team work to Matt personally.
- **Two structural gaps** (Project↔Experience join, role-title inconsistency) that
  are lower urgency but will cause visibly shaky answers on "which job was this under".
