import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePathMock = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidatePathMock(path),
}));

const { POST } = await import("./route");

const SECRET = "test-secret";

function makeRequest(body: string, signature: string | null) {
  const headers = new Headers();
  if (signature !== null) {
    headers.set("sanity-webhook-signature", signature);
  }
  return new Request("http://localhost/api/revalidate", {
    method: "POST",
    headers,
    body,
  });
}

const { encodeSignatureHeader } = await import("@sanity/webhook");

async function sign(body: string) {
  return encodeSignatureHeader(body, Date.now(), SECRET);
}

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    process.env.SANITY_REVALIDATE_SECRET = SECRET;
    revalidatePathMock.mockClear();
  });

  afterEach(() => {
    delete process.env.SANITY_REVALIDATE_SECRET;
  });

  it("rejects a request with no signature header without revalidating", async () => {
    const body = JSON.stringify({ _type: "project", slug: { current: "a" } });

    const response = await POST(makeRequest(body, null));

    expect(response.status).toBe(401);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rejects a request with an invalid signature without revalidating", async () => {
    const body = JSON.stringify({ _type: "project", slug: { current: "a" } });

    const response = await POST(makeRequest(body, "t=1,v=not-a-real-signature"));

    expect(response.status).toBe(401);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("revalidates the overview, listing, and detail path for a validly-signed project payload", async () => {
    const body = JSON.stringify({ _type: "project", slug: { current: "a" } });
    const signature = await sign(body);

    const response = await POST(makeRequest(body, signature));

    expect(response.status).toBe(200);
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/projects");
    expect(revalidatePathMock).toHaveBeenCalledWith("/projects/a");
    expect(revalidatePathMock).toHaveBeenCalledWith("/sitemap.xml");
  });

  it("revalidates the overview and the sitemap for a validly-signed about payload", async () => {
    const body = JSON.stringify({ _type: "about" });
    const signature = await sign(body);

    const response = await POST(makeRequest(body, signature));

    expect(response.status).toBe(200);
    expect(revalidatePathMock).toHaveBeenCalledTimes(2);
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/sitemap.xml");
  });
});
