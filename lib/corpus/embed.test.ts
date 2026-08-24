import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { embedMock, FakeVoyageAIError } = vi.hoisted(() => {
  class FakeVoyageAIError extends Error {
    statusCode?: number;
    rawResponse?: { headers?: { get?: (name: string) => string | null } };
    constructor(statusCode?: number) {
      super(`voyage error ${statusCode}`);
      this.statusCode = statusCode;
    }
  }
  return { embedMock: vi.fn(), FakeVoyageAIError };
});

vi.mock("voyageai", () => ({
  VoyageAIClient: class {
    embed = embedMock;
  },
  VoyageAIError: FakeVoyageAIError,
}));

const { embedTexts } = await import("./embed");

function rateLimitError(): InstanceType<typeof FakeVoyageAIError> {
  return new FakeVoyageAIError(429);
}

describe("embedTexts", () => {
  beforeEach(() => {
    embedMock.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an empty array without calling the client for no input", async () => {
    const result = await embedTexts([]);

    expect(result).toEqual([]);
    expect(embedMock).not.toHaveBeenCalled();
  });

  it("calls Voyage with model voyage-4-lite at 512 output dimensions", async () => {
    embedMock.mockResolvedValueOnce({
      data: [{ index: 0, embedding: [0.1, 0.2] }],
    });

    await embedTexts(["hello"]);

    expect(embedMock).toHaveBeenCalledWith({
      input: ["hello"],
      model: "voyage-4-lite",
      inputType: "document",
      outputDimension: 512,
    });
  });

  it("returns embeddings reordered by response index, not response array order", async () => {
    embedMock.mockResolvedValueOnce({
      data: [
        { index: 1, embedding: [2, 2] },
        { index: 0, embedding: [1, 1] },
      ],
    });

    const result = await embedTexts(["a", "b"]);

    expect(result).toEqual([[1, 1], [2, 2]]);
  });

  it("does not retry a 429 by default (interactive callers must fail fast)", async () => {
    embedMock.mockRejectedValueOnce(rateLimitError());

    await expect(embedTexts(["hello"])).rejects.toThrow();
    expect(embedMock).toHaveBeenCalledTimes(1);
  });

  it("retries after a 429 and resolves once the client succeeds, when retry is opted in", async () => {
    embedMock
      .mockRejectedValueOnce(rateLimitError())
      .mockResolvedValueOnce({ data: [{ index: 0, embedding: [0.5] }] });

    const promise = embedTexts(["hello"], { retry: true });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toEqual([[0.5]]);
    expect(embedMock).toHaveBeenCalledTimes(2);
  });

  it("rejects once repeated 429s exhaust the retry budget, when retry is opted in", async () => {
    embedMock.mockRejectedValue(rateLimitError());

    const promise = embedTexts(["hello"], { retry: true });
    // Attach a rejection handler immediately so the unresolved promise isn't
    // reported as unhandled while fake timers advance it toward failure.
    const assertion = expect(promise).rejects.toThrow();
    await vi.runAllTimersAsync();
    await assertion;

    expect(embedMock.mock.calls.length).toBeGreaterThan(1);
  });

  it("rejects immediately on a non-429 error without retrying, when retry is opted in", async () => {
    const error = new Error("boom");
    embedMock.mockRejectedValueOnce(error);

    await expect(embedTexts(["hello"], { retry: true })).rejects.toThrow("boom");
    expect(embedMock).toHaveBeenCalledTimes(1);
  });
});
