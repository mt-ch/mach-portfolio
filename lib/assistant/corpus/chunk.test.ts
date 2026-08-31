import { describe, expect, it } from "vitest";

import type { About, ExperienceEntry, KnowledgeBaseEntry, ProjectForIndex } from "@/lib/sanity";

import { chunkAbout, chunkExperience, chunkKnowledgeEntry, chunkProject } from "./chunk";

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

describe("chunkProject", () => {
  it("produces exactly one chunk when the story has no headings", () => {
    const project = makeProject({
      techStack: ["React", "Yjs"],
      skills: ["state management"],
      impact: ["reduced load time 40%"],
      dateCompleted: "2024-01-01",
      story: [
        {
          _type: "textBlock",
          content: [{ style: "normal", children: [{ text: "A whiteboard app." }] }],
        },
      ],
    });

    const chunks = chunkProject(project);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      id: "project-1:0",
      documentId: "project-1",
      documentType: "project",
    });
    expect(chunks[0].text).toContain("Title: Collab Canvas");
    expect(chunks[0].text).not.toContain("Summary:");
    expect(chunks[0].text).toContain("Tech stack: React, Yjs");
    expect(chunks[0].text).toContain("Skills: state management");
    expect(chunks[0].text).toContain("Impact: reduced load time 40%");
    expect(chunks[0].text).toContain("Date completed: 2024-01-01");
    expect(chunks[0].text).toContain("A whiteboard app.");
  });

  it("produces one chunk even with an empty/placeholder story", () => {
    const chunks = chunkProject(makeProject({ story: null }));

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toContain("Title: Collab Canvas");
  });

  it("templates structured fields into metadata as well as text", () => {
    const chunks = chunkProject(
      makeProject({ techStack: ["React"], skills: ["accessibility"], impact: ["led a team"] }),
    );

    expect(chunks[0].metadata).toMatchObject({
      documentType: "project",
      documentId: "project-1",
      slug: "collab-canvas",
      techStack: ["React"],
      skills: ["accessibility"],
      impact: ["led a team"],
    });
  });

  it("carries summary and a built imageUrl in metadata when a cover image is present", () => {
    const chunks = chunkProject(
      makeProject({
        summary: "A collaborative whiteboard.",
        coverImage: {
          _type: "image",
          asset: { _type: "reference", _ref: "image-abc123-800x600-png" },
        },
      }),
    );

    expect(chunks[0].metadata.summary).toBe("A collaborative whiteboard.");
    expect(chunks[0].metadata.imageUrl).toEqual(expect.any(String));
    expect(chunks[0].metadata.imageUrl).toContain("w=480");
    expect(chunks[0].metadata.imageUrl).toContain("h=270");
  });

  it("sets imageUrl to null when there is no cover image", () => {
    const chunks = chunkProject(makeProject({ coverImage: null }));

    expect(chunks[0].metadata.imageUrl).toBeNull();
  });

  it("splits into one chunk per heading, repeating the structured-field header in each", () => {
    const project = makeProject({
      techStack: ["React"],
      story: [
        {
          _type: "textBlock",
          content: [
            { style: "h2", children: [{ text: "Problem" }] },
            { style: "normal", children: [{ text: "Onboarding was slow." }] },
            { style: "h2", children: [{ text: "Solution" }] },
            { style: "normal", children: [{ text: "We rebuilt the flow." }] },
          ],
        },
      ],
    });

    const chunks = chunkProject(project);

    expect(chunks).toHaveLength(2);
    expect(chunks.map((chunk) => chunk.id)).toEqual(["project-1:0", "project-1:1"]);
    for (const chunk of chunks) {
      expect(chunk.text).toContain("Title: Collab Canvas");
      expect(chunk.text).toContain("Tech stack: React");
    }
    expect(chunks[0].text).toContain("## Problem");
    expect(chunks[0].text).toContain("Onboarding was slow.");
    expect(chunks[1].text).toContain("## Solution");
    expect(chunks[1].text).toContain("We rebuilt the flow.");
  });

  it("splits into one chunk per textBlock.heading, each still carrying the full header", () => {
    const project = makeProject({
      techStack: ["React"],
      story: [
        {
          _type: "textBlock",
          heading: "Problem",
          content: [{ style: "normal", children: [{ text: "Onboarding was slow." }] }],
        },
        {
          _type: "textBlock",
          heading: "Solution",
          content: [{ style: "normal", children: [{ text: "We rebuilt the flow." }] }],
        },
      ],
    });

    const chunks = chunkProject(project);

    expect(chunks).toHaveLength(2);
    for (const chunk of chunks) {
      expect(chunk.text).toContain("Title: Collab Canvas");
      expect(chunk.text).toContain("Tech stack: React");
    }
    expect(chunks[0].text).toContain("## Problem");
    expect(chunks[0].text).toContain("Onboarding was slow.");
    expect(chunks[1].text).toContain("## Solution");
    expect(chunks[1].text).toContain("We rebuilt the flow.");
  });

  it("yields N chunks for a story with N authored textBlock sections", () => {
    const project = makeProject({
      story: [
        {
          _type: "textBlock",
          heading: "One",
          content: [{ style: "normal", children: [{ text: "First." }] }],
        },
        {
          _type: "textBlock",
          heading: "Two",
          content: [{ style: "normal", children: [{ text: "Second." }] }],
        },
        {
          _type: "textBlock",
          heading: "Three",
          content: [{ style: "normal", children: [{ text: "Third." }] }],
        },
      ],
    });

    expect(chunkProject(project)).toHaveLength(3);
  });

  it("includes an Image Block's caption/alt text at its position in the flattened story", () => {
    const project = makeProject({
      story: [
        {
          _type: "textBlock",
          content: [{ style: "normal", children: [{ text: "Before the image." }] }],
        },
        {
          _type: "imageBlock",
          image: { alt: "Whiteboard canvas with sticky notes" },
          caption: "The collaborative canvas in use.",
          layout: "full",
        },
        {
          _type: "textBlock",
          content: [{ style: "normal", children: [{ text: "After the image." }] }],
        },
      ],
    });

    const chunks = chunkProject(project);

    expect(chunks).toHaveLength(1);
    const beforeIndex = chunks[0].text.indexOf("Before the image.");
    const captionIndex = chunks[0].text.indexOf("The collaborative canvas in use.");
    const altIndex = chunks[0].text.indexOf("Whiteboard canvas with sticky notes");
    const afterIndex = chunks[0].text.indexOf("After the image.");

    expect(beforeIndex).toBeGreaterThanOrEqual(0);
    expect(captionIndex).toBeGreaterThan(beforeIndex);
    expect(altIndex).toBeGreaterThan(beforeIndex);
    expect(afterIndex).toBeGreaterThan(captionIndex);
    expect(afterIndex).toBeGreaterThan(altIndex);
  });

  it("contributes nothing for an Image Block with no caption or alt text", () => {
    const withoutText = makeProject({
      story: [
        {
          _type: "textBlock",
          content: [{ style: "normal", children: [{ text: "Only text." }] }],
        },
        { _type: "imageBlock", layout: "full" },
      ],
    });
    const withoutImage = makeProject({
      story: [
        {
          _type: "textBlock",
          content: [{ style: "normal", children: [{ text: "Only text." }] }],
        },
      ],
    });

    expect(chunkProject(withoutText)[0].text).toBe(chunkProject(withoutImage)[0].text);
  });
});

