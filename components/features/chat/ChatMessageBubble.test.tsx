import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProjectReference } from "@/lib/assistant/chat/types";

import { ChatMessageBubble } from "./ChatMessageBubble";
import type { ChatMessage } from "./types";

function assistantMessage(
  text: string,
  projectReference: ProjectReference | null = null,
): ChatMessage {
  return { id: "a1", role: "assistant", text, projectReference };
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

describe("ChatMessageBubble Project reference", () => {
  const reference: ProjectReference = {
    slug: "collab-canvas",
    title: "Collab Canvas",
    summary: "Real-time collaborative canvas under load.",
    imageUrl: "https://cdn.sanity.io/images/collab-canvas.jpg",
  };

  it("renders no card for a general answer with no project reference", () => {
    render(<ChatMessageBubble message={assistantMessage("I like working closely with designers.")} />);

    expect(screen.queryByTestId("project-reference")).toBeNull();
  });

  it("renders the stacked poster card below the answer body when a project reference is present", () => {
    render(
      <ChatMessageBubble message={assistantMessage("I built Collab Canvas.", reference)} />,
    );

    const card = screen.getByTestId("project-reference");
    expect(card).toHaveAttribute("href", "/projects/collab-canvas");
    expect(card.querySelector("img")).toHaveAttribute("src", reference.imageUrl);
    expect(screen.getByText("Collab Canvas")).toBeInTheDocument();
    expect(screen.getByText(reference.summary)).toBeInTheDocument();
    expect(screen.getByText(/View the project/)).toBeInTheDocument();
  });

  it("degrades to title + summary + link with no cover when imageUrl is null", () => {
    render(
      <ChatMessageBubble
        message={assistantMessage("I built Collab Canvas.", { ...reference, imageUrl: null })}
      />,
    );

    const card = screen.getByTestId("project-reference");
    expect(card.querySelector("img")).toBeNull();
    expect(screen.getByText("Collab Canvas")).toBeInTheDocument();
    expect(screen.getByText(/View the project/)).toBeInTheDocument();
  });
});
