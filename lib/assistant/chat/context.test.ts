import { describe, expect, it } from "vitest";

import type { CorpusChunkMatch } from "@/lib/assistant/corpus/vectorStore";

import { buildContext, projectReferenceFrom } from "./context";

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
      summary: "Real-time collaborative canvas under load.",
      imageUrl: "https://cdn.sanity.io/images/collab-canvas.jpg",
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

  it("skips chunks with empty text", () => {
    const { contextText } = buildContext([projectChunk({ text: "" })]);

    expect(contextText).toBe("");
  });

  it("returns empty context for no chunks", () => {
    expect(buildContext([])).toEqual({ contextText: "" });
  });

  it("stops including chunks once the token budget would be exceeded, but always keeps the first", () => {
    const huge = "x".repeat(30_000);
    const { contextText } = buildContext([
      projectChunk({ text: huge }),
      experienceChunk(),
    ]);

    expect(contextText).toBe(huge);
  });
});

describe("projectReferenceFrom", () => {
  it("returns a reference when the asserted slug matches a retrieved Project chunk", () => {
    const ref = projectReferenceFrom([projectChunk(), experienceChunk()], "collab-canvas");

    expect(ref).toEqual({
      slug: "collab-canvas",
      title: "Collab Canvas",
      summary: "Real-time collaborative canvas under load.",
      imageUrl: "https://cdn.sanity.io/images/collab-canvas.jpg",
    });
  });

  it("returns null when the asserted slug is absent from retrieval", () => {
    expect(projectReferenceFrom([projectChunk()], "some-other-project")).toBeNull();
  });

  it("returns null when there is no asserted slug", () => {
    expect(projectReferenceFrom([projectChunk()], null)).toBeNull();
  });

  it("returns null for an About/Experience-only retrieval", () => {
    expect(
      projectReferenceFrom(
        [
          experienceChunk(),
          {
            id: "about:0",
            score: 0.7,
            text: "Name: Matt Chan",
            metadata: { documentType: "about", documentId: "about", name: "Matt Chan" },
          },
        ],
        "collab-canvas",
      ),
    ).toBeNull();
  });

  it("never matches a non-project chunk that happens to carry the slug", () => {
    const knowledgeChunk: CorpusChunkMatch = {
      id: "kb-1:0",
      score: 0.9,
      text: "some knowledge",
      metadata: {
        documentType: "knowledge" as CorpusChunkMatch["metadata"]["documentType"],
        documentId: "kb-1",
        slug: "collab-canvas",
      },
    };

    expect(projectReferenceFrom([knowledgeChunk], "collab-canvas")).toBeNull();
  });

  it("degrades missing summary/imageUrl metadata to safe defaults", () => {
    const ref = projectReferenceFrom(
      [
        projectChunk({
          metadata: {
            documentType: "project",
            documentId: "proj-1",
            title: "Collab Canvas",
            slug: "collab-canvas",
          },
        }),
      ],
      "collab-canvas",
    );

    expect(ref).toEqual({
      slug: "collab-canvas",
      title: "Collab Canvas",
      summary: "",
      imageUrl: null,
    });
  });
});