describe("chunkExperience", () => {
  it("folds every role under the company into a single corpus entry", () => {
    const entry: ExperienceEntry = {
      _id: "exp-1",
      company: "Acme",
      companyUrl: "https://acme.example",
      logo: null,
      order: 0,
      roles: [
        {
          _key: "r1",
          title: "Senior Engineer",
          startDate: "2022-01-01",
          endDate: null,
          summary: null,
          isCurrent: true,
        },
        {
          _key: "r2",
          title: "Engineer",
          startDate: "2020-01-01",
          endDate: "2022-01-01",
          summary: null,
          isCurrent: false,
        },
      ],
    };

    const chunks = chunkExperience(entry);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toContain("Company: Acme");
    expect(chunks[0].text).toContain("Role: Senior Engineer");
    expect(chunks[0].text).toContain("Dates: 2022-01-01 – present");
    expect(chunks[0].text).toContain("Role: Engineer");
    expect(chunks[0].text).toContain("Dates: 2020-01-01 – 2022-01-01");
    expect(chunks[0].metadata).toMatchObject({
      documentType: "experience",
      documentId: "exp-1",
      company: "Acme",
      title: "Senior Engineer",
      roleTitles: ["Senior Engineer", "Engineer"],
      isCurrent: true,
    });
  });

  it("marks a company with only past roles as not current", () => {
    const entry: ExperienceEntry = {
      _id: "exp-2",
      company: "Globex",
      companyUrl: null,
      logo: null,
      order: 1,
      roles: [
        {
          _key: "r1",
          title: "Contractor",
          startDate: "2018-01-01",
          endDate: "2019-01-01",
          summary: null,
          isCurrent: false,
        },
      ],
    };

    expect(chunkExperience(entry)[0].metadata).toMatchObject({ isCurrent: false });
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

describe("chunkKnowledgeEntry", () => {
  it("produces exactly one chunk with a positional id", () => {
    const chunks = chunkKnowledgeEntry(makeKnowledgeEntry());

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      id: "kb-1:0",
      documentId: "kb-1",
      documentType: "knowledge",
    });
  });

  it("templates the title, tags, and flattened body into the chunk text", () => {
    const chunks = chunkKnowledgeEntry(
      makeKnowledgeEntry({
        title: "FAQ: Rates",
        tags: ["positioning", "faq"],
        body: [{ style: "normal", children: [{ text: "I work on a project basis." }] }],
      }),
    );

    expect(chunks[0].text).toContain("Knowledge base note: FAQ: Rates");
    expect(chunks[0].text).toContain("Tags: positioning, faq");
    expect(chunks[0].text).toContain("I work on a project basis.");
  });

  it("does not split multi-heading bodies into multiple chunks", () => {
    const chunks = chunkKnowledgeEntry(
      makeKnowledgeEntry({
        body: [
          { style: "h2", children: [{ text: "Section" }] },
          { style: "normal", children: [{ text: "Still one chunk." }] },
        ],
      }),
    );

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toContain("Still one chunk.");
  });

  it("sets documentType, title, and tags (defaulted to []) in metadata", () => {
    const chunks = chunkKnowledgeEntry(makeKnowledgeEntry({ tags: null }));

    expect(chunks[0].metadata).toMatchObject({
      documentType: "knowledge",
      documentId: "kb-1",
      title: "Positioning statement",
      tags: [],
    });
  });
});

describe("chunkAbout", () => {
  it("templates name/headline into a single chunk", () => {
    const about: About = {
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
    };

    const chunks = chunkAbout(about);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].id).toBe("about:0");
    expect(chunks[0].text).toContain("Name: Matt Chan");
    expect(chunks[0].text).toContain("Headline: Frontend engineer");
    expect(chunks[0].metadata).toMatchObject({
      documentType: "about",
      documentId: "about",
      email: "matt@example.com",
    });
  });
});
