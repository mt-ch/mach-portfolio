import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { OtherProjectListItem } from "@/lib/sanity";

import { OtherProjects } from "./OtherProjects";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    sizes,
  }: {
    src: string;
    alt: string;
    sizes?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-sizes={sizes} />
  ),
}));

const projects: OtherProjectListItem[] = [
  {
    _id: "1",
    title: "Pertemps",
    slug: { current: "pertemps" },
    summary: "Recruitment reimagined",
    coverImage: {
      asset: { _ref: "image-abc-100x100-png", _type: "reference" },
      _type: "image",
      metadata: null,
    },
    order: 1,
  },
  {
    _id: "2",
    title: "Mother Goods",
    slug: { current: "mother-goods" },
    summary: "Baby products, grown up",
    coverImage: null,
    order: 2,
  },
  {
    _id: "3",
    title: "The Home Hospital",
    slug: { current: "the-home-hospital" },
    summary: "Treatment that transcends limits",
    coverImage: null,
    order: 3,
  },
];

describe("OtherProjects", () => {
  it("renders each project as a link with an accessible name combining title and summary", () => {
    render(<OtherProjects projects={projects} />);

    expect(
      screen.getByRole("link", { name: "Pertemps: Recruitment reimagined" }),
    ).toHaveAttribute("href", "/projects/pertemps");
    expect(
      screen.getByRole("link", {
        name: "Mother Goods: Baby products, grown up",
      }),
    ).toHaveAttribute("href", "/projects/mother-goods");
    expect(
      screen.getByRole("link", {
        name: "The Home Hospital: Treatment that transcends limits",
      }),
    ).toHaveAttribute("href", "/projects/the-home-hospital");
  });

  it("renders the correct card count for arrays of varying length", () => {
    const { rerender } = render(<OtherProjects projects={[]} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);

    rerender(<OtherProjects projects={projects.slice(0, 1)} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);

    rerender(<OtherProjects projects={projects.slice(0, 2)} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);

    rerender(<OtherProjects projects={projects} />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("still renders the section heading when there are no other projects", () => {
    render(<OtherProjects projects={[]} />);

    expect(
      screen.getByRole("heading", { name: "Other Projects" }),
    ).toBeInTheDocument();
  });

  it("requests an image sized for its real two-up-on-desktop width", () => {
    render(<OtherProjects projects={projects.slice(0, 1)} />);

    expect(screen.getByRole("presentation")).toHaveAttribute(
      "data-sizes",
      "(max-width: 768px) 100vw, 50vw",
    );
  });

  it("uses a pure 3:2 aspect-ratio frame with no fixed pixel height", () => {
    render(<OtherProjects projects={projects.slice(0, 1)} />);

    const frame = screen
      .getByRole("presentation")
      .parentElement?.parentElement as HTMLElement;
    expect(frame.className).toContain("aspect-3/2");
    expect(frame.className).not.toMatch(/\bh-\d/);
  });
});
