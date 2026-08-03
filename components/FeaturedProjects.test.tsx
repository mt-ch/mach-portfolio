import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProjectListItem } from "@/lib/sanity";

import { FeaturedProjects } from "./FeaturedProjects";

function makeProject(overrides: Partial<ProjectListItem>): ProjectListItem {
  return {
    _id: overrides.title ?? "project",
    title: "Untitled",
    slug: { _type: "slug", current: "untitled" },
    summary: "A project",
    coverImage: null,
    techStack: null,
    role: null,
    links: null,
    featured: false,
    order: 0,
    dateCompleted: null,
    ...overrides,
  };
}

describe("FeaturedProjects", () => {
  it("only renders projects flagged as featured", () => {
    const projects = [
      makeProject({ title: "Featured One", featured: true }),
      makeProject({ title: "Not Featured", featured: false }),
      makeProject({ title: "Featured Two", featured: true }),
    ];

    render(<FeaturedProjects projects={projects} />);

    expect(screen.getByText("Featured One")).toBeInTheDocument();
    expect(screen.getByText("Featured Two")).toBeInTheDocument();
    expect(screen.queryByText("Not Featured")).not.toBeInTheDocument();
  });

  it("renders nothing when no projects are featured", () => {
    const projects = [makeProject({ title: "Not Featured", featured: false })];

    const { container } = render(<FeaturedProjects projects={projects} />);

    expect(container).toBeEmptyDOMElement();
  });
});
