import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { About } from "@/lib/sanity";

import { HeroSection } from "./HeroSection";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const about: About = {
  _id: "about",
  name: "Matt Chan",
  headline: " is a product designer based in San Diego.",
  bio: [
    {
      _type: "block",
      _key: "bio1",
      style: "normal",
      children: [{ _type: "span", _key: "s1", text: "Specialising in UX/UI design." }],
    },
  ],
  logo: null,
  footerText: null,
  resumeUrl: null,
  email: "matt@example.com",
  socialLinks: null,
  howIWork: null,
};

describe("HeroSection", () => {
  it("renders the headline from About", () => {
    render(<HeroSection about={about} />);

    expect(
      screen.getByText(/is a product designer based in San Diego\./),
    ).toBeInTheDocument();
  });

  it("does not render the bio even when present", () => {
    render(<HeroSection about={about} />);

    expect(screen.queryByText("Specialising in UX/UI design.")).not.toBeInTheDocument();
  });
});
