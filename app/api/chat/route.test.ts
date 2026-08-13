import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  checkRequestGuardrailsMock,
  fromEnvMock,
  queryMock,
  createMock,
  fetchMock,
} = vi.hoisted(() => ({
  checkRequestGuardrailsMock: vi.fn(),
  fromEnvMock: vi.fn(),
  queryMock: vi.fn(),
  createMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("@/lib/guardrails/rateLimit", () => ({
  checkRequestGuardrails: checkRequestGuardrailsMock,
}));

vi.mock("@upstash/vector", () => ({
  Index: { fromEnv: fromEnvMock },
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: createMock };
  },
}));

const { POST } = await import("./route");

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const matchFixtures = [
  {
    id: "project:collab-canvas:0",
    score: 0.91,
    data: "Collab Canvas is a real-time collaborative canvas built with CRDTs.",
    metadata: { label: "Collab Canvas", href: "/projects/collab-canvas" },
  },
  {
    id: "experience:acme:0",
    score: 0.84,
    data: "At Acme, Matt led the platform team for three years.",
    metadata: { label: "Acme (Platform Lead)", href: "/#experience-acme" },
  },
];

async function* deltaStream(chunks: string[]) {
  for (const text of chunks) {
    yield { type: "content_block_delta", delta: { type: "text_delta", text } };
  }
  yield { type: "message_stop" };
}

function parseSseEvents(text: string) {
  return text
    .trim()
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const [eventLine, dataLine] = block.split("\n");
      return {
        event: eventLine.replace("event: ", ""),
        data: JSON.parse(dataLine.replace("data: ", "")),
      };
    });
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    checkRequestGuardrailsMock.mockReset().mockResolvedValue({ ok: true });
    fromEnvMock.mockReset().mockReturnValue({ query: queryMock });
    queryMock.mockReset().mockResolvedValue(matchFixtures);
    createMock
      .mockReset()
      .mockImplementation(() => deltaStream(["Matt has ", "worked with distributed systems."]));

    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ data: [{ embedding: new Array(512).fill(0.1) }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects whitespace-only input with 400 and no SSE stream", async () => {
    const response = await POST(makeRequest({ message: "   " }));

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).not.toContain(
      "text/event-stream",
    );
  });

  it("rejects empty input with 400", async () => {
    const response = await POST(makeRequest({ message: "" }));

    expect(response.status).toBe(400);
  });

  it("rejects input over the 400-character cap with 400", async () => {
    const response = await POST(makeRequest({ message: "a".repeat(401) }));

    expect(response.status).toBe(400);
  });

  it("embeds the sanitized message and retrieves top-k=4 chunks before generating", async () => {
    await POST(makeRequest({ message: "  has he worked with distributed systems?  " }));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.voyageai.com/v1/embeddings",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("has he worked with distributed systems?"),
      }),
    );

    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({ topK: 4, includeMetadata: true, includeData: true }),
    );
  });

  it("streams delta events as text generates, followed by a final citations event", async () => {
    const response = await POST(
      makeRequest({ message: "has he worked with distributed systems?" }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "text/event-stream",
    );

    const text = await response.text();
    const events = parseSseEvents(text);

    const deltaEvents = events.filter((e) => e.event === "delta");
    expect(deltaEvents.map((e) => e.data.text)).toEqual([
      "Matt has ",
      "worked with distributed systems.",
    ]);

    const citationsEvent = events[events.length - 1];
    expect(citationsEvent.event).toBe("citations");
    expect(citationsEvent.data.citations).toEqual([
      { label: "Collab Canvas", href: "/projects/collab-canvas" },
      { label: "Acme (Platform Lead)", href: "/#experience-acme" },
    ]);
  });

  it("dedupes citations sharing the same href", async () => {
    queryMock.mockResolvedValue([
      matchFixtures[0],
      { ...matchFixtures[1], id: "project:collab-canvas:1", metadata: matchFixtures[0].metadata },
    ]);

    const response = await POST(
      makeRequest({ message: "has he worked with distributed systems?" }),
    );
    const events = parseSseEvents(await response.text());
    const citationsEvent = events[events.length - 1];

    expect(citationsEvent.data.citations).toEqual([
      { label: "Collab Canvas", href: "/projects/collab-canvas" },
    ]);
  });

  it("returns a 502 without streaming when retrieval fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    const response = await POST(
      makeRequest({ message: "has he worked with distributed systems?" }),
    );

    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).not.toContain(
      "text/event-stream",
    );
  });

  it("still closes the stream with a citations event when generation fails mid-stream", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    createMock.mockImplementation(() => {
      throw new Error("generation upstream failed");
    });

    const response = await POST(
      makeRequest({ message: "has he worked with distributed systems?" }),
    );

    expect(response.status).toBe(200);
    const text = await response.text();
    const events = parseSseEvents(text);

    expect(events.some((e) => e.event === "delta")).toBe(false);
    expect(events[events.length - 1].event).toBe("citations");
    errorSpy.mockRestore();
  });

  it("short-circuits to a non-2xx fallback response when guardrails trip, without embedding or generating", async () => {
    checkRequestGuardrailsMock.mockResolvedValue({ ok: false, reason: "burst_limit" });

    const response = await POST(
      makeRequest({ message: "has he worked with distributed systems?" }),
    );

    expect(response.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });
});
