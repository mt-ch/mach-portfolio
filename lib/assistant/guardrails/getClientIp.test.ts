import { describe, expect, it } from "vitest";
import { getClientIp } from "./getClientIp";

function makeRequest(headers: Record<string, string>) {
  return new Request("https://example.com/api/reframe", { headers });
}

describe("getClientIp", () => {
  it("returns the first IP from x-forwarded-for", () => {
    const request = makeRequest({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" });

    expect(getClientIp(request)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const request = makeRequest({ "x-real-ip": "198.51.100.7" });

    expect(getClientIp(request)).toBe("198.51.100.7");
  });

  it("returns 'unknown' when neither header is present", () => {
    const request = makeRequest({});

    expect(getClientIp(request)).toBe("unknown");
  });
});
