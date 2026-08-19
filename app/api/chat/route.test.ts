import { beforeEach, describe, expect, it, vi } from "vitest";

const { embedTextsMock, queryChunksMock, streamMock, createMock } = vi.hoisted(() => ({
  embedTextsMock: vi.fn(),
  queryChunksMock: vi.fn(),
  streamMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("@/lib/corpus/embed", () => ({ embedTexts: embedTextsMock }));
vi.mock("@/lib/corpus/vectorStore", () => ({ queryChunks: queryChunksMock }));

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
  text: "Title: Collab Canvas\n\nSummary: Real-time collaborative canvas under load.",
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
    expect(call.messages[0].content).toContain("Real-time collaborative canvas under load.");
  });

  it("still emits the citations event when generation fails mid-stream", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    streamMock.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield { type: "content_block_delta", delta: { type: "text_delta", text: "partial" } };
        throw new Error("generation upstream failed");
      },
    });

    const response = await POST(makeRequest({ message: "what has he built?" }));

    expect(response.status).toBe(200);
    const events = await readEvents(response);
    expect(events[0]).toEqual({ event: "delta", data: { text: "partial" } });
    expect(events[events.length - 1].event).toBe("citations");
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

  it("still answers with an empty citations list when retrieval finds nothing", async () => {
    queryChunksMock.mockResolvedValue([]);

    const response = await POST(makeRequest({ message: "what is the weather?" }));
    const events = await readEvents(response);

    expect(events[events.length - 1]).toEqual({
      event: "citations",
      data: { citations: [] },
    });
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
