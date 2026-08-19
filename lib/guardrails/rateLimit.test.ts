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

describe("checkRateLimits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisFromEnvMock.mockReturnValue({ incr: incrMock, expire: expireMock });
    limitMock.mockResolvedValue({ success: true });
    incrMock.mockResolvedValue(1);
  });

  it("allows a request when under the burst, daily, session, and cost-cap limits", async () => {
    const { checkRateLimits } = await import("./rateLimit");

    const result = await checkRateLimits("203.0.113.5", "session-1");

    expect(result).toEqual({ ok: true });
  });

  it("trips the burst limit when the per-IP burst limiter denies", async () => {
    limitMock.mockResolvedValueOnce({ success: false });
    const { checkRateLimits } = await import("./rateLimit");

    const result = await checkRateLimits("203.0.113.5", "session-1");

    expect(result).toEqual({ ok: false, reason: "burst_limit" });
  });

  it("trips the daily limit when the per-IP daily limiter denies but burst passes", async () => {
    limitMock
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false });
    const { checkRateLimits } = await import("./rateLimit");

    const result = await checkRateLimits("203.0.113.5", "session-1");

    expect(result).toEqual({ ok: false, reason: "daily_limit" });
  });

  it("trips the session turn cap when the session limiter denies but IP limits pass", async () => {
    limitMock
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false });
    const { checkRateLimits } = await import("./rateLimit");

    const result = await checkRateLimits("203.0.113.5", "session-1");

    expect(result).toEqual({ ok: false, reason: "session_turn_cap" });
  });

  it("trips the cost cap when the global daily counter exceeds the cap, independent of per-IP/session limits", async () => {
    incrMock.mockResolvedValue(501);
    const { checkRateLimits } = await import("./rateLimit");

    const result = await checkRateLimits("203.0.113.5", "session-1");

    expect(result).toEqual({ ok: false, reason: "cost_cap" });
  });

  it("keys the session limiter on the session ID, not the IP", async () => {
    const { checkRateLimits } = await import("./rateLimit");

    await checkRateLimits("203.0.113.5", "session-abc");

    expect(limitMock).toHaveBeenNthCalledWith(3, "session-abc");
  });
});
