import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useReframe } from "./useReframe";

function makeStreamResponse() {
  let controllerRef!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
    },
  });
  const encoder = new TextEncoder();

  return {
    response: new Response(stream, {
      status: 200,
      headers: { "content-type": "text/event-stream" },
    }),
    push(event: string, data: unknown) {
      controllerRef.enqueue(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
      );
    },
    close() {
      controllerRef.close();
    },
  };
}

const selectionEvent = {
  selected: [{ slug: "collab-canvas", match_reason: "matches" }],
};
const copyEvent = {
  hero: { headline: "Built for it", subheadline: "sub" },
  projects: [{ slug: "collab-canvas", blurb: "tailored blurb" }],
  about: { emphasis: "emphasis text" },
};

describe("useReframe", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts in the input state with no intent, selection, or copy", () => {
    const { result } = renderHook(() => useReframe());

    expect(result.current.status).toBe("input");
    expect(result.current.intent).toBe("");
    expect(result.current.selection).toBeNull();
    expect(result.current.copy).toBeNull();
  });

  it("progresses selecting -> selected -> done as SSE events arrive", async () => {
    const { response, push, close } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useReframe());

    act(() => {
      result.current.submit("distributed systems work");
    });

    expect(result.current.status).toBe("selecting");
    expect(result.current.intent).toBe("distributed systems work");

    act(() => {
      push("selection", selectionEvent);
    });

    await waitFor(() => expect(result.current.status).toBe("selected"));
    expect(result.current.selection).toEqual(selectionEvent);

    act(() => {
      push("copy", copyEvent);
      close();
    });

    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(result.current.copy).toEqual(copyEvent);
  });

  it("falls back after 8s with no events, and stays there without retrying", async () => {
    vi.useFakeTimers();
    const { response } = makeStreamResponse(); // never pushed to, never closed
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useReframe());

    act(() => {
      result.current.submit("something slow");
    });

    expect(result.current.status).toBe("selecting");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });

    expect(result.current.status).toBe("fallback");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(result.current.status).toBe("fallback");

    vi.useRealTimers();
  });

  it("falls back when the server responds with a non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    const { result } = renderHook(() => useReframe());

    act(() => {
      result.current.submit("anything");
    });

    await waitFor(() => expect(result.current.status).toBe("fallback"));
  });

  it("resets to input from any status, discarding intent, selection, and copy", async () => {
    const { response, push } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useReframe());

    act(() => {
      result.current.submit("distributed systems work");
    });
    act(() => {
      push("selection", selectionEvent);
    });
    await waitFor(() => expect(result.current.status).toBe("selected"));

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("input");
    expect(result.current.intent).toBe("");
    expect(result.current.selection).toBeNull();
    expect(result.current.copy).toBeNull();
  });
});
