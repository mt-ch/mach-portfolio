import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ProjectDetail } from "@/lib/sanity";

import { ContentBlocks } from "./ContentBlocks";

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

describe("ContentBlocks", () => {
  it("renders nothing when given an empty block array", () => {
    const { container } = render(<ContentBlocks blocks={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when given null blocks", () => {
    const { container } = render(<ContentBlocks blocks={null} />);
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

    render(<ContentBlocks blocks={[block]} />);

    expect(screen.getByRole("heading", { name: "A Heading" })).toBeInTheDocument();
    expect(screen.getByText("bold")).toHaveProperty("tagName", "STRONG");
    expect(screen.getByText("italic")).toHaveProperty("tagName", "EM");
    expect(screen.getByText(/Some/)).toBeInTheDocument();
  });

  it("renders a Text Block's optional block-level heading", () => {
    const block = textBlock({ heading: "Section Title" });

    render(<ContentBlocks blocks={[block]} />);

    expect(screen.getByRole("heading", { name: "Section Title" })).toBeInTheDocument();
  });

  it("omits the block-level heading when not set", () => {
    const block = textBlock();

    render(<ContentBlocks blocks={[block]} />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders both the heading and body of a two-column-split Text Block", () => {
    const block = textBlock({
      heading: "Split Heading",
      layout: "two-column-split",
    });

    render(<ContentBlocks blocks={[block]} />);

    expect(screen.getByRole("heading", { name: "Split Heading" })).toBeInTheDocument();
    expect(screen.getByText("Hello world.")).toBeInTheDocument();
  });

  it("renders a two-column-split Text Block's body even when no heading is set", () => {
    const block = textBlock({ layout: "two-column-split" });

    render(<ContentBlocks blocks={[block]} />);

    expect(screen.getByText("Hello world.")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("defaults to one-column layout and renders unchanged when no layout is set", () => {
    const block = textBlock({ heading: "Untouched" });

    render(<ContentBlocks blocks={[block]} />);

    expect(screen.getByRole("heading", { name: "Untouched" })).toBeInTheDocument();
    expect(screen.getByText("Hello world.")).toBeInTheDocument();
  });

  it("renders a full-layout Image Block with one image and its alt text", () => {
    const block = imageBlock({ layout: "full" });

    render(<ContentBlocks blocks={[block]} />);

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute("alt", "Primary alt");
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

    render(<ContentBlocks blocks={[block]} />);

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("alt", "Primary alt");
    expect(images[1]).toHaveAttribute("alt", "Secondary alt");
  });

  it("renders a caption when present and omits it when absent", () => {
    const withCaption = imageBlock({ caption: "A screenshot" });
    const { rerender } = render(<ContentBlocks blocks={[withCaption]} />);
    expect(screen.getByText("A screenshot")).toBeInTheDocument();

    rerender(<ContentBlocks blocks={[imageBlock({ caption: undefined })]} />);
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

    render(<ContentBlocks blocks={[first, second]} />);
    const firstEl = screen.getByText("First block");
    const secondEl = screen.getByText("Second block");
    expect(
      firstEl.compareDocumentPosition(secondEl) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders no extra visible content for a Text Block whose content is empty", () => {
    const empty = textBlock({ _key: "empty", content: [] });
    const image = imageBlock({ _key: "second" });

    const { container: withEmpty } = render(<ContentBlocks blocks={[empty, image]} />);
    const { container: withoutEmpty } = render(<ContentBlocks blocks={[image]} />);

    expect(withEmpty.textContent).toBe(withoutEmpty.textContent);
    expect(withEmpty.querySelectorAll("img")).toHaveLength(1);
  });

  it("renders no extra visible content for an Image Block with no assets", () => {
    const text = textBlock({ _key: "first" });
    const empty = imageBlock({ _key: "empty", image: { _type: "image", asset: undefined, alt: "" } });

    const { container: withEmpty } = render(<ContentBlocks blocks={[text, empty]} />);
    const { container: withoutEmpty } = render(<ContentBlocks blocks={[text]} />);

    expect(withEmpty.textContent).toBe(withoutEmpty.textContent);
    expect(withEmpty.querySelectorAll("img")).toHaveLength(0);
  });
});
