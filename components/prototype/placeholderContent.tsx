// PROTOTYPE — flat placeholder content for issue #12's variants, so the
// prototype doesn't depend on live Sanity data. Not shaped like real
// Sanity/typegen types on purpose — this is throwaway.

export const placeholderAbout = {
  name: "Matt Chan",
  headline: "Senior frontend engineer, building fast, well-crafted UI.",
  bio: "I build product interfaces that hold up under real usage — accessible, performant, and easy for a team to keep shipping against. Recently: design systems, edge-rendered React, and content-driven marketing sites.",
};

export const placeholderProjects = [
  {
    id: "p1",
    title: "Realtime collaboration canvas",
    blurb:
      "A multiplayer whiteboard with operational-transform sync and sub-100ms cursor latency.",
    tags: ["React", "WebSockets", "Complex state"],
  },
  {
    id: "p2",
    title: "Design system + component library",
    blurb:
      "Token-driven component library adopted across six product teams, with visual regression coverage.",
    tags: ["Design systems", "Storybook", "Accessibility"],
  },
  {
    id: "p3",
    title: "Edge-rendered marketing site",
    blurb:
      "ISR-driven Next.js site with sub-second global TTFB and a headless CMS authoring flow.",
    tags: ["Next.js", "Performance", "CMS"],
  },
];
