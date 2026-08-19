import { describe, expect, it } from "vitest";

import type { CorpusChunkMatch } from "@/lib/corpus/vectorStore";

import { buildContext } from "./context";

function projectChunk(overrides: Partial<CorpusChunkMatch> = {}): CorpusChunkMatch {
  return {
    id: "proj-1:0",
    score: 0.9,
    text: "Title: Collab Canvas\n\nSummary: Real-time collaborative canvas.",
    metadata: {
      documentType: "project",
      documentId: "proj-1",
      title: "Collab Canvas",
      slug: "collab-canvas",
    },
    ...overrides,
  };
}

function experienceChunk(overrides: Partial<CorpusChunkMatch> = {}): CorpusChunkMatch {
  return {
    id: "exp-1:0",
    score: 0.8,
    text: "Company: Acme\n\nTitle: Staff Engineer",
    metadata: {
      documentType: "experience",
      documentId: "exp-1",
      company: "Acme",
      title: "Staff Engineer",
    },
    ...overrides,
  };
}

describe("buildContext", () => {
  it("joins chunk text in retrieval order", () => {
    const { contextText } = buildContext([projectChunk(), experienceChunk()]);

    expect(contextText).toContain("Collab Canvas");
    expect(contextText).toContain("Acme");
    expect(contextText.indexOf("Collab Canvas")).toBeLessThan(
      contextText.indexOf("Acme"),
    );
  });

  it("builds a project citation linking to its project page", () => {
    const { citations } = buildContext([projectChunk()]);

    expect(citations).toEqual([
      { label: "Collab Canvas", href: "/projects/collab-canvas" },
    ]);
  });

  it("builds an experience citation without a dedicated page", () => {
    const { citations } = buildContext([experienceChunk()]);

    expect(citations).toEqual([
      { label: "Staff Engineer at Acme", href: "/" },
    ]);
  });

  it("builds an about citation", () => {
    const { citations } = buildContext([
      {
        id: "about:0",
        score: 0.7,
        text: "Name: Matt Chan",
        metadata: { documentType: "about", documentId: "about", name: "Matt Chan" },
      },
    ]);

    expect(citations).toEqual([{ label: "Matt Chan", href: "/" }]);
  });

  it("falls back to the About shape for an unrecognized documentType rather than throwing", () => {
    const { citations } = buildContext([
      {
        id: "mystery:0",
        score: 0.5,
        text: "some text",
        metadata: {
          documentType: "future-type" as CorpusChunkMatch["metadata"]["documentType"],
          documentId: "mystery",
          name: "Mystery Doc",
        },
      },
    ]);

    expect(citations).toEqual([{ label: "Mystery Doc", href: "/" }]);
  });

  it("dedupes citations by documentId, keeping first occurrence order", () => {
    const { citations } = buildContext([
      projectChunk({ id: "proj-1:0" }),
      projectChunk({ id: "proj-1:1" }),
      experienceChunk(),
    ]);

    expect(citations).toEqual([
      { label: "Collab Canvas", href: "/projects/collab-canvas" },
      { label: "Staff Engineer at Acme", href: "/" },
    ]);
  });

  it("skips chunks with empty text", () => {
    const { contextText, citations } = buildContext([
      projectChunk({ text: "" }),
    ]);

    expect(contextText).toBe("");
    expect(citations).toEqual([]);
  });

  it("returns empty context and citations for no chunks", () => {
    const result = buildContext([]);

    expect(result).toEqual({ contextText: "", citations: [] });
  });

  it("stops including chunks once the token budget would be exceeded, but always keeps the first", () => {
    const huge = "x".repeat(30_000);
    const { contextText, citations } = buildContext([
      projectChunk({ text: huge }),
      experienceChunk(),
    ]);

    expect(contextText).toBe(huge);
    expect(citations).toEqual([
      { label: "Collab Canvas", href: "/projects/collab-canvas" },
    ]);
  });
});
