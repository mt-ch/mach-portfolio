import { describe, expect, it } from "vitest";

import type { About } from "@/lib/sanity";

import { templateAboutHeader } from "./templates";

function makeAbout(overrides: Partial<About> = {}): About {
  return {
    _id: "about",
    name: "Matt Chan",
    headline: "Frontend engineer",
    bio: null,
    whatIDo: null,
    logo: null,
    footerText: null,
    resumeUrl: null,
    email: "matt@example.com",
    socialLinks: null,
    howIWork: null,
    ...overrides,
  };
}

describe("templateAboutHeader", () => {
  it("always includes Name and Headline", () => {
    const header = templateAboutHeader(makeAbout({ email: null as unknown as string }));

    expect(header).toContain("Name: Matt Chan");
    expect(header).toContain("Headline: Frontend engineer");
  });

  it("includes Email when set to a real address", () => {
    const header = templateAboutHeader(makeAbout({ email: "matt@realdomain.com" }));

    expect(header).toContain("Email: matt@realdomain.com");
  });

  it("omits Email when null", () => {
    const header = templateAboutHeader(makeAbout({ email: null as unknown as string }));

    expect(header).not.toContain("Email:");
  });

  it("omits Email when it looks like seed/placeholder data", () => {
    const header = templateAboutHeader(makeAbout({ email: "hello@test.com" }));

    expect(header).not.toContain("Email:");
  });

  it("includes LinkedIn when present in socialLinks", () => {
    const header = templateAboutHeader(
      makeAbout({
        socialLinks: [
          {
            _type: "socialLink",
            _key: "a",
            platform: "LinkedIn",
            url: "https://linkedin.com/in/matt",
          },
        ],
      }),
    );

    expect(header).toContain("LinkedIn: https://linkedin.com/in/matt");
  });

  it("omits LinkedIn when socialLinks has no LinkedIn entry", () => {
    const header = templateAboutHeader(
      makeAbout({
        socialLinks: [
          { _type: "socialLink", _key: "a", platform: "GitHub", url: "https://github.com/matt" },
        ],
      }),
    );

    expect(header).not.toContain("LinkedIn:");
  });

  it("omits LinkedIn when socialLinks is null", () => {
    const header = templateAboutHeader(makeAbout({ socialLinks: null }));

    expect(header).not.toContain("LinkedIn:");
  });

  it("includes Résumé when resumeUrl is set", () => {
    const header = templateAboutHeader(
      makeAbout({ resumeUrl: "https://cdn.sanity.io/files/proj/prod/resume.pdf" }),
    );

    expect(header).toContain("Résumé: https://cdn.sanity.io/files/proj/prod/resume.pdf");
  });

  it("omits Résumé when null", () => {
    const header = templateAboutHeader(makeAbout({ resumeUrl: null }));

    expect(header).not.toContain("Résumé:");
  });
});
