export type SelectionEntry = { slug: string; match_reason: string };
export type SelectionEvent = { selected: SelectionEntry[] };

export type CopyProjectEntry = { slug: string; blurb: string };
export type CopyEvent = {
  hero: { headline: string; subheadline: string };
  projects: CopyProjectEntry[];
  about: { emphasis: string };
};

// Canned copy, standing in for a real LLM call (see issue #21).
// The canned `selection` shape is now unused by the route (real selection
// call landed in #20) but stays exported for the type and any future fallback use.
// Slugs mirror the placeholder set used in the #13 prototype.
export function cannedReframe(intent: string): {
  selection: SelectionEvent;
  copy: CopyEvent;
} {
  return {
    selection: {
      selected: [
        {
          slug: "collab-canvas",
          match_reason: `Directly demonstrates work relevant to "${intent}".`,
        },
        {
          slug: "design-system",
          match_reason: `Shows systems-level thinking adjacent to "${intent}".`,
        },
        {
          slug: "edge-marketing",
          match_reason: "Rounds out the picture beyond the core ask.",
        },
      ],
    },
    copy: {
      hero: {
        headline: `Built for: ${intent}`,
        subheadline: "Here's the work that speaks to it most directly.",
      },
      projects: [
        {
          slug: "collab-canvas",
          blurb: `Rebuilt as the clearest example for "${intent}" — conflict-free sync under real concurrent load.`,
        },
        {
          slug: "design-system",
          blurb: `Framed for "${intent}": the system decisions that let six teams move independently.`,
        },
        {
          slug: "edge-marketing",
          blurb: `Included for breadth: same rigor applied to a content-heavy, SEO-sensitive surface.`,
        },
      ],
      about: {
        emphasis: `Given "${intent}", the throughline worth noting: I default to boring, well-tested primitives so the interesting parts of the product stay interesting.`,
      },
    },
  };
}
