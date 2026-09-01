import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { About } from "@/lib/sanity";

import { WhatIDoSection } from "./WhatIDoSection";

const about: About = {
  _id: "about",
  name: "Matt Chan",
  headline: "is a product designer based in San Diego.",
  bio: null,
  whatIDo: [
    { _key: "a", title: "UX/UI design", description: "End-to-end product design." },
    {
      _key: "b",
      title: "Design systems",
      description: "Component libraries and tokens.",
    },
  ],
  logo: null,
  footerText: null,
  resumeUrl: null,
  email: "matt@example.com",
  socialLinks: null,
  howIWork: null,
  seo: null,
  siteName: null,
  titleTemplate: null,
  defaultMetaDescription: null,
  defaultOgImage: null,
};

describe("WhatIDoSection", () => {
  it("renders each service item with its title and description", () => {
    render(<WhatIDoSection about={about} />);

    expect(screen.getByText("[What I do]")).toBeInTheDocument();
    expect(screen.getByText("UX/UI design")).toBeInTheDocument();
    expect(screen.getByText("End-to-end product design.")).toBeInTheDocument();
    expect(screen.getByText("Design systems")).toBeInTheDocument();
    expect(screen.getByText("Component libraries and tokens.")).toBeInTheDocument();
  });

  it("renders nothing when whatIDo is empty", () => {
    const { container } = render(
      <WhatIDoSection about={{ ...about, whatIDo: [] }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when whatIDo is absent", () => {
    const { container } = render(
      <WhatIDoSection about={{ ...about, whatIDo: null }} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("[What I do]")).not.toBeInTheDocument();
  });
});
