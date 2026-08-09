import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkRequestGuardrailsMock, cannedReframeMock, getProjectsMock, createMock } =
  vi.hoisted(() => ({
    checkRequestGuardrailsMock: vi.fn(),
    cannedReframeMock: vi.fn(),
    getProjectsMock: vi.fn(),
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

function mockAnthropicSelection(selected: Array<{ slug: string; match_reason: string }>) {
  createMock.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify({ selected }) }],
  });
}

describe("POST /api/reframe", () => {
  beforeEach(() => {
    checkRequestGuardrailsMock.mockReset().mockResolvedValue({ ok: true });
    cannedReframeMock.mockReset().mockImplementation(actualCannedReframe);
    getProjectsMock.mockReset().mockResolvedValue(projectFixtures);
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
