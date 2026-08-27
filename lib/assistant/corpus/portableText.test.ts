import { describe, expect, it } from "vitest";

import type { PortableTextBlock } from "@/lib/sanity";

import { splitAtHeadings, toPlainText } from "./portableText";

function block(
  text: string,
  style?: PortableTextBlock["style"],
): PortableTextBlock {
  return { style, children: [{ text }] };
}

describe("toPlainText", () => {
  it("joins span text across blocks with blank lines", () => {
    expect(toPlainText([block("First para."), block("Second para.")])).toBe(
      "First para.\n\nSecond para.",
    );
  });

  it("returns an empty string for null/undefined/empty input", () => {
    expect(toPlainText(null)).toBe("");
    expect(toPlainText(undefined)).toBe("");
    expect(toPlainText([])).toBe("");
  });
});

describe("splitAtHeadings", () => {
  it("returns a single section with no heading when the body has no headings", () => {
    const sections = splitAtHeadings([block("Para one."), block("Para two.")]);

    expect(sections).toEqual([{ heading: null, text: "Para one.\n\nPara two." }]);
  });

  it("returns no sections for an empty or missing body", () => {
    expect(splitAtHeadings([])).toEqual([]);
    expect(splitAtHeadings(null)).toEqual([]);
  });

  it("splits into one section per heading when the author uses headings", () => {
    const sections = splitAtHeadings([
      block("Problem", "h2"),
      block("We had a problem."),
      block("Solution", "h2"),
      block("We built a solution."),
      block("It shipped."),
    ]);

    expect(sections).toEqual([
      { heading: "Problem", text: "We had a problem." },
      { heading: "Solution", text: "We built a solution.\n\nIt shipped." },
    ]);
  });

  it("captures body text preceding the first heading as its own unheaded section", () => {
    const sections = splitAtHeadings([
      block("Intro paragraph."),
      block("Details", "h2"),
      block("More detail."),
    ]);

    expect(sections).toEqual([
      { heading: null, text: "Intro paragraph." },
      { heading: "Details", text: "More detail." },
    ]);
  });

  it("drops an empty section produced by a heading with no following text", () => {
    const sections = splitAtHeadings([block("Empty heading", "h2")]);

    expect(sections).toEqual([{ heading: "Empty heading", text: "" }]);
  });
});
