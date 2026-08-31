import { readFile } from "node:fs/promises";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { embedTextsMock, queryChunksMock, streamMock, createMock, checkRateLimitsMock } =
  vi.hoisted(() => ({
    embedTextsMock: vi.fn(),
    queryChunksMock: vi.fn(),
    streamMock: vi.fn(),
    createMock: vi.fn(),
    checkRateLimitsMock: vi.fn(),
  }));

vi.mock("@/lib/assistant/corpus/embed", () => ({ embedTexts: embedTextsMock }));
vi.mock("@/lib/assistant/corpus/vectorStore", () => ({ queryChunks: queryChunksMock }));
vi.mock("@/lib/assistant/guardrails/rateLimit", () => ({
  checkRateLimits: checkRateLimitsMock,
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { stream: streamMock, create: createMock };
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

function fakeStream(deltas: string[]) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const text of deltas) {
        yield { type: "content_block_delta", delta: { type: "text_delta", text } };
      }
    },
  };
}

const projectMatch = {
  id: "proj-1:0",
  score: 0.95,
  text: "Title: Collab Canvas\n\nSummary: Real-time collaborative canvas under load, built with distributed systems techniques.",
  metadata: {
    documentType: "project",
    documentId: "proj-1",
    title: "Collab Canvas",
    slug: "collab-canvas",
  },
};

