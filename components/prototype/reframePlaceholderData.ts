// PROTOTYPE — mock data + fake SSE stream for issue #13 (loading/reframing
// UI). Shaped after the real contract from #9/#10: one `selection` event
// (ordered slugs + match_reason), then one `copy` event (hero, per-project
// blurbs, About emphasis). No real LLM call — timings are hardcoded to model
// the ~1-2s-to-first-token target and the 8s outer timeout from #12.

export type ReframeProject = {
  slug: string;
  title: string;
  defaultBlurb: string;
  skills: string[];
};

export const reframeAbout = {
  name: "Matt Chan",
  headline: "Senior frontend engineer, building fast, well-crafted UI.",
  bio: "I build product interfaces that hold up under real usage — accessible, performant, and easy for a team to keep shipping against. Recently: design systems, edge-rendered React, and content-driven marketing sites.",
};

export const reframeProjects: ReframeProject[] = [
  {
    slug: "collab-canvas",
    title: "Realtime collaboration canvas",
    defaultBlurb:
      "A multiplayer whiteboard with operational-transform sync and sub-100ms cursor latency.",
    skills: ["state management", "performance"],
  },
  {
    slug: "design-system",
    title: "Design system + component library",
    defaultBlurb:
      "Token-driven component library adopted across six product teams, with visual regression coverage.",
    skills: ["design systems", "accessibility"],
  },
  {
    slug: "edge-marketing",
    title: "Edge-rendered marketing site",
    defaultBlurb:
      "ISR-driven Next.js site with sub-second global TTFB and a headless CMS authoring flow.",
    skills: ["performance", "backend/infra"],
  },
];

export type SelectionEvent = {
  selected: { slug: string; match_reason: string }[];
};

export type CopyEvent = {
  hero: { headline: string; subheadline: string };
  projects: { slug: string; blurb: string }[];
  about: { emphasis: string };
};

// Always the same shape of response, text interpolated with the visitor's
// intent so the transition reads as "tailored" without modeling real
// matching logic — that's #10's job, not this ticket's.
export function mockReframe(intent: string): {
  selection: SelectionEvent;
  copy: CopyEvent;
} {
  const trimmed = intent.trim() || "your interests";
  return {
    selection: {
      selected: [
        {
          slug: "collab-canvas",
          match_reason: `Directly demonstrates work relevant to "${trimmed}".`,
        },
        {
          slug: "design-system",
          match_reason: `Shows systems-level thinking adjacent to "${trimmed}".`,
        },
        {
          slug: "edge-marketing",
          match_reason: `Rounds out the picture beyond the core ask.`,
        },
      ],
    },
    copy: {
      hero: {
        headline: `Built for: ${trimmed}`,
        subheadline: "Here's the work that speaks to it most directly.",
      },
      projects: [
        {
          slug: "collab-canvas",
          blurb: `Rebuilt as the clearest example for "${trimmed}" — conflict-free sync under real concurrent load.`,
        },
        {
          slug: "design-system",
          blurb: `Framed for "${trimmed}": the system decisions that let six teams move independently.`,
        },
        {
          slug: "edge-marketing",
          blurb: `Included for breadth: same rigor applied to a content-heavy, SEO-sensitive surface.`,
        },
      ],
      about: {
        emphasis: `Given "${trimmed}", the throughline worth noting: I default to boring, well-tested primitives so the interesting parts of the product stay interesting.`,
      },
    },
  };
}

export const SELECTION_DELAY_MS = 700;
export const COPY_DELAY_MS = 1900;
export const OUTER_TIMEOUT_MS = 8000;

// Prototype-only escape hatch: typing "timeout" anywhere in the intent
// simulates a stalled stream, so the 8s silent-fallback path can be
// exercised without waiting on a real failure.
export function isSimulatedTimeout(intent: string) {
  return intent.toLowerCase().includes("timeout");
}
