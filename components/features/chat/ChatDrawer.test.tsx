import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnimatePresence } from "motion/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatDrawer } from "./ChatDrawer";
import { ChatDrawerToggle } from "./ChatDrawerToggle";
import { useDrawerVisibility } from "./useDrawerVisibility";

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      media: "(min-width: 640px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList),
  );
}

// Renders the real useDrawerVisibility hook alongside ChatDrawer and its
// launcher, so these tests exercise the same open/close wiring the app uses
// (launcher, close control, Escape, backdrop) rather than a hand-rolled
// stand-in. The launcher's own visibility/positioning behavior is covered
// separately in ChatShell.test.tsx, since that's where it actually lives.
function Wrapper() {
  const { isOpen, mode, close, toggle } = useDrawerVisibility();
  return (
    <>
      <ChatDrawerToggle isOpen={isOpen} mode={mode} isMounted={isOpen} onToggle={toggle} />
      <AnimatePresence>
        {isOpen && <ChatDrawer key="chat-drawer" mode={mode} onClose={close} />}
      </AnimatePresence>
    </>
  );
}

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
      controllerRef.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    },
    close() {
      controllerRef.close();
    },
  };
}

async function openAndSend(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getByRole("button", { name: "Open chat" }));
  const input = screen.getByPlaceholderText(/ask about matt/i);
  await user.type(input, text);
  await user.keyboard("{Enter}");
}

// The empty-state greeting shares its copy with the composer's sr-only
// <label>, so queries must target the visible paragraph specifically.
function queryGreeting() {
  return screen.queryByText("Hey, ask away.", { selector: "p" });
}

