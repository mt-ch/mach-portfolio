import { describe, expect, it } from "vitest";

import type { About, KnowledgeBaseEntry, ProjectForIndex } from "@/lib/sanity";

import { templateAboutHeader, templateKnowledgeHeader, templateProjectHeader } from "./templates";

function makeAbout(overrides: Partial<About> = {}): About {
  return {
    _id: "about",
    name: "Matt Chan",
    headline: "Frontend engineer",
    bio: null,
    whatIDo: null,
    logo: null,
    footerText: null,
    resumeUrl: null,
    email: "matt@example.com",
    socialLinks: null,
    howIWork: null,
    ...overrides,
  };
}

function makeProject(overrides: Partial<ProjectForIndex> = {}): ProjectForIndex {
  return {
    _id: "project-1",
    title: "Collab Canvas",
    slug: { current: "collab-canvas" },
    summary: "A collaborative whiteboard.",
    heroText: null,
    role: null,
    coverImage: null,
    story: null,
    techStack: null,
    skills: null,
    impact: null,
    dateCompleted: null,
    ...overrides,
  };
}

describe("templateAboutHeader", () => {
  it("always includes Name and Headline", () => {
    const header = templateAboutHeader(makeAbout({ email: null as unknown as string }));

    expect(header).toContain("Name: Matt Chan");
    expect(header).toContain("Headline: Frontend engineer");
  });

  it("includes Email when set to a real address", () => {
    const header = templateAboutHeader(makeAbout({ email: "matt@realdomain.com" }));

    expect(header).toContain("Email: matt@realdomain.com");
  });

  it("omits Email when null", () => {
    const header = templateAboutHeader(makeAbout({ email: null as unknown as string }));

    expect(header).not.toContain("Email:");
  });

  it("omits Email when it looks like seed/placeholder data", () => {
    const header = templateAboutHeader(makeAbout({ email: "hello@test.com" }));

    expect(header).not.toContain("Email:");
  });

  it("includes LinkedIn when present in socialLinks", () => {
    const header = templateAboutHeader(
      makeAbout({
        socialLinks: [
          {
            _type: "socialLink",
            _key: "a",
            platform: "LinkedIn",
            url: "https://linkedin.com/in/matt",
          },
        ],
      }),
    );

    expect(header).toContain("LinkedIn: https://linkedin.com/in/matt");
  });

  it("omits LinkedIn when socialLinks has no LinkedIn entry", () => {
    const header = templateAboutHeader(
      makeAbout({
        socialLinks: [
          { _type: "socialLink", _key: "a", platform: "GitHub", url: "https://github.com/matt" },
        ],
      }),
    );

    expect(header).not.toContain("LinkedIn:");
  });

  it("omits LinkedIn when socialLinks is null", () => {
    const header = templateAboutHeader(makeAbout({ socialLinks: null }));

    expect(header).not.toContain("LinkedIn:");
  });

  it("includes Résumé when resumeUrl is set", () => {
    const header = templateAboutHeader(
      makeAbout({ resumeUrl: "https://cdn.sanity.io/files/proj/prod/resume.pdf" }),
    );

    expect(header).toContain("Résumé: https://cdn.sanity.io/files/proj/prod/resume.pdf");
  });

  it("omits Résumé when null", () => {
    const header = templateAboutHeader(makeAbout({ resumeUrl: null }));

    expect(header).not.toContain("Résumé:");
  });
});

function makeKnowledgeEntry(
  overrides: Partial<KnowledgeBaseEntry> = {},
): KnowledgeBaseEntry {
  return {
    _id: "kb-1",
    title: "Positioning statement",
    body: [{ style: "normal", children: [{ text: "I focus on frontend systems." }] }],
    tags: null,
    ...overrides,
  };
}

describe("templateKnowledgeHeader", () => {
  it("always includes the title on the 'Knowledge base note:' line", () => {
    const header = templateKnowledgeHeader(makeKnowledgeEntry({ title: "FAQ: Rates" }));

    expect(header).toContain("Knowledge base note: FAQ: Rates");
  });

  it("includes a Tags line when tags are present", () => {
    const header = templateKnowledgeHeader(
      makeKnowledgeEntry({ tags: ["positioning", "faq"] }),
    );

    expect(header).toContain("Tags: positioning, faq");
  });

  it("omits the Tags line when tags is null", () => {
    const header = templateKnowledgeHeader(makeKnowledgeEntry({ tags: null }));

    expect(header).not.toContain("Tags:");
  });

  it("omits the Tags line when tags is empty", () => {
    const header = templateKnowledgeHeader(makeKnowledgeEntry({ tags: [] }));

    expect(header).not.toContain("Tags:");
  });
});

describe("templateProjectHeader", () => {
  it("never embeds the summary line", () => {
    const header = templateProjectHeader(makeProject());

    expect(header).not.toContain("Summary:");
    expect(header).not.toContain("A collaborative whiteboard.");
  });

  it("includes 'What it is:' from heroText when present", () => {
    const header = templateProjectHeader(
      makeProject({ heroText: "A real-time collaborative whiteboard." }),
    );

    expect(header).toContain("What it is: A real-time collaborative whiteboard.");
  });

  it("omits the 'What it is:' line when heroText is null", () => {
    const header = templateProjectHeader(makeProject({ heroText: null }));

    expect(header).not.toContain("What it is:");
  });

  it("does not fall back to summary when heroText is null", () => {
    const header = templateProjectHeader(
      makeProject({ heroText: null, summary: "A collaborative whiteboard." }),
    );

    expect(header).not.toContain("A collaborative whiteboard.");
  });

  it("includes 'Type of work:' from role when present", () => {
    const header = templateProjectHeader(
      makeProject({ role: "Web Development, Branding" }),
    );

    expect(header).toContain("Type of work: Web Development, Branding");
  });

  it("omits the 'Type of work:' line when role is null", () => {
    const header = templateProjectHeader(makeProject({ role: null }));

    expect(header).not.toContain("Type of work:");
  });
});
