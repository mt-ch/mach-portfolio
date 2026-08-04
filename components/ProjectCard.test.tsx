import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProjectListItem } from "@/lib/sanity";

import { ProjectCard } from "./ProjectCard";

const project: ProjectListItem = {
  _id: "1",
  title: "Portfolio Site",
  slug: { _type: "slug", current: "portfolio-site" },
  summary: "A recruiter-facing portfolio.",
  body: null,
  coverImage: null,
  techStack: ["Next.js", "Sanity"],
  skills: null,
  impact: null,
  role: "Full-stack engineer",
  links: null,
  featured: true,
  order: 1,
  dateCompleted: null,
};

describe("ProjectCard", () => {
  it("renders the title, summary, tech stack, and a link to the case study", () => {
    render(<ProjectCard project={project} />);

    expect(
      screen.getByRole("link", { name: "Portfolio Site" }),
    ).toHaveAttribute("href", "/projects/portfolio-site");
    expect(
      screen.getByText("A recruiter-facing portfolio."),
    ).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("Sanity")).toBeInTheDocument();
  });
});
