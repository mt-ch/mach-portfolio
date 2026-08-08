import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProjectListItem } from "@/lib/sanity";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: createMock };
  },
}));

const { selectProjects } = await import("./selectProjects");

function makeProject(overrides: Partial<ProjectListItem>): ProjectListItem {
  return {
    _id: "id",
    title: "Untitled",
    slug: { _type: "slug", current: "untitled" },
    summary: "A project",
    coverImage: null,
    techStack: null,
    skills: null,
    impact: null,
    role: null,
    links: null,
    featured: true,
    order: 0,
    dateCompleted: null,
    ...overrides,
  };
}

function mockResponse(selected: Array<{ slug: string; match_reason: string }>) {
  createMock.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify({ selected }) }],
  });
}

describe("selectProjects", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("returns the model's selection entries when within bounds and all slugs are valid", async () => {
    const projects = [
      makeProject({ slug: { _type: "slug", current: "collab-canvas" } }),
      makeProject({ slug: { _type: "slug", current: "design-system" } }),
      makeProject({ slug: { _type: "slug", current: "edge-marketing" } }),
    ];

    mockResponse([
      { slug: "collab-canvas", match_reason: "Direct match." },
      { slug: "design-system", match_reason: "Adjacent." },
      { slug: "edge-marketing", match_reason: "Breadth." },
    ]);

    const result = await selectProjects("distributed systems work", projects);

    expect(result).toEqual([
      { slug: "collab-canvas", match_reason: "Direct match." },
      { slug: "design-system", match_reason: "Adjacent." },
      { slug: "edge-marketing", match_reason: "Breadth." },
    ]);
  });

  it("clamps to 6 entries when the model returns more", async () => {
    const projects = Array.from({ length: 8 }, (_, i) =>
      makeProject({ slug: { _type: "slug", current: `project-${i}` } }),
    );

    mockResponse(
      Array.from({ length: 8 }, (_, i) => ({
        slug: `project-${i}`,
        match_reason: "Reason.",
      })),
    );

    const result = await selectProjects("anything", projects);

    expect(result).toHaveLength(6);
  });

  it("discards entries whose slug is not in the real Project set", async () => {
    const projects = [
      makeProject({ slug: { _type: "slug", current: "collab-canvas" } }),
      makeProject({ slug: { _type: "slug", current: "design-system" } }),
      makeProject({ slug: { _type: "slug", current: "edge-marketing" } }),
    ];

    mockResponse([
      { slug: "collab-canvas", match_reason: "Direct match." },
      { slug: "hallucinated-slug", match_reason: "Made up." },
      { slug: "design-system", match_reason: "Adjacent." },
      { slug: "edge-marketing", match_reason: "Breadth." },
    ]);

    const result = await selectProjects("distributed systems work", projects);

    expect(result.map((entry) => entry.slug)).toEqual([
      "collab-canvas",
      "design-system",
      "edge-marketing",
    ]);
  });

  it("calls Claude Haiku 4.5 with the injection-framed intent and lightweight Project fields, excluding body", async () => {
    const projects = [
      makeProject({
        slug: { _type: "slug", current: "collab-canvas" },
      }),
    ];

    mockResponse([
      { slug: "collab-canvas", match_reason: "Direct match." },
      { slug: "collab-canvas", match_reason: "Direct match." },
      { slug: "collab-canvas", match_reason: "Direct match." },
    ]);

    await selectProjects("distributed systems work", projects);

    expect(createMock).toHaveBeenCalledTimes(1);
    const request = createMock.mock.calls[0][0];
    expect(request.model).toBe("claude-haiku-4-5");

    const userContent = request.messages[0].content as string;
    expect(userContent).toContain("<visitor_intent>distributed systems work</visitor_intent>");
    expect(userContent).toContain("\"slug\":\"collab-canvas\"");
    expect(userContent).not.toContain("_key");
  });

  it("returns an empty selection instead of throwing when the model output isn't valid JSON", async () => {
    const projects = [
      makeProject({ slug: { _type: "slug", current: "collab-canvas" } }),
    ];
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "not json" }],
      stop_reason: "max_tokens",
    });

    const result = await selectProjects("distributed systems work", projects);

    expect(result).toEqual([]);
  });

  it("logs discarded slugs that aren't in the real Project set", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const projects = [
      makeProject({ slug: { _type: "slug", current: "collab-canvas" } }),
    ];
    mockResponse([
      { slug: "collab-canvas", match_reason: "Direct match." },
      { slug: "hallucinated-slug", match_reason: "Made up." },
    ]);

    await selectProjects("distributed systems work", projects);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("discarded"),
      ["hallucinated-slug"],
    );
    warnSpy.mockRestore();
  });
});
