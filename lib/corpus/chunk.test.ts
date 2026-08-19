import { describe, expect, it } from "vitest";

import type { About, ExperienceEntry, ProjectForIndex } from "@/lib/sanity";

import { chunkAbout, chunkExperience, chunkProject } from "./chunk";

function makeProject(overrides: Partial<ProjectForIndex> = {}): ProjectForIndex {
  return {
    _id: "project-1",
    title: "Collab Canvas",
    slug: { current: "collab-canvas" },
    summary: "A collaborative whiteboard.",
    body: null,
    techStack: null,
    skills: null,
    impact: null,
    dateCompleted: null,
    ...overrides,
  };
}

describe("chunkProject", () => {
  it("produces exactly one chunk when the body has no headings", () => {
    const project = makeProject({
      techStack: ["React", "Yjs"],
      skills: ["state management"],
      impact: ["reduced load time 40%"],
      dateCompleted: "2024-01-01",
      body: [{ style: "normal", children: [{ text: "A whiteboard app." }] }],
    });

    const chunks = chunkProject(project);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      id: "project-1:0",
      documentId: "project-1",
      documentType: "project",
    });
    expect(chunks[0].text).toContain("Title: Collab Canvas");
    expect(chunks[0].text).toContain("Summary: A collaborative whiteboard.");
    expect(chunks[0].text).toContain("Tech stack: React, Yjs");
    expect(chunks[0].text).toContain("Skills: state management");
    expect(chunks[0].text).toContain("Impact: reduced load time 40%");
    expect(chunks[0].text).toContain("Date completed: 2024-01-01");
    expect(chunks[0].text).toContain("A whiteboard app.");
  });

  it("produces one chunk even with an empty/placeholder body", () => {
    const chunks = chunkProject(makeProject({ body: null }));

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

  it("splits into one chunk per heading, repeating the structured-field header in each", () => {
    const project = makeProject({
      techStack: ["React"],
      body: [
        { style: "h2", children: [{ text: "Problem" }] },
        { style: "normal", children: [{ text: "Onboarding was slow." }] },
        { style: "h2", children: [{ text: "Solution" }] },
        { style: "normal", children: [{ text: "We rebuilt the flow." }] },
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
});

describe("chunkExperience", () => {
  it("templates company/title/dates and marks current roles as present", () => {
    const entry: ExperienceEntry = {
      _id: "exp-1",
      company: "Acme",
      title: "Senior Engineer",
      startDate: "2022-01-01",
      endDate: null,
      summary: null,
      logo: null,
      order: 0,
      isCurrent: true,
    };

    const chunks = chunkExperience(entry);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toContain("Company: Acme");
    expect(chunks[0].text).toContain("Dates: 2022-01-01 – present");
    expect(chunks[0].metadata).toMatchObject({
      documentType: "experience",
      documentId: "exp-1",
      isCurrent: true,
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
      resumeUrl: null,
      email: "matt@example.com",
      socialLinks: null,
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
