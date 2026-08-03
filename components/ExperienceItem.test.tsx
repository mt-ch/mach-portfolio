import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ExperienceEntry } from "@/lib/sanity";

import { ExperienceItem } from "./ExperienceItem";

describe("ExperienceItem", () => {
  it('renders "Present" for a current role with a null endDate', () => {
    const entry: ExperienceEntry = {
      _id: "1",
      company: "Acme",
      title: "Engineer",
      startDate: "2024-01-01",
      endDate: null,
      summary: null,
      logo: null,
      order: 1,
      isCurrent: true,
    };

    render(
      <ul>
        <ExperienceItem entry={entry} />
      </ul>,
    );

    expect(screen.getByText(/Present/)).toBeInTheDocument();
  });

  it("renders the formatted end date for a past role", () => {
    const entry: ExperienceEntry = {
      _id: "1",
      company: "Acme",
      title: "Engineer",
      startDate: "2020-01-01",
      endDate: "2023-06-01",
      summary: null,
      logo: null,
      order: 1,
      isCurrent: false,
    };

    render(
      <ul>
        <ExperienceItem entry={entry} />
      </ul>,
    );

    expect(screen.queryByText(/Present/)).not.toBeInTheDocument();
    expect(screen.getByText(/Jun 2023/)).toBeInTheDocument();
  });
});
