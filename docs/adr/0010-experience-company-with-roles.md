# Experience is a company with one or more roles

Issue #161 (parent #158) restructures Experience so one document represents a
company containing a `roles` array, rather than one document per company/title
combination. This matches how a real CV reads: a repeated employer appears once,
with each stint listed under it.

**One document per company; each stint is a Role.** Company-level fields
(`company`, `companyUrl`, `logo`, `order`) live on the document. `roles` is a
required array (min 1); each role has `title`, `startDate`, optional `endDate`
(empty means current), and an optional Portable Text `summary`. Roles are
draggable and display order follows array order — no per-role `order` field.

**`isCurrent` is computed per role, not per document.** `getExperience` /
`getExperienceEntryById` map each role to add `isCurrent = endDate == null`. A
company counts as "current" in corpus metadata if any of its roles is ongoing.

**The corpus emits exactly one entry per company document.** `chunkExperience`
folds every role — title, date range, and flattened summary — into the header
template and passes no Portable Text body, so company context attaches to every
role in a single chunk. Metadata carries `company`, the leading role's `title`,
`roleTitles`, and the aggregate `isCurrent`. The old per-document `startDate` /
`endDate` metadata keys are dropped — a single pair is meaningless across
multiple roles, and nothing filters on them today.

**The Studio content list is unchanged** — still a single Experience type
(`sanity/structure.ts` untouched).

**Generated types are hand-maintained.** `sanity typegen` needs a live Sanity
connection this repo's local/CI environments lack, so `sanity.types.ts` was
edited by hand to match the new query projection, following the existing
convention in `lib/sanity/types.ts`.

**No homepage change in this ticket.** The homepage Experience table is still
hardcoded; wiring it to the nested shape is #164 (blocked by this).
