import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatMessageBubble } from "./ChatMessageBubble";
import type { ChatMessage } from "./types";

function assistantMessage(text: string): ChatMessage {
  return { id: "a1", role: "assistant", text, citations: [] };
}

function renderAssistant(text: string) {
  return render(<ChatMessageBubble message={assistantMessage(text)} />);
}

describe("ChatMessageBubble assistant Markdown", () => {
  it("renders whitelisted elements: paragraphs, bold, italic, lists", () => {
    const { container } = renderAssistant(
      "First paragraph.\n\nSecond with **bold** and *italic*.\n\n- one\n- two",
    );

    expect(container.querySelectorAll("p")).toHaveLength(2);
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("em")?.textContent).toBe("italic");
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
  });

  it("does not render headings as markup", () => {
    const { container } = renderAssistant("# Heading text");

    expect(container.querySelector("h1")).toBeNull();
    expect(screen.getByText("Heading text")).toBeInTheDocument();
  });

  it("renders Markdown links as plain text, not anchors", () => {
    const { container } = renderAssistant("See [my site](https://example.com) here.");

    expect(container.querySelector("a")).toBeNull();
    expect(screen.getByText(/my site/)).toBeInTheDocument();
  });

  it("does not render code spans or blocks as markup", () => {
    const { container } = renderAssistant("Inline `code` and\n\n```\nblock\n```");

    expect(container.querySelector("code")).toBeNull();
    expect(container.querySelector("pre")).toBeNull();
  });

  it("does not render raw HTML", () => {
    const { container } = renderAssistant('<button>click</button> and <b>b</b>');

    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(screen.getByText(/click/)).toBeInTheDocument();
  });

  it("renders incomplete Markdown literally until the syntax is closed", () => {
    const { container, rerender } = renderAssistant("a **bold");
    expect(container.querySelector("strong")).toBeNull();
    expect(screen.getByText(/\*\*bold/)).toBeInTheDocument();

    rerender(<ChatMessageBubble message={assistantMessage("a **bold**")} />);
    expect(container.querySelector("strong")?.textContent).toBe("bold");
  });
});
