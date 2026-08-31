import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useChatConversation } from "./useChatConversation";

function sseChunk(event: string, data: unknown) {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

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
    push: (event: string, data: unknown) => controller!.enqueue(sseChunk(event, data)),
    close: () => controller!.close(),
  };
}

describe("useChatConversation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it("starts with no messages, not thinking, and hasStarted false", () => {
    const { result } = renderHook(() => useChatConversation());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isThinking).toBe(false);
    expect(result.current.hasStarted).toBe(false);
  });

  it("hasStarted becomes true optimistically as soon as the user message is appended", () => {
    const { response } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useChatConversation());
    expect(result.current.hasStarted).toBe(false);

    act(() => result.current.send("has he worked with distributed systems?"));

    expect(result.current.hasStarted).toBe(true);
  });

  it("hasStarted remains true across a remount when sessionStorage holds a prior user message", async () => {
    const { response, push, close } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const first = renderHook(() => useChatConversation());
    act(() => first.result.current.send("what has he built?"));
    await act(async () => {
      push("citations", { project: null });
      close();
    });
    await waitFor(() => expect(first.result.current.isThinking).toBe(false));

    const second = renderHook(() => useChatConversation());
    expect(second.result.current.hasStarted).toBe(true);
  });

  it("hasStarted returns to false after reset", async () => {
    const { response, push, close } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("what has he built?"));
    await act(async () => {
      push("citations", { project: null });
      close();
    });
    await waitFor(() => expect(result.current.isThinking).toBe(false));
    expect(result.current.hasStarted).toBe(true);

    act(() => result.current.reset());

    expect(result.current.hasStarted).toBe(false);
  });

  it("on send, appends a user message and an empty assistant placeholder, and sets isThinking", () => {
    const { response } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("has he worked with distributed systems?"));

    expect(result.current.isThinking).toBe(true);
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toEqual({
      id: expect.any(String),
      role: "user",
      text: "has he worked with distributed systems?",
    });
    expect(result.current.messages[1]).toMatchObject({
      role: "assistant",
      text: "",
      projectReference: null,
    });
  });

  it("does not send an empty or whitespace-only message", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("   "));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
  });

  it("accumulates delta events into the assistant message's text", async () => {
    const { response, push } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("what has he built?"));

    await act(async () => {
      push("delta", { text: "Yes, " });
      push("delta", { text: "he has." });
    });

    await waitFor(() =>
      expect(result.current.messages[1]).toMatchObject({
        role: "assistant",
        text: "Yes, he has.",
      }),
    );
  });

  it("on citations event, sets the project reference on the assistant message and clears isThinking", async () => {
    const { response, push, close } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const reference = {
      slug: "collab-canvas",
      title: "Collab Canvas",
      summary: "Real-time collaborative canvas under load.",
      imageUrl: null,
    };

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("tell me about Collab Canvas"));

    await act(async () => {
      push("delta", { text: "Collab Canvas used distributed systems." });
      push("citations", { project: reference });
      close();
    });

    await waitFor(() => expect(result.current.isThinking).toBe(false));
    expect(result.current.messages[1]).toEqual({
      id: expect.any(String),
      role: "assistant",
      text: "Collab Canvas used distributed systems.",
      projectReference: reference,
    });
  });

  it("on a citations event with no project, leaves the assistant message with a null project reference", async () => {
    const { response, push, close } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("how do you like to work?"));

    await act(async () => {
      push("delta", { text: "Closely and early." });
      push("citations", { project: null });
      close();
    });

    await waitFor(() => expect(result.current.isThinking).toBe(false));
    expect(result.current.messages[1]).toMatchObject({
      role: "assistant",
      text: "Closely and early.",
      projectReference: null,
    });
  });

  it("on refusal event, replaces the placeholder with an assistant-refusal message and clears isThinking", async () => {
    const { response, push, close } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("what's the weather today?"));

    await act(async () => {
      push("refusal", { message: "I can only answer questions about Matt's background." });
      close();
    });

    await waitFor(() => expect(result.current.isThinking).toBe(false));
    expect(result.current.messages[1]).toEqual({
      id: expect.any(String),
      role: "assistant-refusal",
      text: "I can only answer questions about Matt's background.",
    });
  });

  it("on a non-ok response, replaces the placeholder with a server-error message carrying retry info", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("what has he built?"));

    await waitFor(() => expect(result.current.isThinking).toBe(false));
    expect(result.current.messages[1]).toMatchObject({
      role: "assistant-error",
      cause: "server",
      retryText: "what has he built?",
      attempts: 1,
    });
  });

  it("on a 429 response, uses the rate-limit cause", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 429 })));

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("what has he built?"));

    await waitFor(() => expect(result.current.isThinking).toBe(false));
    expect(result.current.messages[1]).toMatchObject({ role: "assistant-error", cause: "rate-limit" });
  });

  it("on a network-level fetch failure, uses the network cause", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("what has he built?"));

    await waitFor(() => expect(result.current.isThinking).toBe(false));
    expect(result.current.messages[1]).toMatchObject({ role: "assistant-error", cause: "network" });
  });

  it("on an in-stream error event, replaces the placeholder with a server-error message", async () => {
    const { response, push, close } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("what has he built?"));

    await act(async () => {
      push("error", { message: "Unable to generate a response" });
      close();
    });

    await waitFor(() => expect(result.current.isThinking).toBe(false));
    expect(result.current.messages[1]).toMatchObject({ role: "assistant-error", cause: "server" });
  });

  it("does not show an error when reset aborts an in-flight request", async () => {
    const { response } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("what has he built?"));
    await waitFor(() => expect(result.current.isThinking).toBe(true));

    act(() => result.current.reset());

    await waitFor(() => expect(result.current.messages).toHaveLength(0));
  });

  it("retry re-sends the failed message and, on success, replaces the error bubble with the answer", async () => {
    const failed = new Response(null, { status: 500 });
    const retryStream = controllableResponse();
    const fetchMock = vi.fn().mockResolvedValueOnce(failed).mockResolvedValueOnce(retryStream.response);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("what has he built?"));
    await waitFor(() =>
      expect(result.current.messages[1]).toMatchObject({ role: "assistant-error", attempts: 1 }),
    );

    const errorId = result.current.messages[1].id;
    act(() => result.current.retry(errorId));

    expect(result.current.isThinking).toBe(true);
    const [, secondInit] = fetchMock.mock.calls[1];
    expect(JSON.parse(secondInit.body as string).message).toBe("what has he built?");

    await act(async () => {
      retryStream.push("delta", { text: "Collab Canvas." });
      retryStream.push("citations", { project: null });
      retryStream.close();
    });

    await waitFor(() => expect(result.current.isThinking).toBe(false));
    expect(result.current.messages[1]).toEqual({
      id: errorId,
      role: "assistant",
      text: "Collab Canvas.",
      projectReference: null,
    });
  });

  it("escalates the error message after repeated retry failures on the same message", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("what has he built?"));
    await waitFor(() =>
      expect(result.current.messages[1]).toMatchObject({ attempts: 1 }),
    );

    const errorId = result.current.messages[1].id;
    act(() => result.current.retry(errorId));
    await waitFor(() => expect(result.current.messages[1]).toMatchObject({ attempts: 2 }));

    act(() => result.current.retry(errorId));
    await waitFor(() => expect(result.current.messages[1]).toMatchObject({ attempts: 3 }));

    expect((result.current.messages[1] as { text: string }).text).toMatch(/still having trouble/i);
  });

  it("reset clears the conversation back to empty and clears sessionStorage", async () => {
    const { response, push, close } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("what has he built?"));
    await act(async () => {
      push("citations", { project: null });
      close();
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(2));

    act(() => result.current.reset());

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isThinking).toBe(false);
    expect(window.sessionStorage.getItem("chat:history")).toBeNull();
  });

  it("persists conversation turns to sessionStorage and rehydrates them on the next mount", async () => {
    const { response, push, close } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const first = renderHook(() => useChatConversation());
    act(() => first.result.current.send("what has he built?"));
    await act(async () => {
      push("delta", { text: "Collab Canvas." });
      push("citations", { project: null });
      close();
    });
    await waitFor(() => expect(first.result.current.isThinking).toBe(false));

    const second = renderHook(() => useChatConversation());
    expect(second.result.current.messages).toHaveLength(2);
    expect(second.result.current.messages[0]).toMatchObject({
      role: "user",
      text: "what has he built?",
    });
    expect(second.result.current.messages[1]).toMatchObject({
      role: "assistant",
      text: "Collab Canvas.",
    });
  });

  it("does not persist an unanswered placeholder, so a reload never rehydrates a permanently blank bubble", async () => {
    const { response } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const first = renderHook(() => useChatConversation());
    act(() => first.result.current.send("what has he built?"));

    expect(first.result.current.messages).toHaveLength(2);
    const stored = JSON.parse(window.sessionStorage.getItem("chat:history") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ role: "user", text: "what has he built?" });

    const second = renderHook(() => useChatConversation());
    expect(second.result.current.messages).toHaveLength(1);
    expect(second.result.current.messages[0]).toMatchObject({ role: "user" });
  });

  it("sends prior turns as history but not the current message", async () => {
    const firstStream = controllableResponse();
    const secondStream = controllableResponse();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(firstStream.response)
      .mockResolvedValueOnce(secondStream.response);
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("has he worked with distributed systems?"));

    const [, firstInit] = fetchMock.mock.calls[0];
    const firstBody = JSON.parse(firstInit.body as string);
    expect(firstBody.history).toEqual([]);
    expect(firstBody.message).toBe("has he worked with distributed systems?");

    await act(async () => {
      firstStream.push("citations", { project: null });
      firstStream.close();
    });
    await waitFor(() => expect(result.current.isThinking).toBe(false));

    act(() => result.current.send("which project best shows that?"));

    const [, secondInit] = fetchMock.mock.calls[1];
    const secondBody = JSON.parse(secondInit.body as string);
    expect(secondBody.history).toEqual([
      { role: "user", text: "has he worked with distributed systems?" },
    ]);
  });
});
