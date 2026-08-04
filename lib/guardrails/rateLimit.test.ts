import { beforeEach, describe, expect, it, vi } from "vitest";

const { limitMock, incrMock, expireMock, slidingWindowMock, redisFromEnvMock } = vi.hoisted(
  () => ({
    limitMock: vi.fn(),
    incrMock: vi.fn(),
    expireMock: vi.fn(),
    slidingWindowMock: vi.fn((tokens: number, window: string) => ({ tokens, window })),
    redisFromEnvMock: vi.fn(),
  }),
);

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: redisFromEnvMock },
}));

vi.mock("@upstash/ratelimit", () => {
  class RatelimitMock {
    limit = limitMock;
  }
  return {
    Ratelimit: Object.assign(RatelimitMock, { slidingWindow: slidingWindowMock }),
  };
});

describe("checkRequestGuardrails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisFromEnvMock.mockReturnValue({ incr: incrMock, expire: expireMock });
    limitMock.mockResolvedValue({ success: true });
    incrMock.mockResolvedValue(1);
  });

  it("allows a request when under the burst, daily, and cost-cap limits", async () => {
    const { checkRequestGuardrails } = await import("./rateLimit");

    const result = await checkRequestGuardrails("203.0.113.5");

    expect(result).toEqual({ ok: true });
  });

  it("trips the burst limit when the per-IP burst limiter denies", async () => {
    limitMock.mockResolvedValueOnce({ success: false });
    const { checkRequestGuardrails } = await import("./rateLimit");

    const result = await checkRequestGuardrails("203.0.113.5");

    expect(result).toEqual({ ok: false, reason: "burst_limit" });
  });

  it("trips the daily limit when the per-IP daily limiter denies but burst passes", async () => {
    limitMock.mockResolvedValueOnce({ success: true }).mockResolvedValueOnce({ success: false });
    const { checkRequestGuardrails } = await import("./rateLimit");

    const result = await checkRequestGuardrails("203.0.113.5");

    expect(result).toEqual({ ok: false, reason: "daily_limit" });
  });

  it("trips the cost cap when the global daily counter exceeds the cap, independent of per-IP limits", async () => {
    incrMock.mockResolvedValue(301);
    const { checkRequestGuardrails } = await import("./rateLimit");

    const result = await checkRequestGuardrails("203.0.113.5");

    expect(result).toEqual({ ok: false, reason: "cost_cap" });
  });
});
