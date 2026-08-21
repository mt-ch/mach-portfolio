import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatDrawer } from "./ChatDrawer";
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

// Renders the real useDrawerVisibility hook alongside ChatDrawer, so these
// tests exercise the same open/close wiring the app uses (launcher, close
// control, Escape, backdrop) rather than a hand-rolled stand-in.
function Wrapper() {
  const { isOpen, mode, close, toggle } = useDrawerVisibility();
  return <ChatDrawer isOpen={isOpen} mode={mode} onClose={close} onToggle={toggle} />;
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
  const input = screen.getByLabelText(/ask about matt's projects, experience, or background/i);
  await user.type(input, text);
  await user.keyboard("{Enter}");
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

  it("opens to reveal the message panel, input, and suggested questions", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("button", { name: "Open chat" }));

    expect(screen.getByRole("dialog", { name: /chat with matt/i })).toBeInTheDocument();
    expect(
      screen.getByLabelText(/ask about matt's projects, experience, or background/i),
    ).toBeInTheDocument();
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
    const refusalContainer = refusal.closest('[role="status"]');
    expect(refusalContainer).not.toBeNull();
    expect(refusalContainer).toHaveClass("border-amber-400/40");
  });

  it("keeps suggested questions visible and clickable after messages exist", async () => {
    const user = userEvent.setup();
    const first = makeStreamResponse();
    const second = makeStreamResponse();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(first.response)
      .mockResolvedValueOnce(second.response);
    vi.stubGlobal("fetch", fetchMock);

    render(<Wrapper />);
    await openAndSend(user, "what has he built?");

    await act(async () => {
      first.push("citations", { citations: [] });
      first.close();
    });

    const suggestion = await screen.findByRole("button", {
      name: "What was your most recent role, and what did you work on there?",
    });
    await user.click(suggestion);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const secondCallBody = JSON.parse(String(fetchMock.mock.calls[1][1].body));
    expect(secondCallBody.message).toBe(
      "What was your most recent role, and what did you work on there?",
    );
  });

  it("hides the launcher pill while the drawer is open, to avoid overlapping the composer", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.click(screen.getByRole("button", { name: "Open chat" }));

    expect(screen.queryByRole("button", { name: "Open chat" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close chat" })).not.toBeInTheDocument();
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
