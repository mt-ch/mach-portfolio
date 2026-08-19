import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatWidget } from "./ChatWidget";

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

async function sendMessage(user: ReturnType<typeof userEvent.setup>, text: string) {
  const input = screen.getByLabelText(/ask about matt's projects, experience, or background/i);
  await user.type(input, text);
  await user.keyboard("{Enter}");
}

describe("ChatWidget", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it("stays collapsed to just the command bar until the input is focused", () => {
    render(<ChatWidget />);

    expect(
      screen.getByPlaceholderText(/ask about matt's projects, experience, or background/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Ask about Matt")).not.toBeInTheDocument();
  });

  it("expands the panel and shows the typing indicator while a response is in flight", async () => {
    const user = userEvent.setup();
    const { response } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    render(<ChatWidget />);
    await sendMessage(user, "what has he built?");

    expect(screen.getByText("Ask about Matt")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: /assistant is typing/i })).toBeInTheDocument();
  });

  it("renders a grounded answer with citation pills, distinct from the typing state", async () => {
    const user = userEvent.setup();
    const { response, push, close } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    render(<ChatWidget />);
    await sendMessage(user, "has he worked with distributed systems?");

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

    render(<ChatWidget />);
    await sendMessage(user, "what's the weather in SF?");

    await act(async () => {
      push("refusal", {
        message: "I can only answer questions about Matt's background.",
      });
      close();
    });

    const refusal = await screen.findByText(
      "I can only answer questions about Matt's background.",
    );
    const refusalContainer = refusal.closest('[role="status"]');
    expect(refusalContainer).not.toBeNull();
    expect(refusalContainer).toHaveClass("border-amber-400/40");
    expect(
      screen.queryByRole("status", { name: /assistant is typing/i }),
    ).not.toBeInTheDocument();
  });

  it("collapses the panel via the explicit collapse control", async () => {
    const user = userEvent.setup();
    const { response } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    render(<ChatWidget />);
    await sendMessage(user, "what has he built?");
    expect(screen.getByText("Ask about Matt")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /collapse conversation/i }));

    expect(screen.queryByText("Ask about Matt")).not.toBeInTheDocument();
  });
});
