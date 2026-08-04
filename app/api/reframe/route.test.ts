import { describe, expect, it } from "vitest";

import { POST } from "./route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/reframe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/reframe", () => {
  it("rejects whitespace-only input with 400 and no SSE stream", async () => {
    const response = await POST(makeRequest({ intent: "   " }));

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).not.toContain(
      "text/event-stream",
    );
  });

  it("rejects empty input with 400", async () => {
    const response = await POST(makeRequest({ intent: "" }));

    expect(response.status).toBe(400);
  });

  it("rejects oversized input with 400", async () => {
    const response = await POST(makeRequest({ intent: "a".repeat(501) }));

    expect(response.status).toBe(400);
  });

  it("streams a selection event followed by a copy event for valid input", async () => {
    const response = await POST(
      makeRequest({ intent: "distributed systems work" }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "text/event-stream",
    );

    const text = await response.text();
    const [selectionBlock, copyBlock] = text
      .trim()
      .split("\n\n")
      .filter(Boolean);

    expect(selectionBlock).toMatch(/^event: selection\ndata: /);
    expect(copyBlock).toMatch(/^event: copy\ndata: /);

    const selection = JSON.parse(selectionBlock.replace("event: selection\ndata: ", ""));
    expect(Array.isArray(selection.selected)).toBe(true);
    expect(selection.selected.length).toBeGreaterThanOrEqual(3);
    expect(selection.selected.length).toBeLessThanOrEqual(6);
    for (const entry of selection.selected) {
      expect(typeof entry.slug).toBe("string");
      expect(typeof entry.match_reason).toBe("string");
    }

    const copy = JSON.parse(copyBlock.replace("event: copy\ndata: ", ""));
    expect(typeof copy.hero.headline).toBe("string");
    expect(typeof copy.hero.subheadline).toBe("string");
    expect(typeof copy.about.emphasis).toBe("string");
    expect(Array.isArray(copy.projects)).toBe(true);
    for (const project of copy.projects) {
      expect(typeof project.slug).toBe("string");
      expect(typeof project.blurb).toBe("string");
    }
  });
});
