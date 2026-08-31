import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeSection } from "./HomeSection";

describe("HomeSection", () => {
  it("renders the title in the [bracketed] motif", () => {
    render(
      <HomeSection title="What I do">
        <p>Product design</p>
      </HomeSection>,
    );

    expect(screen.getByText("[What I do]")).toBeInTheDocument();
    expect(screen.getByText("Product design")).toBeInTheDocument();
  });

  it("renders nothing when it has no children", () => {
    const { container } = render(<HomeSection title="Experience" />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("[Experience]")).not.toBeInTheDocument();
  });

  it("renders nothing when children are empty content", () => {
    const { container } = render(
      <HomeSection title="Experience">{"  "}</HomeSection>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
