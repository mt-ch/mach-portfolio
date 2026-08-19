import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FeaturedProjectListItem } from "@/lib/sanity";

import { FeaturedProjectRow } from "./FeaturedProjectRow";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const project: FeaturedProjectListItem = {
  _id: "1",
  title: "Home Hospital",
  slug: { _type: "slug", current: "home-hospital" },
  summary: "Treatment that transcends limits",
  coverPrimary: null,
  coverSecondary: null,
  coverMobile: null,
  coverLayout: "left-dominant",
  order: 1,
};

describe("FeaturedProjectRow", () => {
  it("links the full row to the project case study", () => {
    render(<FeaturedProjectRow project={project} />);

    expect(
      screen.getByRole("link", {
        name: "Home Hospital: Treatment that transcends limits",
      }),
    ).toHaveAttribute("href", "/projects/home-hospital");
    expect(screen.getByText("Home Hospital:")).toBeInTheDocument();
    expect(
      screen.getByText("Treatment that transcends limits"),
    ).toBeInTheDocument();
  });

  it("renders for right-dominant cover layout without error", () => {
    render(
      <FeaturedProjectRow
        project={{ ...project, coverLayout: "right-dominant" }}
      />,
    );

    expect(
      screen.getByRole("link", {
        name: "Home Hospital: Treatment that transcends limits",
      }),
    ).toBeInTheDocument();
  });
});
