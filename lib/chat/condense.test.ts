import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: createMock };
  },
}));

const { condenseQuery } = await import("./condense");

function textResponse(text: string) {
  return { content: [{ type: "text", text }] };
}

describe("condenseQuery", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("returns the raw message unchanged on the first turn, without calling the model", async () => {
    const result = await condenseQuery("has he worked with distributed systems?", []);

    expect(result).toBe("has he worked with distributed systems?");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rewrites a follow-up using history into a self-contained query", async () => {
    createMock.mockResolvedValue(
      textResponse("How long did he work at the distributed systems company?"),
    );

    const result = await condenseQuery("how long was he there?", [
      { role: "user", text: "has he worked with distributed systems?" },
      { role: "assistant", text: "Yes, at Acme Corp." },
    ]);

    expect(result).toBe("How long did he work at the distributed systems company?");
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-haiku-4-5",
        messages: [
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("how long was he there?"),
          }),
        ],
      }),
    );
    const call = createMock.mock.calls[0][0];
    expect(call.messages[0].content).toContain("Acme Corp");
  });

  it("only sends the last 3 turn-pairs of history to the condensation call", async () => {
    createMock.mockResolvedValue(textResponse("rewritten"));

    const history = [
      { role: "user" as const, text: "turn 1 user" },
      { role: "assistant" as const, text: "turn 1 assistant" },
      { role: "user" as const, text: "turn 2 user" },
      { role: "assistant" as const, text: "turn 2 assistant" },
      { role: "user" as const, text: "turn 3 user" },
      { role: "assistant" as const, text: "turn 3 assistant" },
      { role: "user" as const, text: "turn 4 user" },
      { role: "assistant" as const, text: "turn 4 assistant" },
    ];

    await condenseQuery("latest message", history);

    const call = createMock.mock.calls[0][0];
    expect(call.messages[0].content).not.toContain("turn 1 user");
    expect(call.messages[0].content).toContain("turn 2 user");
    expect(call.messages[0].content).toContain("turn 3 user");
    expect(call.messages[0].content).toContain("turn 4 user");
  });

  it("falls back to the raw message when the model returns no text content", async () => {
    createMock.mockResolvedValue({ content: [] });

    const result = await condenseQuery("how long was he there?", [
      { role: "user", text: "has he worked with distributed systems?" },
      { role: "assistant", text: "Yes, at Acme Corp." },
    ]);

    expect(result).toBe("how long was he there?");
  });
});
