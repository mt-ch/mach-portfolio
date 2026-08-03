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
