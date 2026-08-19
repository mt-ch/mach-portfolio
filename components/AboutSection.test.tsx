import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { About } from "@/lib/sanity";

import { AboutSection } from "./AboutSection";

const about: About = {
  _id: "about",
  name: "Matt Chan",
  headline: "Software Engineer",
  bio: null,
  logo: null,
  availabilityStatus: null,
  footerMessage: null,
  resumeUrl: "https://cdn.sanity.io/resume.pdf",
  email: "matt@example.com",
  socialLinks: [
    { _key: "1", _type: "socialLink", platform: "GitHub", url: "https://github.com/matt" },
  ],
};

describe("AboutSection", () => {
  it("renders name, headline, email, resume link, and social links", () => {
    render(<AboutSection about={about} />);

    expect(screen.getByText("Matt Chan")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "matt@example.com" })).toHaveAttribute(
      "href",
      "mailto:matt@example.com",
    );
    expect(screen.getByRole("link", { name: "Resume" })).toHaveAttribute(
      "href",
      "https://cdn.sanity.io/resume.pdf",
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/matt",
    );
  });

  it("omits the resume link when no resume file is set", () => {
    render(<AboutSection about={{ ...about, resumeUrl: null }} />);

    expect(screen.queryByRole("link", { name: "Resume" })).not.toBeInTheDocument();
  });
});
