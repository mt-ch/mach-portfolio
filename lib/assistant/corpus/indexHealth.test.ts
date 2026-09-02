import { beforeEach, describe, expect, it, vi } from "vitest";

const { getVectorCountMock } = vi.hoisted(() => ({
  getVectorCountMock: vi.fn(),
}));

vi.mock("./vectorStore", () => ({ getVectorCount: getVectorCountMock }));

// Every case except the "disabled" one asserts the real, enabled behaviour.
const config = vi.hoisted(() => ({ askEnabled: true }));
vi.mock("../config", () => ({
  get ASK_ENABLED() {
    return config.askEnabled;
  },
}));

const { checkIndexHealth } = await import("./indexHealth");

describe("checkIndexHealth", () => {
  beforeEach(() => {
    getVectorCountMock.mockReset();
    config.askEnabled = true;
  });

  it("resolves without throwing when the index is populated", async () => {
    getVectorCountMock.mockResolvedValue(10);

    await expect(checkIndexHealth()).resolves.toBeUndefined();
  });

  it("throws a descriptive error when the index is empty", async () => {
    getVectorCountMock.mockResolvedValue(0);

    await expect(checkIndexHealth()).rejects.toThrow(/empty/i);
  });

  it("skips the vector-store read entirely when the assistant is disabled", async () => {
    config.askEnabled = false;

    await expect(checkIndexHealth()).resolves.toBeUndefined();
    expect(getVectorCountMock).not.toHaveBeenCalled();
  });

  it("propagates a vector-store read failure as-is rather than reporting it as empty", async () => {
    const connectionError = new Error("ECONNREFUSED");
    getVectorCountMock.mockRejectedValue(connectionError);

    await expect(checkIndexHealth()).rejects.toBe(connectionError);
  });
});
