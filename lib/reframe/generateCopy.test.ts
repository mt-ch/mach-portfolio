import { beforeEach, describe, expect, it, vi } from "vitest";

import type { About, ProjectDetail } from "@/lib/sanity";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: createMock };
  },
}));

const { generateCopy, COPY_BOUNDS } = await import("./generateCopy");

function makeProject(overrides: Partial<ProjectDetail>): ProjectDetail {
  return {
    _id: "id",
    title: "Untitled",
    slug: { _type: "slug", current: "untitled" },
    summary: "A project",
    body: null,
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
  } as ProjectDetail;
}

const about: About = {
  _id: "about",
  name: "Matt Chan",
  headline: "Frontend engineer",
  bio: null,
  resumeUrl: null,
  email: "matt@example.com",
  socialLinks: null,
};

function mockCopyResponse(copy: unknown) {
  createMock.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify(copy) }],
  });
}

describe("generateCopy", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("returns the model's copy for hero, project blurbs, and About emphasis", async () => {
    const selected = [
      {
        project: makeProject({
          slug: { _type: "slug", current: "collab-canvas" },
        }),
        match_reason: "Direct match.",
      },
    ];

    mockCopyResponse({
      hero: {
        headline: "Real-time systems, built to survive real users",
        subheadline: "The work that speaks to concurrent editing most directly.",
      },
      projects: [
        { slug: "collab-canvas", blurb: "Conflict-free sync under load." },
      ],
      about: { emphasis: "Deep experience in distributed state." },
    });

    const result = await generateCopy("distributed systems work", selected, about);

    expect(result).toEqual({
      hero: {
        headline: "Real-time systems, built to survive real users",
        subheadline: "The work that speaks to concurrent editing most directly.",
      },
      projects: [
        { slug: "collab-canvas", blurb: "Conflict-free sync under load." },
      ],
      about: { emphasis: "Deep experience in distributed state." },
    });
  });

  it("calls Claude Haiku 4.5 with the injection-framed intent, the selected Projects' depth and match reasons, and About's headline and bio", async () => {
    const selected = [
      {
        project: makeProject({
          title: "Collab Canvas",
          slug: { _type: "slug", current: "collab-canvas" },
          summary: "Multiplayer editing surface",
          body: [
            {
              _type: "block",
              _key: "b1",
              children: [
                { _type: "span", _key: "s1", text: "CRDT merge strategy." },
              ],
            },
          ],
        }),
        match_reason: "Direct match on concurrent state.",
      },
    ];

    mockCopyResponse({
      hero: { headline: "H", subheadline: "S" },
      projects: [{ slug: "collab-canvas", blurb: "B" }],
      about: { emphasis: "E" },
    });

    await generateCopy("distributed systems work", selected, {
      ...about,
      headline: "Frontend engineer who likes hard state problems",
      bio: [
        {
          _type: "block",
          _key: "a1",
          children: [
            { _type: "span", _key: "as1", text: "Ten years shipping web apps." },
          ],
        },
      ],
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    const request = createMock.mock.calls[0][0];
    expect(request.model).toBe("claude-haiku-4-5");

    const userContent = request.messages[0].content as string;
    expect(userContent).toContain(
      "<visitor_intent>distributed systems work</visitor_intent>",
    );
    expect(userContent).toContain("Direct match on concurrent state.");
    expect(userContent).toContain("CRDT merge strategy.");
    expect(userContent).toContain(
      "Frontend engineer who likes hard state problems",
    );
    expect(userContent).toContain("Ten years shipping web apps.");
  });

  it("sends only the selected Projects, not the whole portfolio", async () => {
    const selected = [
      {
        project: makeProject({
          title: "Collab Canvas",
          slug: { _type: "slug", current: "collab-canvas" },
        }),
        match_reason: "Direct match.",
      },
    ];

    mockCopyResponse({
      hero: { headline: "H", subheadline: "S" },
      projects: [{ slug: "collab-canvas", blurb: "B" }],
      about: { emphasis: "E" },
    });

    await generateCopy("distributed systems work", selected, about);

    const userContent = createMock.mock.calls[0][0].messages[0]
      .content as string;
    expect(userContent).toContain("collab-canvas");
    expect(userContent).not.toContain("untitled");
  });

  it("rejects a hero whose headline exceeds the length bound", async () => {
    const selected = [
      {
        project: makeProject({
          slug: { _type: "slug", current: "collab-canvas" },
        }),
        match_reason: "Direct match.",
      },
    ];

    mockCopyResponse({
      hero: { headline: "x".repeat(200), subheadline: "S" },
      projects: [{ slug: "collab-canvas", blurb: "B" }],
      about: { emphasis: "E" },
    });

    const result = await generateCopy("distributed systems work", selected, about);

    expect(result.hero).toBeNull();
    expect(result.about).toEqual({ emphasis: "E" });
  });

  it("rejects an About emphasis that exceeds the length bound", async () => {
    const selected = [
      {
        project: makeProject({
          slug: { _type: "slug", current: "collab-canvas" },
        }),
        match_reason: "Direct match.",
      },
    ];

    mockCopyResponse({
      hero: { headline: "H", subheadline: "S" },
      projects: [{ slug: "collab-canvas", blurb: "B" }],
      about: { emphasis: "x".repeat(500) },
    });

    const result = await generateCopy("distributed systems work", selected, about);

    expect(result.about).toBeNull();
    expect(result.hero).toEqual({ headline: "H", subheadline: "S" });
  });

  it("discards blurbs for slugs outside the selected Project set and blurbs over the length bound", async () => {
    const selected = [
      {
        project: makeProject({
          slug: { _type: "slug", current: "collab-canvas" },
        }),
        match_reason: "Direct match.",
      },
      {
        project: makeProject({
          slug: { _type: "slug", current: "design-system" },
        }),
        match_reason: "Adjacent.",
      },
    ];

    mockCopyResponse({
      hero: { headline: "H", subheadline: "S" },
      projects: [
        { slug: "collab-canvas", blurb: "Kept." },
        { slug: "hallucinated-slug", blurb: "Made up." },
        { slug: "design-system", blurb: "x".repeat(500) },
      ],
      about: { emphasis: "E" },
    });

    const result = await generateCopy("distributed systems work", selected, about);

    expect(result.projects).toEqual([
      { slug: "collab-canvas", blurb: "Kept." },
    ]);
  });

  it("asks for all three copy surfaces in one structured-output call, with the length bounds stated", async () => {
    const selected = [
      {
        project: makeProject({
          slug: { _type: "slug", current: "collab-canvas" },
        }),
        match_reason: "Direct match.",
      },
    ];

    mockCopyResponse({
      hero: { headline: "H", subheadline: "S" },
      projects: [{ slug: "collab-canvas", blurb: "B" }],
      about: { emphasis: "E" },
    });

    await generateCopy("distributed systems work", selected, about);

    const request = createMock.mock.calls[0][0];
    const schema = request.output_config.format.schema;

    expect(request.output_config.format.type).toBe("json_schema");
    expect(Object.keys(schema.properties).sort()).toEqual([
      "about",
      "hero",
      "projects",
    ]);

    const system = request.system as string;
    expect(system).toContain(String(COPY_BOUNDS.headline));
    expect(system).toContain(String(COPY_BOUNDS.subheadline));
    expect(system).toContain(String(COPY_BOUNDS.blurb));
    expect(system).toContain(String(COPY_BOUNDS.emphasis));
  });

  it("returns empty copy instead of throwing when the model output isn't valid JSON", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const selected = [
      {
        project: makeProject({
          slug: { _type: "slug", current: "collab-canvas" },
        }),
        match_reason: "Direct match.",
      },
    ];
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "not json" }],
      stop_reason: "max_tokens",
    });

    const result = await generateCopy("distributed systems work", selected, about);

    expect(result).toEqual({ hero: null, projects: [], about: null });
    errorSpy.mockRestore();
  });

  it("returns empty copy instead of throwing when the model output is missing copy surfaces", async () => {
    const selected = [
      {
        project: makeProject({
          slug: { _type: "slug", current: "collab-canvas" },
        }),
        match_reason: "Direct match.",
      },
    ];
    mockCopyResponse({ hero: { headline: "H" } });

    const result = await generateCopy("distributed systems work", selected, about);

    expect(result).toEqual({ hero: null, projects: [], about: null });
  });
});
