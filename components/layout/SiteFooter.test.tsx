import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { About } from "@/lib/sanity";

import { SiteFooter } from "./SiteFooter";

const about: About = {
  _id: "about",
  name: "Matt Chan",
  headline: "Designer",
  bio: null,
  whatIDo: null,
  logo: null,
  footerText: "for collaborations and full time roles",
  resumeUrl: "https://cdn.sanity.io/resume.pdf",
  email: "matt@example.com",
  socialLinks: [
    {
      _key: "1",
      _type: "socialLink",
      platform: "LinkedIn",
      url: "https://linkedin.com/in/matt",
    },
  ],
};

describe("SiteFooter", () => {
  it("renders footer text, email, resume, and social links", () => {
    render(<SiteFooter about={about} />);

    expect(screen.getByText(/Matt Chan/)).toBeInTheDocument();
    expect(
      screen.getByText(/for collaborations and full time roles/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Email me" })).toHaveAttribute(
      "href",
      "mailto:matt@example.com",
    );
    expect(screen.getByRole("link", { name: "Resume" })).toHaveAttribute(
      "href",
      "https://cdn.sanity.io/resume.pdf",
    );
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://linkedin.com/in/matt",
    );
  });

  it("omits the footer text when footerText is not set", () => {
    render(<SiteFooter about={{ ...about, footerText: null }} />);

    expect(
      screen.queryByText(/for collaborations and full time roles/),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Email me" })).toBeInTheDocument();
  });

  it("renders every line of a multi-line footerText", () => {
    render(
      <SiteFooter about={{ ...about, footerText: "Open to full-time roles\nBased in San Diego" }} />,
    );

    expect(screen.getByText(/Open to full-time roles/)).toBeInTheDocument();
    expect(screen.getByText(/Based in San Diego/)).toBeInTheDocument();
  });
});
