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

async function collect(message: string, context: string) {
  const items: ({ type: "text"; text: string } | { type: "reference"; slug: string })[] = [];
  for await (const item of streamAnswer(message, context)) items.push(item);
  return items;
}

describe("streamAnswer", () => {
  beforeEach(() => {
    streamMock.mockReset();
  });

  it("yields text items from content_block_delta text_delta events, in order", async () => {
    streamMock.mockReturnValue(
      fakeStream([
        { type: "content_block_start", index: 0, content_block: { type: "text" } },
        { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Hello" } },
        { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: " world" } },
        { type: "content_block_stop", index: 0 },
      ]),
    );

    expect(await collect("hi", "some context")).toEqual([
      { type: "text", text: "Hello" },
      { type: "text", text: " world" },
    ]);
  });

  it("accumulates a reference_project tool call and yields one reference item when the block closes", async () => {
    streamMock.mockReturnValue(
      fakeStream([
        { type: "content_block_start", index: 0, content_block: { type: "text" } },
        { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "I built Collab Canvas." } },
        { type: "content_block_stop", index: 0 },
        {
          type: "content_block_start",
          index: 1,
          content_block: { type: "tool_use", name: "reference_project" },
        },
        { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: '{"slug":' } },
        { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: '"collab-canvas"}' } },
        { type: "content_block_stop", index: 1 },
      ]),
    );

    expect(await collect("what did you build?", "context")).toEqual([
      { type: "text", text: "I built Collab Canvas." },
      { type: "reference", slug: "collab-canvas" },
    ]);
  });

  it("never yields tool-input json as a text delta", async () => {
    streamMock.mockReturnValue(
      fakeStream([
        {
          type: "content_block_start",
          index: 0,
          content_block: { type: "tool_use", name: "reference_project" },
        },
        { type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: '{"slug":"x"}' } },
        { type: "content_block_stop", index: 0 },
      ]),
    );

    const items = await collect("hi", "context");
    expect(items).toEqual([{ type: "reference", slug: "x" }]);
  });

  it("yields no reference when the tool call json never parses", async () => {
    streamMock.mockReturnValue(
      fakeStream([
        {
          type: "content_block_start",
          index: 0,
          content_block: { type: "tool_use", name: "reference_project" },
        },
        { type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: '{"slug":' } },
        { type: "content_block_stop", index: 0 },
      ]),
    );

    expect(await collect("hi", "context")).toEqual([]);
  });

  it("exposes the reference_project tool with tool_choice auto and an unchanged max_tokens", async () => {
    streamMock.mockReturnValue(fakeStream([]));
    await collect("what has he built?", "Title: Collab Canvas");

    const call = streamMock.mock.calls[0][0];
    expect(call.model).toBe("claude-haiku-4-5");
    expect(call.max_tokens).toBe(1024);
    expect(call.tool_choice).toEqual({ type: "auto" });
    expect(call.tools).toEqual([
      expect.objectContaining({ name: "reference_project" }),
    ]);
    expect(call.messages[0].content).toContain("Title: Collab Canvas");
    expect(call.messages[0].content).toContain("what has he built?");
  });
});
