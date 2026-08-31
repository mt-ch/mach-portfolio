# mach-portfolio

A recruiter/client-facing professional portfolio site showcasing projects, work history, and background — not a blog or writing platform.

## Language

**Project**:
A showcased body of work with its own case-study detail page, covering what was built, the role played, and technologies used.
_Avoid_: Case study, work sample

**Featured Project**:
A Project flagged to appear in the single-page overview, as distinct from Projects that only appear in the full project listing.
_Avoid_: Highlighted project, pinned project

**Experience**:
A work-history document representing one company. Repeated employers appear once; each distinct stint is a Role in the document's `roles` array.
_Avoid_: Job, position

**Role (Experience)**:
One stint at a company — title, start date, optional end date (empty means current), optional summary — held in an Experience document's `roles` array. Display order follows array order (draggable in the Studio). Distinct from the `role` field on a Project.
_Avoid_: Job, position, tenure

**About**:
The singleton record holding site-owner profile information (name, headline, bio, contact, resume, social links). Exactly one instance ever exists.
_Avoid_: Bio, profile (use About as the canonical document type name)

**Project Header**:
The fixed section at the top of a Project's detail page — title, summary, role, tech stack, links — shown above the Project Story without an image slot.
_Avoid_: Hero, banner

**Project Story**:
The ordered, Sanity-editable sequence of Content Blocks composing a Project's case-study narrative, stored in the `story` field.
_Avoid_: Body, case study body

**Content Block**:
A single item in a Content Block array — a Text Block or an Image Block. Modeled generically: the Project Story and the homepage "How I work" section (About `howIWork`) both use it, and other rich-text fields could adopt it later.
_Avoid_: Section, module

**Text Block**:
A Content Block wrapping a standard Portable Text array (headings, bold, italic, links).

**Image Block**:
A Content Block holding one or two images (each with its own alt text), an optional shared caption, and a layout (full-bleed, inset, or side-by-side pair).

**Knowledge Base Entry**:
A hand-authored, bot-only note (title + Portable Text body + optional tags) that the assistant retrieves from during chat but which never renders anywhere on the site. Indexed into the chat corpus like any other document, but excluded from client-visible reference/citation output at source.
_Avoid_: FAQ, snippet, bot note

## Project structure

Where files go. See `docs/adr/0006-repo-structure.md` for the rationale.

- `components/ui/` — generic, presentational, no domain knowledge (cover-image wrapper). Flat, one exception: `components/ui/cursor/` groups the custom cursor's files around its one pure test seam (see `docs/adr/0007-custom-cursor-interaction-model.md`).
- `components/layout/` — site chrome: navigation, footer.
- `components/features/<name>/` — one folder per domain concept or page section: `home/`, `project/`, `chat/`, `content/` (the shared Content Block renderer `ContentBlocks`, the single render path for any Content Block array — Project Story and the homepage "How I work" section), `theme/`, `transition/` (the page-transition provider, `TransitionLink`, and the `transitionPhase` reducer — see `docs/adr/0008-page-transition-overlay-model.md`). Nothing sits loose at the root of `components/`. Chat enter/exit motion (the `motion` library, the shared duration/easing tokens, the restraint principle, and reduced-motion handling) follows `docs/adr/0009-chat-motion-conventions.md`.
- `lib/assistant/` — the chatbot: `chat/`, `corpus/`, `guardrails/`.
- `lib/sanity/` — the data layer. The only module that constructs the Sanity client.
- `lib/theme/` — shared theme constants (storage key, dark class, media query), imported by both the pre-hydration `<script>` and the theme hook.
- `lib/transition/` — shared page-transition timing and easing constants, imported by the transition reducer's consumers (`PageTransitionProvider`).
- `app/layout.tsx` — document shell, fonts, theme bootstrap `<script>`, `ThemeProvider`. Nothing else.
- `app/(site)/` — the public site (route group, no URL segment). Its layout owns cursor, chat shell, navigation.
- `app/studio/`, `app/api/` — outside `(site)`; the Studio renders no site chrome.
- Co-locate a component's test next to it (`Foo.tsx` / `Foo.test.tsx`). Imports use the `@/*` alias.

### Testing

Assert externally observable behaviour — what a visitor sees, what a caller receives — never markup. A test should fail only when behaviour regresses; checking that a class name is present or that the DOM nests a certain way is not a test worth keeping. Model new tests on the `lib/` and API-route suites (chat context building, `/api/chat`, retrieval, guardrail units).
