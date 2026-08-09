export interface SelectionEntry {
  slug: string;
  match_reason: string;
}

export interface SelectionCandidate {
  selected: SelectionEntry[];
}

export function validateSelection(
  candidate: SelectionCandidate,
  validSlugs: ReadonlySet<string>,
): SelectionEntry[] {
  return candidate.selected.filter((entry) => validSlugs.has(entry.slug));
}

export interface CopyProjectEntry {
  slug: string;
  blurb: string;
}

export interface CopyCandidate {
  hero: { headline: string; subheadline: string } | null;
  projects: CopyProjectEntry[];
  about: { emphasis: string } | null;
}

export interface CopyBounds {
  headline: number;
  subheadline: number;
  blurb: number;
  emphasis: number;
}

export interface ValidatedCopy {
  hero: { headline: string; subheadline: string } | null;
  projects: CopyProjectEntry[];
  about: { emphasis: string } | null;
}

export function validateCopy(
  candidate: CopyCandidate,
  validSlugs: ReadonlySet<string>,
  bounds: CopyBounds,
): ValidatedCopy {
  const heroValid =
    candidate.hero !== null &&
    candidate.hero.headline.length <= bounds.headline &&
    candidate.hero.subheadline.length <= bounds.subheadline;

  const aboutValid =
    candidate.about !== null &&
    candidate.about.emphasis.length <= bounds.emphasis;

  return {
    hero: heroValid ? candidate.hero : null,
    projects: candidate.projects.filter(
      (entry) =>
        validSlugs.has(entry.slug) && entry.blurb.length <= bounds.blurb,
    ),
    about: aboutValid ? candidate.about : null,
  };
}
