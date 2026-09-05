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

const textBlock = {
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
} as StoryBlocks[number];

describe("ProjectStory", () => {
  it("renders nothing when there are no renderable blocks", () => {
    const { container } = render(<ProjectStory blocks={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("wraps the story in a centred, bounded reading column", () => {
    const { container } = render(<ProjectStory blocks={[textBlock]} />);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass("mx-auto", "w-full", "max-w-story");
    expect(screen.getByText("Hello world.")).toBeInTheDocument();
  });
});
