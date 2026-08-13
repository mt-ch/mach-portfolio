import { beforeEach, describe, expect, it, vi } from "vitest";

const { embedMock } = vi.hoisted(() => ({ embedMock: vi.fn() }));

vi.mock("voyageai", () => ({
  VoyageAIClient: class {
    embed = embedMock;
  },
}));

const { embedTexts } = await import("./embed");

describe("embedTexts", () => {
  beforeEach(() => {
    embedMock.mockReset();
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
});
