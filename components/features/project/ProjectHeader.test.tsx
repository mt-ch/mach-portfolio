import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProjectDetail } from "@/lib/sanity";

import { ProjectHeader } from "./ProjectHeader";

function project(overrides: Partial<ProjectDetail> = {}): ProjectDetail {
  return {
    _id: "project-1",
    title: "A Project",
    slug: { current: "a-project", _type: "slug" },
    summary: "A summary.",
    heroText: null,
    headerBackgroundColor: null,
    headerForegroundColor: null,
    story: null,
    coverImage: null,
    techStack: null,
    skills: null,
    impact: null,
    role: null,
    links: null,
    featured: null,
    order: 1,
    dateCompleted: null,
    ...overrides,
  } as ProjectDetail;
}

describe("ProjectHeader", () => {
  it("renders the project title as the top-level heading", () => {
    render(<ProjectHeader project={project({ title: "Home Hospital" })} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Home Hospital" }),
    ).toBeInTheDocument();
  });

  it("renders the hero text when set and omits it when absent", () => {
    const { rerender } = render(
      <ProjectHeader project={project({ heroText: "Treatment that transcends limits" })} />,
    );
    expect(
      screen.getByText("Treatment that transcends limits"),
    ).toBeInTheDocument();

    rerender(<ProjectHeader project={project({ heroText: null })} />);
    expect(
      screen.queryByText("Treatment that transcends limits"),
    ).not.toBeInTheDocument();
  });

  it("renders the role when set and omits it when absent", () => {
    const { rerender } = render(
      <ProjectHeader project={project({ role: "Lead Product Designer" })} />,
    );
    expect(screen.getByText("Lead Product Designer")).toBeInTheDocument();

    rerender(<ProjectHeader project={project({ role: null })} />);
    expect(screen.queryByText("Lead Product Designer")).not.toBeInTheDocument();
  });

  it("renders each project link with its label and an external target", () => {
    render(
      <ProjectHeader
        project={project({
          links: [
            { _key: "1", _type: "link", label: "Live site", url: "https://example.com" },
            { _key: "2", _type: "link", label: "Case study", url: "https://example.com/cs" },
          ],
        })}
      />,
    );

    const live = screen.getByRole("link", { name: "Live site" });
    expect(live).toHaveAttribute("href", "https://example.com");
    expect(live).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Case study" })).toHaveAttribute(
      "href",
      "https://example.com/cs",
    );
  });

  it("renders no link list when the project has no links", () => {
    render(<ProjectHeader project={project({ links: null })} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
