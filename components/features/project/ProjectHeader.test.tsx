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
  it("applies the custom background and foreground colours when both are set", () => {
    const { container } = render(
      <ProjectHeader
        project={project({
          headerBackgroundColor: { _type: "color", hex: "#123456" },
          headerForegroundColor: { _type: "color", hex: "#abcdef" },
        })}
      />,
    );

    const header = container.querySelector("header");
    expect(header).toHaveStyle({ backgroundColor: "#123456", color: "#abcdef" });
  });

  it("falls back to the default colours when neither is set", () => {
    const { container } = render(<ProjectHeader project={project()} />);

    const header = container.querySelector("header");
    expect(header?.style.backgroundColor).toBe("");
    expect(header?.style.color).toBe("");
    expect(header).toHaveClass("bg-grey-400", "text-white");
  });

  it("falls back to the default colours when only the background colour is set", () => {
    const { container } = render(
      <ProjectHeader
        project={project({
          headerBackgroundColor: { _type: "color", hex: "#123456" },
          headerForegroundColor: null,
        })}
      />,
    );

    const header = container.querySelector("header");
    expect(header?.style.backgroundColor).toBe("");
    expect(header?.style.color).toBe("");
    expect(header).toHaveClass("bg-grey-400", "text-white");
  });

  it("falls back to the default colours when only the foreground colour is set", () => {
    const { container } = render(
      <ProjectHeader
        project={project({
          headerBackgroundColor: null,
          headerForegroundColor: { _type: "color", hex: "#abcdef" },
        })}
      />,
    );

    const header = container.querySelector("header");
    expect(header?.style.backgroundColor).toBe("");
    expect(header?.style.color).toBe("");
    expect(header).toHaveClass("bg-grey-400", "text-white");
  });

  it("still renders the title with custom colours applied", () => {
    render(
      <ProjectHeader
        project={project({
          title: "Custom Colour Project",
          headerBackgroundColor: { _type: "color", hex: "#123456" },
          headerForegroundColor: { _type: "color", hex: "#abcdef" },
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Custom Colour Project" })).toBeInTheDocument();
  });
});
