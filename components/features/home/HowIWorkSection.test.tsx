import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { About } from "@/lib/sanity";

import { HowIWorkSection } from "./HowIWorkSection";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

type HowIWorkBlocks = NonNullable<About["howIWork"]>;

function about(howIWork: About["howIWork"]): About {
  return {
    _id: "about",
    name: "Matt Chan",
    headline: "Engineer",
    bio: null,
    whatIDo: null,
    logo: null,
    footerText: null,
    resumeUrl: null,
    email: "matt@example.com",
    socialLinks: null,
    howIWork,
  };
}

const textBlock: HowIWorkBlocks[number] = {
  _type: "textBlock",
  _key: "text-1",
  content: [
    {
      _type: "block",
      _key: "block-1",
      style: "normal",
      children: [{ _type: "span", _key: "span-1", text: "I slot into teams quickly." }],
    },
  ],
} as HowIWorkBlocks[number];

describe("HowIWorkSection", () => {
  it("renders the blocks through the shared renderer under the hardcoded title", () => {
    render(<HowIWorkSection about={about([textBlock])} />);

    expect(screen.getByText("[How I work]")).toBeInTheDocument();
    expect(screen.getByText("I slot into teams quickly.")).toBeInTheDocument();
  });

  it("renders nothing when howIWork is an empty array", () => {
    const { container } = render(<HowIWorkSection about={about([])} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("[How I work]")).not.toBeInTheDocument();
  });

  it("renders nothing when howIWork is absent", () => {
    const { container } = render(<HowIWorkSection about={about(null)} />);

    expect(container).toBeEmptyDOMElement();
  });
});
