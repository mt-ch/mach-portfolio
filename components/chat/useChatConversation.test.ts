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

  it("starts with only the intro message and not thinking", () => {
    const { result } = renderHook(() => useChatConversation());

    expect(result.current.messages).toEqual([
      { id: "intro", role: "assistant-intro", text: expect.any(String) },
    ]);
    expect(result.current.isThinking).toBe(false);
  });

  it("on send, appends a user message and an empty assistant placeholder, and sets isThinking", () => {
    const { response } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("has he worked with distributed systems?"));

    expect(result.current.isThinking).toBe(true);
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[1]).toEqual({
      id: expect.any(String),
      role: "user",
      text: "has he worked with distributed systems?",
    });
    expect(result.current.messages[2]).toMatchObject({
      role: "assistant",
      text: "",
      citations: [],
    });
  });

  it("does not send an empty or whitespace-only message", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("   "));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(1);
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
      expect(result.current.messages[2]).toMatchObject({
        role: "assistant",
        text: "Yes, he has.",
      }),
    );
  });

  it("on citations event, sets citations on the assistant message and clears isThinking", async () => {
    const { response, push, close } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("what has he built?"));

    await act(async () => {
      push("delta", { text: "Collab Canvas used distributed systems." });
      push("citations", {
        citations: [{ label: "Collab Canvas", href: "/projects/collab-canvas" }],
      });
      close();
    });

    await waitFor(() => expect(result.current.isThinking).toBe(false));
    expect(result.current.messages[2]).toEqual({
      id: expect.any(String),
      role: "assistant",
      text: "Collab Canvas used distributed systems.",
      citations: [{ label: "Collab Canvas", href: "/projects/collab-canvas" }],
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
    expect(result.current.messages[2]).toEqual({
      id: expect.any(String),
      role: "assistant-refusal",
      text: "I can only answer questions about Matt's background.",
    });
  });

  it("reset clears the conversation back to just the intro and clears sessionStorage", async () => {
    const { response, push, close } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const { result } = renderHook(() => useChatConversation());
    act(() => result.current.send("what has he built?"));
    await act(async () => {
      push("citations", { citations: [] });
      close();
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(3));

    act(() => result.current.reset());

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe("assistant-intro");
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
      push("citations", { citations: [] });
      close();
    });
    await waitFor(() => expect(first.result.current.isThinking).toBe(false));

    const second = renderHook(() => useChatConversation());
    expect(second.result.current.messages).toHaveLength(3);
    expect(second.result.current.messages[1]).toMatchObject({
      role: "user",
      text: "what has he built?",
    });
    expect(second.result.current.messages[2]).toMatchObject({
      role: "assistant",
      text: "Collab Canvas.",
    });
  });

  it("does not persist an unanswered placeholder, so a reload never rehydrates a permanently blank bubble", async () => {
    const { response } = controllableResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const first = renderHook(() => useChatConversation());
    act(() => first.result.current.send("what has he built?"));

    expect(first.result.current.messages).toHaveLength(3);
    const stored = JSON.parse(window.sessionStorage.getItem("chat:history") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ role: "user", text: "what has he built?" });

    const second = renderHook(() => useChatConversation());
    expect(second.result.current.messages).toHaveLength(2);
    expect(second.result.current.messages[1]).toMatchObject({ role: "user" });
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
      firstStream.push("citations", { citations: [] });
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
