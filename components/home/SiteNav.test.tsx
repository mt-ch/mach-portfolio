import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { About } from "@/lib/sanity";

import { SiteNav } from "./SiteNav";

const about: About = {
  _id: "about",
  name: "Matt Chan",
  headline: "Designer",
  bio: null,
  logo: null,
  availabilityStatus: null,
  footerMessage: null,
  resumeUrl: null,
  email: "matt@example.com",
  socialLinks: null,
};

describe("SiteNav", () => {
  it("renders the site owner name in the nav", () => {
    render(<SiteNav about={about} />);

    expect(screen.getByRole("link", { name: "Matt Chan" })).toHaveAttribute(
      "href",
      "#",
    );
  });
});
