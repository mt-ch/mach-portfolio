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
A single work-history entry — one company/title/date-range combination — shown in reverse-chronological order by default.
_Avoid_: Job, position, role (role is a field within a Project, not this concept)

**About**:
The singleton record holding site-owner profile information (name, headline, bio, contact, resume, social links). Exactly one instance ever exists.
_Avoid_: Bio, profile (use About as the canonical document type name)

**Project Header**:
The fixed, non-reorderable section of a Project detail page: title, `summary`, role, tech stack, and links. Text/meta only — no cover image (see Project Story for where imagery lives).
_Avoid_: Hero (this site's Hero is the homepage's; the Project's fixed section is the Header)

**Project Story**:
The ordered, editor-reorderable array of Content Blocks that makes up a Project's case-study narrative. Replaces the old plain `body` Portable Text field.
_Avoid_: Body, content (body is the old field being replaced by Story)

**Content Block**:
One entry in a Project Story. Two kinds exist for v1: Text Block (rich Portable Text — headings, bold, italic, links) and Image Block (one or two images with a full-bleed/inset/side-by-side-pair layout, each image with its own alt text, plus an optional caption). Content Block types are modeled generically so other singleton/rich-text fields (e.g. About's bio) could adopt the same system later, even though only Project uses it for now.
_Avoid_: Page builder module, section (block is the canonical term)
