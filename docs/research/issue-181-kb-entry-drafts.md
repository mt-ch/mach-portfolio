# Issue #181 — drafts: KB entry stubs + polished role summaries

Working draft for [#181](https://github.com/mt-ch/mach-portfolio/issues/181). **Nothing
here is published.** Matt authors the final text and publishes in Sanity Studio; this
file is a starting point and a checklist.

Grounded in: live production Sanity content (projects, About, Experience — pulled
2026-08-31), `docs/research/chat-response-corpus-audit.md`, the #156 handoff comment,
and the KB doc-type wiring on branch `worktree-issue-178-knowledge-base`
(`chunkKnowledgeEntry` — one chunk per entry, `title` + `tags` templated into the
embedded header, `body` flattened to plain text; `title`/`tags` are bot-only, never
shown to visitors).

---

## Part 1 — Experience role summaries (polish + open points)

### What's live now

The schema moved past #156: `Experience.summary` (top-level) is unused/null; narrative
now lives per role in `roles[].summary` (Portable Text). Current live content is
**résumé-bullet style, third-person-imperative voice** ("Rebuilt…", "Built…", "Owned…"),
and **Pertemps has the identical bullet list copy-pasted onto both roles** (Junior
Software Engineer *and* Software Engineer) — clearly placeholder.

Target voice per the audit + #148: **first-person singular ("I"), matching `About.bio`**,
topic-note prose rather than a bullet dump, each role distinct.

### Open authoring points (Matt must resolve — flagged inline as ⚠)

1. **Employment type** per company — employed FT vs contract/studio engagement. Both
   The Home Hospital and Pertemps also appear as *client project stories* written in
   agency "we", so the bot currently can't tell employment from client work.
2. **Seniority / people leadership** — does "led frontend development" mean leading an
   effort or managing people? Team size? "Has he managed people / led a team" is an
   expected question (per #33 audit).
3. **Pertemps role split** — what actually changed between Junior Software Engineer
   (2021-04 → 2022-04) and Software Engineer (2022-04 → 2024-04)? Right now both
   summaries are identical.
4. **The Home Hospital title** — Sanity role title is now "Frontend Engineer"; the
   Project story `role` says "Web Development, Branding" and `About.headline` says
   "frontend engineer". Pick canonical wording or let KB entry #12 below explain the
   difference.

---

### Draft — The Home Hospital · Frontend Engineer · 2024-04 → present

> I lead frontend development at The Home Hospital, a virtual hospital delivering
> consultant-led care to patients at home. I own the web app end-to-end — a Vue 3 and
> TypeScript application that lets clinicians monitor and care for patients remotely,
> replacing a patchwork of manual processes with one platform. My work runs from Figma
> prototyping through implementation: I architected the app into a reusable component
> library on semantic HTML and Tailwind, migrated it from Vue 2 to Vue 3's Composition
> API, and moved server state onto Vue Query to keep patient data consistent in real
> time without redundant fetches. Clinical reliability drove a lot of the engineering
> decisions — I introduced the testing stack (Vitest for unit and integration, Cypress
> for end-to-end) and Sentry error tracking, and built the CI/CD pipelines in Azure
> DevOps. Alongside the product work I led a full company rebrand, and I run the team's
> Agile ceremonies and brought AI-assisted tooling (Claude Code, Cursor) into the
> workflow to cut time spent on specs.

- ⚠ Opening verb: "I lead frontend development" (effort) vs "I'm the frontend engineer"
  (individual contributor) vs "I lead a small frontend team of N" (people). Pick one.
- ⚠ "employed" is implied by "I lead… at" + present tense + Agile ceremonies. If it's a
  contract/studio engagement, change to "I've been embedded as the frontend lead at…".
- ⚠ Reconcile with the client project story: the story says "once our engagement
  wrapped" (agency framing). If Matt is *employed* there, the project story's framing is
  the fiction, and the bot should treat this summary as the truth about the
  relationship. Consider KB entry #5.
- Word count ≈ 180. Trim the tooling sentence if it should be two entries.

### Draft — Pertemps · Software Engineer · 2022-04 → 2024-04

> As a software engineer at Pertemps — a recruitment and careers platform — I worked on
> a legacy rebuild that we shipped from scratch in six months: a redesigned UX on a
> re-architected C#/.NET/Umbraco backend serving over a million monthly page views and
> around 500,000 job applications a year across 60+ sites. I built the Salary Health
> Check feature end-to-end on the frontend, turning a team-built salary data API into a
> comparison tool candidates could actually read as guidance; it drove a marked rise in
> traffic and applications and was nominated for a Data & Marketing Association award. I
> also implemented the schema-driven content architecture that let non-technical teams
> compose pages without rebuilding shared components. Later I helped shape a second
> platform rebuild, introducing Lit and TypeScript for a 50+ component web-components
> layer documented in Storybook, and led frontend development of a large candidate
> portal — 20+ responsive, accessible interfaces in Nuxt and TypeScript.

- ⚠ "led frontend development of a candidate portal" — effort or people? Same question.
- ⚠ Employment type: "As a software engineer at Pertemps" reads employed. Confirm.
- Word count ≈ 165.

### Draft — Pertemps · Junior Software Engineer · 2021-04 → 2022-04

> I joined Pertemps as a junior software engineer and spent my first year on the
> platform rebuild — a legacy recruitment site re-architected on C#, .NET and Umbraco to
> handle over a million monthly page views. I worked across the redesigned frontend and
> the schema-driven content model that let non-technical teams manage pages
> independently, and got my first end-to-end feature ownership building toward the
> Salary Health Check comparison tool. This was where I learned to treat performance —
> bundle size, code splitting, lazy loading — as part of the product rather than an
> afterthought.

- ⚠ This is my best guess at what the junior year actually was — Matt must confirm which
  work predates the 2022 promotion. Right now the live data just duplicates the senior
  bullets onto this role.
- Word count ≈ 90 (fine — a junior role warrants less).

---

## Part 2 — Knowledge Base entry stubs (~16)

Format per stub: **Title** (bot-only header) · **Tags** · **Fills** (the corpus gap) ·
**Skeleton** (Matt fleshes to prose) · **Target words**.

Soft target 150–400 words, hard ceiling ~600 ("if it's longer, it's two entries"). One
chunk per entry is locked. Topic notes, *not* Q&A pairs. First-person singular. No
invented facts — every ⚠ is a spot where Matt supplies something the corpus doesn't
have.

### Positioning / "who is Matt" (the bio is abstract — no company, no numbers)

**1. Quick summary of who I am and what I do**
- Tags: `positioning`, `summary`, `bio`
- Fills: audit §2 — `About.bio` names no company, no project, no outcome; "give me a
  quick summary of Matt" is purely abstract.
- Skeleton: one line of identity (frontend engineer, London, since 2020) → where I work
  now and what it is (The Home Hospital, one sentence) → the through-line of my work
  (design + engineering, systemised interfaces, ⚠ pick 2–3 concrete proof points:
  40% load-time cut, Salary Health Check / DMA nomination, design systems) → what kind
  of problems I take. Close on availability (see #14).
- Target: 150–200

**2. Why frontend, and the design–engineering intersection**
- Tags: `positioning`, `philosophy`, `frontend`
- Fills: `About.bio` gestures at "the gap between what users need and what we build" but
  never says why that became *frontend* specifically.
- Skeleton: the "it works" vs "it feels right" distinction from the bio, expanded with
  ⚠ one real example of a small architecture/interaction decision that changed how a
  product felt. Why I sit deliberately on the design side of engineering rather than
  drifting toward pure backend.
- Target: 150–250

**3. How I got into this / background**
- Tags: `bio`, `background`, `faq`
- Fills: nothing in the corpus covers education, career entry, or the "since 2020"
  timeframe in the headline.
- Skeleton: ⚠ entirely Matt — study/self-taught, first role, what "since 2020" marks,
  the path to Pertemps then The Home Hospital.
- Target: 120–200

### The "we" vs "I" problem — what Matt personally did (audit §1, §5)

**4. What I personally did vs what the studio did**
- Tags: `voice`, `attribution`, `faq`
- Fills: audit §1 — every project story is agency "we"; "what did *you* personally
  build on X" has no clean answer and the bot must not attribute team work to Matt.
- Skeleton: how my client project work was structured (⚠ solo? small studio? named
  collaborators?), which disciplines were mine on a typical engagement (frontend
  architecture, design system, data-viz components — ⚠ confirm) and which weren't
  (backend/.NET, brand strategy — ⚠). A plain statement the bot can lean on: "when a
  project story says 'we', the frontend and design-system work is generally mine; I
  can't claim the backend or the wider team's contributions."
- Target: 150–250

**5. The Home Hospital: employee, not just a client engagement**
- Tags: `the-home-hospital`, `attribution`, `faq`
- Fills: audit §3 — The Home Hospital is both a `Project` (client "we", "engagement
  wrapped") and an `Experience` employer; the bot reads these as contradictory.
- Skeleton: ⚠ Matt states the real relationship — the project case study describes work
  I did *as the employed frontend lead*; there was no external agency engagement that
  "wrapped". One sentence on why the case study is framed that way (portfolio
  convention) so the bot can reconcile them.
- Target: 100–150

**6. Pertemps: employee, not just a client engagement**
- Tags: `pertemps`, `attribution`, `faq`
- Fills: same as #5 for Pertemps (3 years employed, 2021–2024).
- Skeleton: ⚠ mirror of #5. Note the two roles (junior → software engineer) and that the
  project story covers the platform rebuild I did on staff.
- Target: 100–150

**7. ISE Partners and Mother Goods: how that work related to my roles**
- Tags: `ise-partners`, `mother-goods`, `attribution`, `faq`
- Fills: audit §3 — these two companies have project stories but no `Experience` entry;
  string-matching would wrongly imply they were jobs. "Was this freelance?" is silent.
- Skeleton: ⚠ Matt — freelance? studio/side work? done under one of the two employed
  roles? Rough timing. Keep it short and factual.
- Target: 100–150

### Leadership / team (audit §3 — "one ambiguous bullet", expected question)

**8. Have I led a team / managed people**
- Tags: `leadership`, `faq`, `management`
- Fills: audit §3 — leadership signal is one ambiguous `impact` bullet ("Led frontend
  software development"), no team size, no duration; "has he managed people" outruns the
  data.
- Skeleton: ⚠ the honest answer — led *efforts and technical direction* vs *line-managed
  N people*; team sizes at The Home Hospital and Pertemps; what "led" concretely meant
  (owned architecture, set frontend standards, ran ceremonies, reviewed others' work,
  mentored juniors — pick what's true). If Matt hasn't line-managed, say so plainly and
  frame the direction-setting he *has* done.
- Target: 150–250

**9. How I run a frontend effort / my process**
- Tags: `process`, `ways-of-working`, `leadership`
- Fills: no corpus content on working style beyond "Agile ceremonies" in a bullet.
- Skeleton: ⚠ Figma-first prototyping, component-library discipline, testing as a
  reliability lever (Vitest/Cypress/Sentry — real from the HH bullets), CI/CD ownership,
  how I bring design and engineering together in one loop. AI-assisted tooling gets its
  own entry (#10).
- Target: 200–300

**10. Where I stand on AI-assisted development**
- Tags: `ai`, `tooling`, `opinion`, `faq`
- Fills: real signal in the HH bullets (Claude Code, Cursor, "cutting time spent on
  specs") but no stance articulated; a natural question for a portfolio *with a chatbot*.
- Skeleton: ⚠ how I actually use it day-to-day, what it's changed about spec/delivery
  time, where I keep a human in the loop, why this site's assistant exists.
- Target: 150–250

### Craft convictions (the projects share themes — accessibility, design systems, data-viz)

**11. Accessibility as a default, not a phase**
- Tags: `accessibility`, `craft`, `opinion`
- Fills: `skills` lists "accessibility" on The Home Hospital; the story says
  "accessible, systemized design language from the start" — a conviction worth stating
  once, reusably.
- Skeleton: ⚠ why "from the start rather than layering it on later" (HH story language),
  what that means in practice (semantic HTML, keyboard paths, the 20+ "responsive,
  accessible interfaces" on the Pertemps portal), a concrete example.
- Target: 150–250

**12. Design systems: why I invest early**
- Tags: `design-systems`, `craft`, `figma`
- Fills: recurring across HH (Figma system tied to Vue components), Pertemps (50+
  component Lit/Storybook layer); no single explanation of the *why*.
- Skeleton: ⚠ the argument — new features ship without ad-hoc rebuilding, the in-house
  team gets a durable foundation (HH story), Storybook as the contract. When it's worth
  it and when it isn't.
- Target: 200–300

**13. Data visualization as a thread through my work**
- Tags: `data-visualization`, `craft`
- Fills: `skills` on 3 of 4 projects; the stories describe it (salary data → guidance,
  clinical outcomes → readable, ISE data for different audiences) but never connect it
  as a deliberate specialism.
- Skeleton: ⚠ what draws me to it — translating raw data into something a non-specialist
  reads at a glance; the three examples; any tooling/library preferences.
- Target: 150–250

### FAQ / logistics (audit: contact info absent, availability signal unused)

**14. Availability, and what I'm looking for**
- Tags: `availability`, `hiring`, `faq`, `contact`
- Fills: `About.footerText` ("available for collaborations and full time roles") carries
  a real signal the model doesn't see; #157/#177 templates the email/LinkedIn/résumé
  lines but not *availability intent*.
- Skeleton: ⚠ full-time vs contract vs collaboration; notice period / start timing;
  team size / stage I do my best work in; then point to the contact channels (email —
  see Part 3 — and LinkedIn, already templated).
- Target: 120–200

**15. Where I'm based, remote, and right to work**
- Tags: `location`, `remote`, `faq`, `logistics`
- Fills: headline says "based in London"; nothing on remote/hybrid preference,
  willingness to relocate, or work authorisation — standard recruiter questions.
- Skeleton: ⚠ all Matt — London base, remote/hybrid/on-site preference, travel/reloc,
  right-to-work status for UK (and elsewhere if relevant).
- Target: 80–150

**16. The stack I reach for (and what I'm flexible on)**
- Tags: `tech-stack`, `skills`, `faq`
- Fills: `techStack` is per-project (Vue/TS/.NET/React/Shopify/Umbraco/Lit); no
  synthesised "what does Matt actually work in" or opinion on framework choice.
- Skeleton: ⚠ default (Vue + TS, comfortable in React), backend familiarity (.NET
  service layers, REST), build/test tooling, what I'd happily pick up. Framework-agnostic
  framing so it doesn't read as "Vue only".
- Target: 150–250

**Optional 17 — Role titles: "frontend engineer" vs "web development" vs "software
engineer"** (`faq`, `attribution`). Fills audit §3 role-title inconsistency. Only if
#4/#12 don't already cover it. ~100 words.

---

## Part 3 — Email + indexing spot-check (blocked on Matt)

- **`About.email`** is still `hello@test.com` live. `templateAboutHeader` guards out
  `test.com`/`example.com`, so the `Email:` line is currently suppressed and will appear
  automatically once a real address is published — no code change. Matt sets the real
  address in Studio.
- **Indexing spot-check** (after entries + email are published): the KB doc type rides
  the `/api/reindex` webhook (once #178 merges). Confirm by running `pnpm backfill`
  then querying the chat against a fact that lives *only* in a new KB entry (e.g. the
  availability entry) and checking it retrieves. Also re-verify the About chunk now
  carries the `Email:` line.
- **Resolution comment on #181** — once live, record: the final text of all three role
  summaries, the real email, and the KB entry titles published. That closes the gap
  #156 left open.