async function readEvents(response: Response) {
  const text = await response.text();
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
    embedTextsMock.mockReset().mockResolvedValue([[0.1, 0.2]]);
    queryChunksMock.mockReset().mockResolvedValue([projectMatch]);
    streamMock.mockReset().mockReturnValue(fakeStream(["Yes, ", "he has."]));
    createMock.mockReset().mockResolvedValue({
      content: [{ type: "text", text: "condensed query" }],
    });
    checkRateLimitsMock.mockReset().mockResolvedValue({ ok: true });
  });

  it("rejects whitespace-only input with 400 and no SSE stream", async () => {
    const response = await POST(makeRequest({ message: "   " }));

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).not.toContain(
      "text/event-stream",
    );
    expect(embedTextsMock).not.toHaveBeenCalled();
  });

  it("rejects empty input with 400", async () => {
    const response = await POST(makeRequest({ message: "" }));

    expect(response.status).toBe(400);
  });

  it("rejects input over the 400-character cap with 400", async () => {
    const response = await POST(makeRequest({ message: "a".repeat(401) }));

    expect(response.status).toBe(400);
  });

  it("accepts input right at the 400-character cap", async () => {
    const response = await POST(makeRequest({ message: "a".repeat(400) }));

    expect(response.status).toBe(200);
  });

  it("rejects with 429 and does not touch retrieval/generation when a guardrail rate limit trips", async () => {
    checkRateLimitsMock.mockResolvedValue({ ok: false, reason: "burst_limit" });

    const response = await POST(makeRequest({ message: "what has he built?" }));
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload).toEqual({ message: "Too many requests", reason: "burst_limit" });
    expect(embedTextsMock).not.toHaveBeenCalled();
    expect(streamMock).not.toHaveBeenCalled();
  });

  it("passes the request's client IP and session ID into the guardrail check", async () => {
    await POST(
      makeRequest({ message: "what has he built?", sessionId: "session-abc" }),
    );

    expect(checkRateLimitsMock).toHaveBeenCalledWith("unknown", "session-abc");
  });

  it("falls back to the client IP as the session key when no session ID is sent, rather than a shared bucket", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" },
      body: JSON.stringify({ message: "what has he built?" }),
    });

    await POST(request);

    expect(checkRateLimitsMock).toHaveBeenCalledWith("203.0.113.9", "203.0.113.9");
  });

  it("streams delta events followed by a final citations event", async () => {
    const response = await POST(
      makeRequest({ message: "has he worked with distributed systems?" }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "text/event-stream",
    );

    const events = await readEvents(response);

    expect(events[0]).toEqual({ event: "delta", data: { text: "Yes, " } });
    expect(events[1]).toEqual({ event: "delta", data: { text: "he has." } });
    expect(events[2]).toEqual({
      event: "citations",
      data: {
        citations: [
          { label: "Collab Canvas", href: "/projects/collab-canvas" },
        ],
      },
    });
    expect(events).toHaveLength(3);
  });

  it("embeds and retrieves using the sanitized message, with a fixed top-k of 4", async () => {
    await POST(makeRequest({ message: "  has he worked with   distributed systems?  " }));

    expect(embedTextsMock).toHaveBeenCalledWith([
      "has he worked with distributed systems?",
    ]);
    expect(queryChunksMock).toHaveBeenCalledWith([0.1, 0.2], 4);
  });

  it("stuffs retrieved chunk text into the generation call", async () => {
    await POST(makeRequest({ message: "what has he built?" }));

    const call = streamMock.mock.calls[0][0];
    expect(call.messages[0].content).toContain("Collab Canvas");
    expect(call.messages[0].content).toContain(
      "Real-time collaborative canvas under load, built with distributed systems techniques.",
    );
  });

  it("returns the fixed refusal event instead of generating when retrieval confidence is too low", async () => {
    queryChunksMock.mockResolvedValue([{ ...projectMatch, score: 0.1 }]);

    const response = await POST(makeRequest({ message: "what has he built?" }));
    const events = await readEvents(response);

    expect(response.status).toBe(200);
    expect(streamMock).not.toHaveBeenCalled();
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("refusal");
    expect(typeof events[0].data.message).toBe("string");
    expect(events[0].data.message.length).toBeGreaterThan(0);
  });

  it("returns the fixed refusal event when retrieval finds nothing", async () => {
    queryChunksMock.mockResolvedValue([]);

    const response = await POST(makeRequest({ message: "what is the weather?" }));
    const events = await readEvents(response);

    expect(events).toEqual([
      { event: "refusal", data: { message: events[0].data.message } },
    ]);
  });

  it("does not run a post-generation grounding check — an answer that drifts off-context still streams through", async () => {
    streamMock.mockReturnValue(
      fakeStream(["The weather today is sunny and warm in Paris."]),
    );

    const response = await POST(makeRequest({ message: "what has he built?" }));
    const events = await readEvents(response);

    expect(response.status).toBe(200);
    expect(events[0]).toEqual({
      event: "delta",
      data: { text: "The weather today is sunny and warm in Paris." },
    });
    expect(events[events.length - 1].event).toBe("citations");
    expect(events.some((e) => e.event === "refusal")).toBe(false);
  });

  it("closes the stream with no error or citations when generation fails after at least one delta, keeping the partial text", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    streamMock.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "Yes, Collab Canvas used distributed systems." },
        };
        throw new Error("generation upstream failed");
      },
    });

    const response = await POST(makeRequest({ message: "what has he built?" }));

    expect(response.status).toBe(200);
    const events = await readEvents(response);
    expect(events).toEqual([
      {
        event: "delta",
        data: { text: "Yes, Collab Canvas used distributed systems." },
      },
    ]);
    errorSpy.mockRestore();
  });

  it("streams deltas live rather than buffering the whole answer first", async () => {
    let generatorAdvanced = 0;
    streamMock.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        generatorAdvanced += 1;
        yield { type: "content_block_delta", delta: { type: "text_delta", text: "one " } };
        generatorAdvanced += 1;
        yield { type: "content_block_delta", delta: { type: "text_delta", text: "two" } };
      },
    });

    const response = await POST(makeRequest({ message: "what has he built?" }));
    const events = await readEvents(response);

    expect(generatorAdvanced).toBe(2);
    expect(events.filter((e) => e.event === "delta")).toEqual([
      { event: "delta", data: { text: "one " } },
      { event: "delta", data: { text: "two" } },
    ]);
  });

  it("never imports the post-generation grounding check into the route", async () => {
    const source = await readFile("app/api/chat/route.ts", "utf8");
    expect(source).not.toContain("citationCheck");
    expect(source).not.toContain("isAnswerGrounded");
  });

  it("emits an error event when the generation call fails outright, instead of a blank success", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    streamMock.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        throw new Error("generation upstream unavailable");
      },
    });

    const response = await POST(makeRequest({ message: "what has he built?" }));

    expect(response.status).toBe(200);
    const events = await readEvents(response);
    expect(events).toEqual([
      { event: "error", data: { message: expect.any(String) } },
    ]);
    errorSpy.mockRestore();
  });

  it("returns a 502 without streaming when retrieval fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    embedTextsMock.mockRejectedValue(new Error("Voyage upstream unavailable"));

    const response = await POST(makeRequest({ message: "what has he built?" }));

    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).not.toContain(
      "text/event-stream",
    );
    expect(streamMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("skips condensation and embeds the raw message when history is absent", async () => {
    await POST(makeRequest({ message: "has he worked with distributed systems?" }));

    expect(createMock).not.toHaveBeenCalled();
    expect(embedTextsMock).toHaveBeenCalledWith([
      "has he worked with distributed systems?",
    ]);
  });

  it("condenses history into a self-contained query before embedding, but generates against the raw message", async () => {
    createMock.mockResolvedValue({
      content: [{ type: "text", text: "How long did he work at Acme Corp?" }],
    });

    await POST(
      makeRequest({
        message: "how long was he there?",
        history: [
          { role: "user", text: "has he worked with distributed systems?" },
          { role: "assistant", text: "Yes, at Acme Corp." },
        ],
      }),
    );

    expect(createMock).toHaveBeenCalled();
    expect(embedTextsMock).toHaveBeenCalledWith(["How long did he work at Acme Corp?"]);

    const generateCall = streamMock.mock.calls[0][0];
    expect(generateCall.messages[0].content).toContain("how long was he there?");
  });

  it("drops malformed history entries instead of erroring", async () => {
    const response = await POST(
      makeRequest({
        message: "what has he built?",
        history: [
          { role: "user", text: "fine" },
          { role: "bogus", text: "bad role" },
          { role: "assistant" },
          "not an object",
          null,
        ],
      }),
    );

    expect(response.status).toBe(200);
    expect(createMock).toHaveBeenCalled();
    const condenseCall = createMock.mock.calls[0][0];
    expect(condenseCall.messages[0].content).toContain("fine");
    expect(condenseCall.messages[0].content).not.toContain("bad role");
  });
});
