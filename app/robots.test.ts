import { describe, expect, it } from "vitest";

process.env.NEXT_PUBLIC_SITE_URL = "https://mattchan.dev";

const { default: robots } = await import("./robots");

describe("app/robots", () => {
  it("allows every crawler everywhere", () => {
    expect(robots().rules).toEqual({ userAgent: "*", allow: "/" });
  });

  it("points at the sitemap and declares the canonical host", () => {
    const result = robots();

    expect(result.sitemap).toBe("https://mattchan.dev/sitemap.xml");
    expect(result.host).toBe("https://mattchan.dev");
  });
});
