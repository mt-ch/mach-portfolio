import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ProjectDetail } from "@/lib/sanity";

import { ProjectStory } from "./ProjectStory";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

type StoryBlocks = NonNullable<ProjectDetail["story"]>;

function textBlock(overrides: Partial<StoryBlocks[number]> = {}): StoryBlocks[number] {
  return {
    _type: "textBlock",
    _key: "text-1",
    content: [
      {
        _type: "block",
        _key: "block-1",
        style: "normal",
        children: [{ _type: "span", _key: "span-1", text: "Hello world." }],
      },
    ],
    ...overrides,
  } as StoryBlocks[number];
}

function imageBlock(overrides: Partial<StoryBlocks[number]> = {}): StoryBlocks[number] {
  return {
    _type: "imageBlock",
    _key: "image-1",
    layout: "full",
    caption: null,
    image: {
      _type: "image",
      asset: {
        _ref: "image-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-2000x3000-jpg",
        _type: "reference",
      },
      alt: "Primary alt",
    },
    secondImage: null,
    ...overrides,
  } as StoryBlocks[number];
}

describe("ProjectStory", () => {
  it("renders nothing when given an empty block array", () => {
    const { container } = render(<ProjectStory blocks={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when given null blocks", () => {
    const { container } = render(<ProjectStory blocks={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a Text Block's headings, marks, and paragraph text", () => {
    const block = textBlock({
      content: [
        {
          _type: "block",
          _key: "h",
          style: "h2",
          children: [{ _type: "span", _key: "h-span", text: "A Heading" }],
        },
        {
          _type: "block",
          _key: "p",
          style: "normal",
          children: [
            { _type: "span", _key: "s1", text: "Some " },
            { _type: "span", _key: "s2", marks: ["strong"], text: "bold" },
            { _type: "span", _key: "s3", text: " and " },
            { _type: "span", _key: "s4", marks: ["em"], text: "italic" },
            { _type: "span", _key: "s5", text: " text." },
          ],
        },
      ],
    });

    render(<ProjectStory blocks={[block]} />);

    expect(screen.getByRole("heading", { name: "A Heading" })).toBeInTheDocument();
    expect(screen.getByText("bold")).toHaveProperty("tagName", "STRONG");
    expect(screen.getByText("italic")).toHaveProperty("tagName", "EM");
    expect(screen.getByText(/Some/)).toBeInTheDocument();
  });

  it("renders a Text Block's optional block-level heading", () => {
    const block = textBlock({ heading: "Section Title" });

    render(<ProjectStory blocks={[block]} />);

    expect(screen.getByRole("heading", { name: "Section Title" })).toBeInTheDocument();
  });

  it("omits the block-level heading when not set", () => {
    const block = textBlock();

    render(<ProjectStory blocks={[block]} />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders a two-column-split Text Block with heading before body in document order", () => {
    const block = textBlock({
      heading: "Split Heading",
      layout: "two-column-split",
    });

    render(<ProjectStory blocks={[block]} />);

    const heading = screen.getByRole("heading", { name: "Split Heading" });
    const body = screen.getByText("Hello world.");
    expect(heading.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders a two-column-split Text Block's body even when no heading is set", () => {
    const block = textBlock({ layout: "two-column-split" });

    render(<ProjectStory blocks={[block]} />);

    expect(screen.getByText("Hello world.")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders a two-column-left Text Block with heading and body together, sharing a parent", () => {
    const block = textBlock({
      heading: "Left Heading",
      layout: "two-column-left",
    });

    render(<ProjectStory blocks={[block]} />);

    const heading = screen.getByRole("heading", { name: "Left Heading" });
    const body = screen.getByText("Hello world.");
    const headingWrapper = heading.parentElement;
    expect(headingWrapper?.contains(body)).toBe(true);
    expect(headingWrapper?.parentElement?.children).toHaveLength(1);
  });

  it("renders a two-column-right Text Block with heading and body together, sharing a parent", () => {
    const block = textBlock({
      heading: "Right Heading",
      layout: "two-column-right",
    });

    render(<ProjectStory blocks={[block]} />);

    const heading = screen.getByRole("heading", { name: "Right Heading" });
    const body = screen.getByText("Hello world.");
    const headingWrapper = heading.parentElement;
    expect(headingWrapper?.contains(body)).toBe(true);
    expect(headingWrapper?.parentElement?.children).toHaveLength(1);
  });

  it("renders a two-column-right Text Block's body even when no heading is set", () => {
    const block = textBlock({ layout: "two-column-right" });

    render(<ProjectStory blocks={[block]} />);

    expect(screen.getByText("Hello world.")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("defaults to one-column layout and renders unchanged when no layout is set", () => {
    const block = textBlock({ heading: "Untouched" });

    render(<ProjectStory blocks={[block]} />);

    expect(screen.getByRole("heading", { name: "Untouched" })).toBeInTheDocument();
    expect(screen.getByText("Hello world.")).toBeInTheDocument();
  });

  it("renders a full-layout Image Block with one image and its alt text", () => {
    const block = imageBlock({ layout: "full" });

    render(<ProjectStory blocks={[block]} />);

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute("alt", "Primary alt");
  });

  it("renders an inset-layout Image Block with one image", () => {
    const block = imageBlock({ layout: "inset" });

    render(<ProjectStory blocks={[block]} />);

    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("renders a pair-layout Image Block with two images, each with its own alt text", () => {
    const block = imageBlock({
      layout: "pair",
      secondImage: {
        _type: "image",
        asset: {
          _ref: "image-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb-2000x3000-jpg",
          _type: "reference",
        },
        alt: "Secondary alt",
      },
    });

    render(<ProjectStory blocks={[block]} />);

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("alt", "Primary alt");
    expect(images[1]).toHaveAttribute("alt", "Secondary alt");
  });

  it("renders a caption when present and omits it when absent", () => {
    const withCaption = imageBlock({ caption: "A screenshot" });
    const { rerender } = render(<ProjectStory blocks={[withCaption]} />);
    expect(screen.getByText("A screenshot")).toBeInTheDocument();

    rerender(<ProjectStory blocks={[imageBlock({ caption: undefined })]} />);
    expect(screen.queryByText("A screenshot")).not.toBeInTheDocument();
  });

  it("renders multiple blocks in the given order", () => {
    const first = textBlock({
      _key: "first",
      content: [
        {
          _type: "block",
          _key: "b1",
          style: "normal",
          children: [{ _type: "span", _key: "s", text: "First block" }],
        },
      ],
    });
    const second = textBlock({
      _key: "second",
      content: [
        {
          _type: "block",
          _key: "b2",
          style: "normal",
          children: [{ _type: "span", _key: "s", text: "Second block" }],
        },
      ],
    });

    render(<ProjectStory blocks={[first, second]} />);
    const firstEl = screen.getByText("First block");
    const secondEl = screen.getByText("Second block");
    expect(
      firstEl.compareDocumentPosition(secondEl) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("gives the gap after a Text Block extra (xl) spacing, even next to an Image Block", () => {
    const { container } = render(
      <ProjectStory blocks={[textBlock({ _key: "a" }), imageBlock({ _key: "b" })]} />,
    );

    const wrappers = container.firstElementChild?.children;
    expect(wrappers?.[1]).toHaveClass("mt-xl");
  });

  it("gives the gap before a Text Block extra (xl) spacing, even after an Image Block", () => {
    const { container } = render(
      <ProjectStory blocks={[imageBlock({ _key: "a" }), textBlock({ _key: "b" })]} />,
    );

    const wrappers = container.firstElementChild?.children;
    expect(wrappers?.[1]).toHaveClass("mt-xl");
  });

  it("gives the gap between two Text Blocks extra (xl) spacing", () => {
    const { container } = render(
      <ProjectStory blocks={[textBlock({ _key: "a" }), textBlock({ _key: "b" })]} />,
    );

    const wrappers = container.firstElementChild?.children;
    expect(wrappers?.[1]).toHaveClass("mt-xl");
  });

  it("keeps the tight (gap-sm) spacing between two adjacent Image Blocks", () => {
    const { container } = render(
      <ProjectStory blocks={[imageBlock({ _key: "a" }), imageBlock({ _key: "b" })]} />,
    );

    const wrappers = container.firstElementChild?.children;
    expect(wrappers?.[1]).toHaveClass("mt-sm");
    expect(wrappers?.[1]).not.toHaveClass("mt-xl");
  });

  it("does not put a top margin on the first block", () => {
    const { container } = render(
      <ProjectStory blocks={[textBlock({ _key: "a" }), imageBlock({ _key: "b" })]} />,
    );

    const wrappers = container.firstElementChild?.children;
    expect(wrappers?.[0]).not.toHaveClass("mt-xl");
    expect(wrappers?.[0]).not.toHaveClass("mt-sm");
  });

  it("skips a phantom gap-only wrapper for a block that renders nothing (empty Text Block content)", () => {
    const empty = textBlock({ _key: "empty", content: [] });
    const second = imageBlock({ _key: "second" });

    const { container } = render(<ProjectStory blocks={[empty, second]} />);

    const wrappers = container.firstElementChild?.children;
    expect(wrappers).toHaveLength(1);
    expect(wrappers?.[0]).not.toHaveClass("mt-xl");
    expect(wrappers?.[0]).not.toHaveClass("mt-sm");
  });

  it("skips a phantom gap-only wrapper for a block that renders nothing (Image Block with no assets)", () => {
    const first = textBlock({ _key: "first" });
    const empty = imageBlock({ _key: "empty", image: { _type: "image", asset: undefined, alt: "" } });

    const { container } = render(<ProjectStory blocks={[first, empty]} />);

    const wrappers = container.firstElementChild?.children;
    expect(wrappers).toHaveLength(1);
  });
});