describe("ChatDrawer", () => {
  beforeEach(() => {
    stubMatchMedia(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it("renders only the launcher when closed", () => {
    render(<Wrapper />);

    expect(screen.getByRole("button", { name: "Open chat" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens to reveal the message panel, empty-state greeting, and suggested questions", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("button", { name: "Open chat" }));

    expect(screen.getByRole("dialog", { name: /chat with matt/i })).toBeInTheDocument();
    expect(queryGreeting()).toBeInTheDocument();
    expect(screen.getByText("What's your favourite project and why?")).toBeInTheDocument();
  });

  it("shows the typing indicator while a response is in flight", async () => {
    const user = userEvent.setup();
    const { response } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    render(<Wrapper />);
    await openAndSend(user, "what has he built?");

    expect(screen.getByRole("status", { name: /assistant is typing/i })).toBeInTheDocument();
  });

  it("does not render an empty assistant bubble alongside the typing indicator", async () => {
    const user = userEvent.setup();
    const { response } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    render(<Wrapper />);
    await openAndSend(user, "what has he built?");

    expect(screen.getByRole("status", { name: /assistant is typing/i })).toBeInTheDocument();
    expect(screen.queryByTestId("assistant-bubble")).not.toBeInTheDocument();
  });

  it("still renders the assistant bubble once a response completes with no text and no citations", async () => {
    const user = userEvent.setup();
    const { response, push, close } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    render(<Wrapper />);
    await openAndSend(user, "what has he built?");

    await act(async () => {
      push("citations", { citations: [] });
      close();
    });

    await waitFor(() =>
      expect(screen.queryByRole("status", { name: /assistant is typing/i })).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId("assistant-bubble")).toBeInTheDocument();
  });

  it("does not render an empty assistant bubble alongside the typing indicator while retrying", async () => {
    const user = userEvent.setup();
    const failedResponse = new Response(null, { status: 500 });
    const retryStream = makeStreamResponse();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(failedResponse)
      .mockResolvedValueOnce(retryStream.response);
    vi.stubGlobal("fetch", fetchMock);

    render(<Wrapper />);
    await openAndSend(user, "what has he built?");

    const retryButton = await screen.findByRole("button", { name: /retry/i });
    await user.click(retryButton);

    expect(screen.getByRole("status", { name: /assistant is typing/i })).toBeInTheDocument();
    expect(screen.queryByTestId("assistant-bubble")).not.toBeInTheDocument();
  });

  it("renders a grounded answer with citation pills, distinct from the typing state", async () => {
    const user = userEvent.setup();
    const { response, push, close } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    render(<Wrapper />);
    await openAndSend(user, "has he worked with distributed systems?");

    await act(async () => {
      push("delta", { text: "Yes, at Acme Corp." });
      push("citations", {
        citations: [{ label: "Experience — Acme Corp", href: "/experience/acme-corp" }],
      });
      close();
    });

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Experience — Acme Corp" })).toBeInTheDocument(),
    );
    expect(screen.getByText("Yes, at Acme Corp.")).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: /assistant is typing/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a visually distinct refusal state for out-of-scope questions", async () => {
    const user = userEvent.setup();
    const { response, push, close } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    render(<Wrapper />);
    await openAndSend(user, "what's the weather in SF?");

    await act(async () => {
      push("refusal", { message: "I can only answer questions about Matt's background." });
      close();
    });

    const refusal = await screen.findByText(
      "I can only answer questions about Matt's background.",
    );
    expect(refusal.closest('[role="status"]')).not.toBeNull();
    expect(
      screen.queryByRole("status", { name: /assistant is typing/i }),
    ).not.toBeInTheDocument();
  });

  it("shows restored conversation immediately when the drawer opens, with no entrance delay", async () => {
    window.sessionStorage.setItem(
      "chat:history",
      JSON.stringify([
        { id: "1-user", role: "user", text: "what has he built?" },
        { id: "1-assistant", role: "assistant", text: "Collab Canvas.", citations: [] },
      ]),
    );

    const user = userEvent.setup();
    render(<Wrapper />);

    expect(screen.queryByText("what has he built?")).not.toBeInTheDocument();
    expect(screen.queryByText("Collab Canvas.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open chat" }));

    expect(screen.getByText("what has he built?")).toBeInTheDocument();
    expect(screen.getByText("Collab Canvas.")).toBeInTheDocument();
    expect(queryGreeting()).not.toBeInTheDocument();
  });

  it("swaps the error bubble for the typing indicator on retry, then back to an answer bubble", async () => {
    const user = userEvent.setup();
    const failedResponse = new Response(null, { status: 500 });
    const retryStream = makeStreamResponse();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(failedResponse)
      .mockResolvedValueOnce(retryStream.response);
    vi.stubGlobal("fetch", fetchMock);

    render(<Wrapper />);
    await openAndSend(user, "what has he built?");

    const retryButton = await screen.findByRole("button", { name: /retry/i });
    expect(screen.getByRole("alert")).toHaveTextContent(/something went wrong/i);
    expect(screen.queryByRole("status", { name: /assistant is typing/i })).not.toBeInTheDocument();

    await user.click(retryButton);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: /assistant is typing/i })).toBeInTheDocument();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const secondCallBody = JSON.parse(String(fetchMock.mock.calls[1][1].body));
    expect(secondCallBody.message).toBe("what has he built?");

    await act(async () => {
      retryStream.push("delta", { text: "Collab Canvas." });
      retryStream.push("citations", { citations: [] });
      retryStream.close();
    });

    await waitFor(() => expect(screen.getByText("Collab Canvas.")).toBeInTheDocument());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("hides the empty-state greeting and suggested questions once the first message is sent", async () => {
    const user = userEvent.setup();
    const { response } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    render(<Wrapper />);
    await openAndSend(user, "what has he built?");

    // The landing pane cross-dissolves out rather than vanishing instantly,
    // so its removal is asserted asynchronously, same as the drawer's own
    // CSS slide-out above.
    await waitFor(() => expect(queryGreeting()).not.toBeInTheDocument());
    expect(
      screen.queryByRole("button", { name: "What's your favourite project and why?" }),
    ).not.toBeInTheDocument();
  });

  it("fades the message list out and the empty-state greeting back in on reset", async () => {
    const user = userEvent.setup();
    const { response, push, close } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    render(<Wrapper />);
    await openAndSend(user, "what has he built?");
    await waitFor(() => expect(queryGreeting()).not.toBeInTheDocument());
    expect(screen.getByText("what has he built?")).toBeInTheDocument();

    // Reset is disabled while a response is in flight, so let this one
    // finish first.
    await act(async () => {
      push("delta", { text: "Collab Canvas." });
      push("citations", { citations: [] });
      close();
    });
    await waitFor(() => expect(screen.getByText("Collab Canvas.")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Reset conversation" }));

    await waitFor(() => expect(screen.queryByText("what has he built?")).not.toBeInTheDocument());
    expect(screen.queryByText("Collab Canvas.")).not.toBeInTheDocument();
    expect(queryGreeting()).toBeInTheDocument();
    expect(screen.getByText("What's your favourite project and why?")).toBeInTheDocument();
  });

  it("closes via the explicit in-drawer close control", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("button", { name: "Open chat" }));
    await user.click(screen.getByRole("button", { name: "Close chat panel" }));

    // The panel now stays mounted through its CSS slide-out transition
    // before unmounting, so its removal is asserted asynchronously.
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("button", { name: "Open chat" }));
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes via the backdrop on mobile (overlay mode)", async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("button", { name: "Open chat" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const backdrop = screen.getByTestId("chat-drawer-backdrop");
    await user.click(backdrop);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("does not render a backdrop on desktop (push mode)", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("button", { name: "Open chat" }));

    expect(screen.queryByTestId("chat-drawer-backdrop")).not.toBeInTheDocument();
  });
});
