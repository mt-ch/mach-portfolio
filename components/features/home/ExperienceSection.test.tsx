import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ExperienceEntry } from "@/lib/sanity";

import { ExperienceSection } from "./ExperienceSection";

const entries: ExperienceEntry[] = [
  {
    _id: "e1",
    company: "Pertemps",
    companyUrl: "https://www.pertemps.com/",
    logo: null,
    order: 1,
    roles: [
      {
        _key: "r1",
        title: "Software Engineer",
        startDate: "2022-03-01",
        endDate: "2024-06-01",
        summary: null,
        isCurrent: false,
      },
      {
        _key: "r2",
        title: "Junior Software Engineer",
        startDate: "2021-01-01",
        endDate: "2022-03-01",
        summary: null,
        isCurrent: false,
      },
    ],
  },
  {
    _id: "e2",
    company: "Virtue Health Group",
    companyUrl: null,
    logo: null,
    order: 2,
    roles: [
      {
        _key: "r3",
        title: "Frontend Engineer",
        startDate: "2024-07-01",
        endDate: null,
        summary: null,
        isCurrent: true,
      },
    ],
  },
];

describe("ExperienceSection", () => {
  it("renders nothing when there are no entries", () => {
    const { container } = render(<ExperienceSection entries={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("groups multiple role rows under a single company cell", () => {
    render(<ExperienceSection entries={entries} />);

    const seniorRow = screen.getByText("Software Engineer").closest("tr")!;
    const juniorRow = screen.getByText("Junior Software Engineer").closest("tr")!;

    expect(within(seniorRow).getByText("Pertemps")).toBeInTheDocument();
    expect(within(juniorRow).queryByText("Pertemps")).not.toBeInTheDocument();
  });

  it("formats periods as years only, en-dash separated", () => {
    render(<ExperienceSection entries={entries} />);
    expect(screen.getByText("2022 – 2024")).toBeInTheDocument();
    expect(screen.getByText("2021 – 2022")).toBeInTheDocument();
  });

  it("shows Present for a current role", () => {
    render(<ExperienceSection entries={entries} />);
    expect(screen.getByText("2024 – Present")).toBeInTheDocument();
  });

  it("links to companyUrl when set and omits the button otherwise", () => {
    render(<ExperienceSection entries={entries} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://www.pertemps.com/");

    const currentRow = screen.getByText("Frontend Engineer").closest("tr")!;
    expect(within(currentRow).queryByRole("link")).not.toBeInTheDocument();
  });

  it("does not render role summaries", () => {
    render(<ExperienceSection entries={entries} />);
    expect(screen.queryByText(/summary/i)).not.toBeInTheDocument();
  });
});
