import { describe, expect, it } from "vitest";
import { validateCopy, validateSelection } from "./validate";

const BOUNDS = { headline: 80, subheadline: 140, blurb: 200, emphasis: 200 };

describe("validateSelection", () => {
  it("discards entries whose slug is not in the real Project set", () => {
    const validSlugs = new Set(["real-project-a", "real-project-b"]);
    const candidate = {
      selected: [
        { slug: "real-project-a", match_reason: "matches state management" },
        { slug: "hallucinated-project", match_reason: "made up" },
      ],
    };

    const result = validateSelection(candidate, validSlugs);

    expect(result).toEqual([
      { slug: "real-project-a", match_reason: "matches state management" },
    ]);
  });

  it("keeps every entry when all slugs are in the real Project set", () => {
    const validSlugs = new Set(["real-project-a", "real-project-b"]);
    const candidate = {
      selected: [
        { slug: "real-project-a", match_reason: "a" },
        { slug: "real-project-b", match_reason: "b" },
      ],
    };

    const result = validateSelection(candidate, validSlugs);

    expect(result).toEqual(candidate.selected);
  });
});

describe("validateCopy", () => {
  it("discards project blurb entries whose slug is not in the real Project set", () => {
    const validSlugs = new Set(["real-project-a"]);
    const candidate = {
      hero: { headline: "Built for scale", subheadline: "See the work" },
      projects: [
        { slug: "real-project-a", blurb: "A real blurb." },
        { slug: "hallucinated-project", blurb: "A fake blurb." },
      ],
      about: { emphasis: "Strong in frontend architecture." },
    };

    const result = validateCopy(candidate, validSlugs, BOUNDS);

    expect(result.projects).toEqual([
      { slug: "real-project-a", blurb: "A real blurb." },
    ]);
  });

  it("rejects the hero when the headline exceeds its length bound", () => {
    const validSlugs = new Set(["real-project-a"]);
    const candidate = {
      hero: { headline: "a".repeat(81), subheadline: "See the work" },
      projects: [{ slug: "real-project-a", blurb: "A real blurb." }],
      about: { emphasis: "Strong in frontend architecture." },
    };

    const result = validateCopy(candidate, validSlugs, BOUNDS);

    expect(result.hero).toBeNull();
  });

  it("rejects the hero when the subheadline exceeds its length bound", () => {
    const validSlugs = new Set(["real-project-a"]);
    const candidate = {
      hero: { headline: "Built for scale", subheadline: "a".repeat(141) },
      projects: [{ slug: "real-project-a", blurb: "A real blurb." }],
      about: { emphasis: "Strong in frontend architecture." },
    };

    const result = validateCopy(candidate, validSlugs, BOUNDS);

    expect(result.hero).toBeNull();
  });

  it("keeps the hero when both fields are within bounds", () => {
    const validSlugs = new Set(["real-project-a"]);
    const candidate = {
      hero: { headline: "Built for scale", subheadline: "See the work" },
      projects: [{ slug: "real-project-a", blurb: "A real blurb." }],
      about: { emphasis: "Strong in frontend architecture." },
    };

    const result = validateCopy(candidate, validSlugs, BOUNDS);

    expect(result.hero).toEqual(candidate.hero);
  });

  it("rejects the about emphasis when it exceeds its length bound", () => {
    const validSlugs = new Set(["real-project-a"]);
    const candidate = {
      hero: { headline: "Built for scale", subheadline: "See the work" },
      projects: [{ slug: "real-project-a", blurb: "A real blurb." }],
      about: { emphasis: "a".repeat(201) },
    };

    const result = validateCopy(candidate, validSlugs, BOUNDS);

    expect(result.about).toBeNull();
  });

  it("discards a project blurb entry whose blurb exceeds its length bound", () => {
    const validSlugs = new Set(["real-project-a", "real-project-b"]);
    const candidate = {
      hero: { headline: "Built for scale", subheadline: "See the work" },
      projects: [
        { slug: "real-project-a", blurb: "A real blurb." },
        { slug: "real-project-b", blurb: "b".repeat(201) },
      ],
      about: { emphasis: "Strong in frontend architecture." },
    };

    const result = validateCopy(candidate, validSlugs, BOUNDS);

    expect(result.projects).toEqual([
      { slug: "real-project-a", blurb: "A real blurb." },
    ]);
  });
});
