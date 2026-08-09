import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  checkRequestGuardrailsMock,
  cannedReframeMock,
  getProjectsMock,
  getProjectMock,
  getAboutMock,
  createMock,
} = vi.hoisted(() => ({
  checkRequestGuardrailsMock: vi.fn(),
  cannedReframeMock: vi.fn(),
  getProjectsMock: vi.fn(),
  getProjectMock: vi.fn(),
  getAboutMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("@/lib/guardrails/rateLimit", () => ({
  checkRequestGuardrails: checkRequestGuardrailsMock,
}));

vi.mock("@/lib/reframe/cannedReframe", () => ({
  cannedReframe: cannedReframeMock,
}));

vi.mock("@/lib/sanity", () => ({
  getProjects: getProjectsMock,
  getProject: getProjectMock,
  getAbout: getAboutMock,
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: createMock };
  },
}));

const { cannedReframe: actualCannedReframe } = await vi.importActual<
  typeof import("@/lib/reframe/cannedReframe")
>("@/lib/reframe/cannedReframe");

const { POST } = await import("./route");

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/reframe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const projectFixtures = [
  { _id: "1", title: "Collab Canvas", slug: { current: "collab-canvas" }, summary: "s", techStack: null, skills: null, impact: null, role: null, featured: true, order: 0, dateCompleted: null },
  { _id: "2", title: "Design System", slug: { current: "design-system" }, summary: "s", techStack: null, skills: null, impact: null, role: null, featured: true, order: 1, dateCompleted: null },
  { _id: "3", title: "Edge Marketing", slug: { current: "edge-marketing" }, summary: "s", techStack: null, skills: null, impact: null, role: null, featured: true, order: 2, dateCompleted: null },
];

const aboutFixture = {
  _id: "about",
  name: "Matt Chan",
  headline: "Frontend engineer",
  bio: null,
  resumeUrl: null,
  email: "matt@example.com",
  socialLinks: null,
};

const defaultCopy = {
  hero: {
    headline: "Real-time systems, built to survive real users",
    subheadline: "The work that speaks to it most directly.",
  },
  projects: [
    { slug: "collab-canvas", blurb: "Conflict-free sync under real load." },
    { slug: "design-system", blurb: "Systems thinking across six teams." },
    { slug: "edge-marketing", blurb: "Same rigor on a content-heavy surface." },
  ],
  about: { emphasis: "Deep experience in distributed state." },
};

// Selection and generation both go through `messages.create`; the two calls are
// told apart by which surface the response schema asks for.
function isSelectionCall(request: {
  output_config?: {
    format?: { schema?: { properties?: Record<string, unknown> } };
  };
}) {
  return Boolean(request.output_config?.format?.schema?.properties?.selected);
}

function mockAnthropic({
  selected,
  copy = defaultCopy,
}: {
  selected: Array<{ slug: string; match_reason: string }>;
  copy?: unknown;
}) {
  createMock.mockImplementation((request) => {
    const payload = isSelectionCall(request) ? { selected } : copy;
    return Promise.resolve({
      content: [{ type: "text", text: JSON.stringify(payload) }],
    });
  });
}

function mockAnthropicSelection(
  selected: Array<{ slug: string; match_reason: string }>,
) {
  mockAnthropic({ selected });
}

describe("POST /api/reframe", () => {
  beforeEach(() => {
    checkRequestGuardrailsMock.mockReset().mockResolvedValue({ ok: true });
    cannedReframeMock.mockReset().mockImplementation(actualCannedReframe);
    getProjectsMock.mockReset().mockResolvedValue(projectFixtures);
    getProjectMock
      .mockReset()
      .mockImplementation((slug: string) =>
        Promise.resolve({
          ...projectFixtures.find((p) => p.slug.current === slug),
          body: null,
        }),
      );
    getAboutMock.mockReset().mockResolvedValue(aboutFixture);
    createMock.mockReset();
    mockAnthropicSelection([
      { slug: "collab-canvas", match_reason: "Direct match." },
      { slug: "design-system", match_reason: "Adjacent." },
      { slug: "edge-marketing", match_reason: "Breadth." },
    ]);
  });

  it("rejects whitespace-only input with 400 and no SSE stream", async () => {
    const response = await POST(makeRequest({ intent: "   " }));

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).not.toContain(
      "text/event-stream",
    );
  });

  it("rejects empty input with 400", async () => {
    const response = await POST(makeRequest({ intent: "" }));

    expect(response.status).toBe(400);
  });

  it("rejects oversized input with 400", async () => {
    const response = await POST(makeRequest({ intent: "a".repeat(501) }));

    expect(response.status).toBe(400);
  });

  it("streams a selection event reflecting the real Anthropic call, followed by a copy event", async () => {
    const response = await POST(
      makeRequest({ intent: "distributed systems work" }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "text/event-stream",
    );

    const text = await response.text();
    const [selectionBlock, copyBlock] = text
      .trim()
      .split("\n\n")
      .filter(Boolean);

    expect(selectionBlock).toMatch(/^event: selection\ndata: /);
    expect(copyBlock).toMatch(/^event: copy\ndata: /);

    const selection = JSON.parse(selectionBlock.replace("event: selection\ndata: ", ""));
    expect(selection.selected).toEqual([
      { slug: "collab-canvas", match_reason: "Direct match." },
      { slug: "design-system", match_reason: "Adjacent." },
      { slug: "edge-marketing", match_reason: "Breadth." },
    ]);

    const copy = JSON.parse(copyBlock.replace("event: copy\ndata: ", ""));
    expect(typeof copy.hero.headline).toBe("string");
    expect(typeof copy.hero.subheadline).toBe("string");
    expect(typeof copy.about.emphasis).toBe("string");
    expect(Array.isArray(copy.projects)).toBe(true);
    for (const project of copy.projects) {
      expect(typeof project.slug).toBe("string");
      expect(typeof project.blurb).toBe("string");
    }
  });

  it("discards an unknown slug from the Anthropic response before it reaches the client", async () => {
    mockAnthropicSelection([
      { slug: "collab-canvas", match_reason: "Direct match." },
      { slug: "hallucinated-slug", match_reason: "Made up." },
      { slug: "design-system", match_reason: "Adjacent." },
      { slug: "edge-marketing", match_reason: "Breadth." },
    ]);

    const response = await POST(
      makeRequest({ intent: "distributed systems work" }),
    );
    const text = await response.text();
    const [selectionBlock] = text.trim().split("\n\n").filter(Boolean);
    const selection = JSON.parse(selectionBlock.replace("event: selection\ndata: ", ""));

    expect(selection.selected.map((entry: { slug: string }) => entry.slug)).toEqual([
      "collab-canvas",
      "design-system",
      "edge-marketing",
    ]);
  });

  it("streams a copy event carrying the generated hero, blurbs, and About emphasis rather than canned data", async () => {
    const response = await POST(
      makeRequest({ intent: "distributed systems work" }),
    );
    const text = await response.text();
    const [, copyBlock] = text.trim().split("\n\n").filter(Boolean);
    const copy = JSON.parse(copyBlock.replace("event: copy\ndata: ", ""));

    expect(copy.hero).toEqual(defaultCopy.hero);
    expect(copy.about).toEqual(defaultCopy.about);
    expect(copy.projects).toEqual(defaultCopy.projects);
    expect(cannedReframeMock).not.toHaveBeenCalled();
  });

  it("generates copy from the selected Projects' case-study depth and the About record", async () => {
    getProjectMock.mockImplementation((slug: string) =>
      Promise.resolve({
        ...projectFixtures.find((p) => p.slug.current === slug),
        body: [
          {
            _type: "block",
            _key: "b1",
            children: [
              { _type: "span", _key: "s1", text: `case study for ${slug}` },
            ],
          },
        ],
      }),
    );

    await POST(makeRequest({ intent: "distributed systems work" }));

    const generationRequest = createMock.mock.calls
      .map(([request]) => request)
      .find((request) => !isSelectionCall(request));

    expect(generationRequest).toBeDefined();
    const userContent = generationRequest.messages[0].content as string;
    expect(userContent).toContain("case study for collab-canvas");
    expect(userContent).toContain("Direct match.");
    expect(userContent).toContain("Frontend engineer");
  });

  it("rejects generated copy fields that violate the length bounds before they reach the client", async () => {
    mockAnthropic({
      selected: [
        { slug: "collab-canvas", match_reason: "Direct match." },
        { slug: "design-system", match_reason: "Adjacent." },
        { slug: "edge-marketing", match_reason: "Breadth." },
      ],
      copy: {
        hero: { headline: "x".repeat(500), subheadline: "S" },
        projects: [
          { slug: "collab-canvas", blurb: "Kept." },
          { slug: "design-system", blurb: "y".repeat(500) },
        ],
        about: { emphasis: "z".repeat(500) },
      },
    });

    const response = await POST(
      makeRequest({ intent: "distributed systems work" }),
    );
    const text = await response.text();
    const [, copyBlock] = text.trim().split("\n\n").filter(Boolean);
    const copy = JSON.parse(copyBlock.replace("event: copy\ndata: ", ""));

    expect(copy.hero).toBeNull();
    expect(copy.about).toBeNull();
    expect(copy.projects).toEqual([
      { slug: "collab-canvas", blurb: "Kept." },
    ]);
  });

  it("returns a non-2xx fallback without calling the generation model when the About record is missing", async () => {
    getAboutMock.mockResolvedValue(null);

    const response = await POST(
      makeRequest({ intent: "distributed systems work" }),
    );

    expect(response.ok).toBe(false);
    expect(
      createMock.mock.calls.some(([request]) => !isSelectionCall(request)),
    ).toBe(false);
  });

  it("streams the selection event before the generation call has finished", async () => {
    let releaseGeneration: () => void = () => {};
    const generationStarted = new Promise<void>((resolveStarted) => {
      createMock.mockImplementation((request) => {
        if (isSelectionCall(request)) {
          return Promise.resolve({
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  selected: [
                    { slug: "collab-canvas", match_reason: "Direct match." },
                  ],
                }),
              },
            ],
          });
        }
        resolveStarted();
        return new Promise((resolveGeneration) => {
          releaseGeneration = () =>
            resolveGeneration({
              content: [{ type: "text", text: JSON.stringify(defaultCopy) }],
            });
        });
      });
    });

    const response = await POST(
      makeRequest({ intent: "distributed systems work" }),
    );
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    await generationStarted;

    // The selection event must be readable while generation is still pending.
    const first = await reader.read();
    const firstBlock = decoder.decode(first.value);
    expect(firstBlock).toContain("event: selection");
    expect(firstBlock).not.toContain("event: copy");

    releaseGeneration();

    let rest = "";
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      rest += decoder.decode(chunk.value);
    }
    expect(rest).toContain("event: copy");
  });

  it("still closes the stream with a usable selection when generation fails mid-stream", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    createMock.mockImplementation((request) => {
      if (isSelectionCall(request)) {
        return Promise.resolve({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                selected: [
                  { slug: "collab-canvas", match_reason: "Direct match." },
                ],
              }),
            },
          ],
        });
      }
      return Promise.reject(new Error("generation upstream failed"));
    });

    const response = await POST(
      makeRequest({ intent: "distributed systems work" }),
    );

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("event: selection");
    expect(text).not.toContain("event: copy");
    errorSpy.mockRestore();
  });

  it("returns a 502 without crashing when the Anthropic call fails", async () => {
    createMock.mockRejectedValue(new Error("upstream unavailable"));

    const response = await POST(
      makeRequest({ intent: "distributed systems work" }),
    );

    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).not.toContain(
      "text/event-stream",
    );
  });

  it("short-circuits to a non-2xx fallback response when the burst limit trips, without calling the Anthropic client", async () => {
    checkRequestGuardrailsMock.mockResolvedValue({ ok: false, reason: "burst_limit" });

    const response = await POST(makeRequest({ intent: "distributed systems work" }));

    expect(response.ok).toBe(false);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("short-circuits to a non-2xx fallback response when the daily limit trips, without calling the Anthropic client", async () => {
    checkRequestGuardrailsMock.mockResolvedValue({ ok: false, reason: "daily_limit" });

    const response = await POST(makeRequest({ intent: "distributed systems work" }));

    expect(response.ok).toBe(false);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("short-circuits to a non-2xx fallback response when the global cost cap trips, without calling the Anthropic client", async () => {
    checkRequestGuardrailsMock.mockResolvedValue({ ok: false, reason: "cost_cap" });

    const response = await POST(makeRequest({ intent: "distributed systems work" }));

    expect(response.ok).toBe(false);
    expect(createMock).not.toHaveBeenCalled();
  });
});
