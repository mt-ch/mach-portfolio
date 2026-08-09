import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OUTER_TIMEOUT_MS, useReframe } from "./useReframe";

function sseChunk(event: string, data: unknown) {
  return new TextEncoder().encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  );
}

const selectionPayload = {
  selected: [{ slug: "collab-canvas", match_reason: "Direct match." }],
};

const copyPayload = {
  hero: { headline: "H", subheadline: "S" },
  projects: [{ slug: "collab-canvas", blurb: "B" }],
  about: { emphasis: "E" },
};

/** A response whose SSE events are pushed manually, so timing is controlled. */
function controllableResponse() {
  let controller: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });
  return {
    response: { ok: true, body } as unknown as Response,
    push: (event: string, data: unknown) =>
      controller!.enqueue(sseChunk(event, data)),
    close: () => controller!.close(),
  };
}

describe("useReframe", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("falls back when no event arrives within the timeout", async () => {
    const { response } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useReframe());
    act(() => result.current.submit("distributed systems work"));

    await act(async () => {
      vi.advanceTimersByTime(OUTER_TIMEOUT_MS + 100);
    });

    expect(result.current.status).toBe("fallback");
  });

  it("keeps waiting for copy when selection arrived within the timeout", async () => {
    const { response, push } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useReframe());
    act(() => result.current.submit("distributed systems work"));

    await act(async () => {
      vi.advanceTimersByTime(OUTER_TIMEOUT_MS - 2000);
      push("selection", selectionPayload);
    });
    await waitFor(() => expect(result.current.status).toBe("selected"));

    // Past the original deadline, but within one budget of the selection event.
    await act(async () => {
      vi.advanceTimersByTime(OUTER_TIMEOUT_MS - 2000);
    });

    expect(result.current.status).toBe("selected");
  });

  it("reaches done when copy arrives after the original deadline", async () => {
    const { response, push, close } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useReframe());
    act(() => result.current.submit("distributed systems work"));

    await act(async () => {
      vi.advanceTimersByTime(OUTER_TIMEOUT_MS - 2000);
      push("selection", selectionPayload);
    });
    await waitFor(() => expect(result.current.status).toBe("selected"));

    await act(async () => {
      vi.advanceTimersByTime(OUTER_TIMEOUT_MS - 2000);
      push("copy", copyPayload);
      close();
    });

    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(result.current.copy).toEqual(copyPayload);
  });

  it("settles on the tailored selection when the stream ends without copy", async () => {
    const { response, push, close } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useReframe());
    act(() => result.current.submit("distributed systems work"));

    await act(async () => {
      push("selection", selectionPayload);
      close();
    });

    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(result.current.selection).toEqual(selectionPayload);
    expect(result.current.copy).toBeNull();

    // The abandoned timer must not later flip a settled view to fallback.
    await act(async () => {
      vi.advanceTimersByTime(OUTER_TIMEOUT_MS * 3);
    });
    expect(result.current.status).toBe("done");
  });

  it("falls back when the stream ends without any event at all", async () => {
    const { response, close } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useReframe());
    act(() => result.current.submit("distributed systems work"));

    await act(async () => {
      close();
    });

    await waitFor(() => expect(result.current.status).toBe("fallback"));
  });
});
