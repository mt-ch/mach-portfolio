import { beforeEach, describe, expect, it, vi } from "vitest";

const { streamMock } = vi.hoisted(() => ({ streamMock: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { stream: streamMock };
  },
}));

const { streamAnswer } = await import("./generateAnswer");

function fakeStream(events: unknown[]) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const event of events) yield event;
    },
  };
}

describe("streamAnswer", () => {
  beforeEach(() => {
    streamMock.mockReset();
  });

  it("yields text from content_block_delta text_delta events, in order", async () => {
    streamMock.mockReturnValue(
      fakeStream([
        { type: "content_block_start" },
        { type: "content_block_delta", delta: { type: "text_delta", text: "Hello" } },
        { type: "content_block_delta", delta: { type: "text_delta", text: " world" } },
        { type: "content_block_stop" },
      ]),
    );

    const deltas: string[] = [];
    for await (const delta of streamAnswer("hi", "some context")) {
      deltas.push(delta);
    }

    expect(deltas).toEqual(["Hello", " world"]);
  });

  it("ignores non-text-delta events", async () => {
    streamMock.mockReturnValue(
      fakeStream([
        { type: "content_block_delta", delta: { type: "input_json_delta", partial_json: "{}" } },
      ]),
    );

    const deltas: string[] = [];
    for await (const delta of streamAnswer("hi", "context")) {
      deltas.push(delta);
    }

    expect(deltas).toEqual([]);
  });

  it("calls Haiku 4.5 with the message and context stuffed into the user content", async () => {
    streamMock.mockReturnValue(fakeStream([]));

    for await (const _ of streamAnswer("what has he built?", "Title: Collab Canvas")) {
      // drain
    }

    expect(streamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-haiku-4-5",
        messages: [
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("Title: Collab Canvas"),
          }),
        ],
      }),
    );
    const call = streamMock.mock.calls[0][0];
    expect(call.messages[0].content).toContain("what has he built?");
  });
});
