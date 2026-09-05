import { describe, expect, it } from "vitest";

import {
  PORTRAIT_ASPECT_RATIO_THRESHOLD,
  type RatioToken,
  dimensionsForRatio,
  resolveImageBlock,
} from "./imageLayout";

describe("dimensionsForRatio", () => {
  const cases: Array<[RatioToken, { width: number; height: number }]> = [
    ["16:9", { width: 2400, height: 1350 }],
    ["4:3", { width: 2400, height: 1800 }],
    ["4:5", { width: 1600, height: 2000 }],
    ["3:2", { width: 2400, height: 1600 }],
  ];

  it.each(cases)("maps %s to its dimension pair", (token, expected) => {
    expect(dimensionsForRatio(token)).toEqual(expected);
  });

  it.each(cases)("returns dimensions matching the %s ratio", (token) => {
    const [w, h] = token.split(":").map(Number);
    const { width, height } = dimensionsForRatio(token);
    expect(width / height).toBeCloseTo(w / h, 5);
  });
});

describe("resolveImageBlock — portrait routing", () => {
  it("collapses a portrait image authored `full` to `inset`", () => {
    const resolved = resolveImageBlock({
      authoredLayout: "full",
      aspectRatio: 0.8,
    });
    expect(resolved.layout).toBe("inset");
  });

  it("keeps a landscape image authored `full` as `full`", () => {
    const resolved = resolveImageBlock({
      authoredLayout: "full",
      aspectRatio: 16 / 9,
    });
    expect(resolved.layout).toBe("full");
  });

  it("keeps a 4:3 image authored `full` as `full` (above the threshold)", () => {
    const resolved = resolveImageBlock({
      authoredLayout: "full",
      aspectRatio: 4 / 3,
    });
    expect(resolved.layout).toBe("full");
  });

  it("takes the authored layout at face value when aspect ratio is unknown", () => {
    const resolved = resolveImageBlock({ authoredLayout: "full" });
    expect(resolved.layout).toBe("full");
  });

  it("leaves an authored `inset` image as `inset`", () => {
    const resolved = resolveImageBlock({
      authoredLayout: "inset",
      aspectRatio: 0.8,
    });
    expect(resolved.layout).toBe("inset");
  });
});

describe("resolveImageBlock — pair treatment", () => {
  it("forces 4:3 with object-cover for a `pair`", () => {
    const resolved = resolveImageBlock({
      authoredLayout: "pair",
      aspectRatio: 2,
    });
    expect(resolved).toMatchObject({
      layout: "pair",
      forcedRatio: "4:3",
      objectFit: "cover",
      applyMaxHeightGuard: false,
    });
  });

  it("does not force a ratio for non-pair layouts", () => {
    expect(resolveImageBlock({ authoredLayout: "full" }).forcedRatio).toBeNull();
    expect(resolveImageBlock({ authoredLayout: "inset" }).forcedRatio).toBeNull();
  });

  it("renders non-pair images with object-contain", () => {
    expect(resolveImageBlock({ authoredLayout: "full" }).objectFit).toBe(
      "contain",
    );
  });
});

describe("resolveImageBlock — sizes string", () => {
  it("returns the story-column sizes for a resolved `full`", () => {
    expect(
      resolveImageBlock({ authoredLayout: "full", aspectRatio: 16 / 9 }).sizes,
    ).toBe("(max-width: 1200px) 100vw, 1200px");
  });

  it("returns the inset sizes for a resolved `inset`", () => {
    expect(
      resolveImageBlock({ authoredLayout: "inset" }).sizes,
    ).toBe("(max-width: 1024px) 100vw, 672px");
  });

  it("returns the inset sizes for a portrait image routed from `full` to `inset`", () => {
    expect(
      resolveImageBlock({ authoredLayout: "full", aspectRatio: 0.8 }).sizes,
    ).toBe("(max-width: 1024px) 100vw, 672px");
  });

  it("returns the pair sizes for a `pair`", () => {
    expect(
      resolveImageBlock({ authoredLayout: "pair", aspectRatio: 1 }).sizes,
    ).toBe("(max-width: 640px) 100vw, 50vw");
  });
});

describe("resolveImageBlock — max-height guard", () => {
  it("applies the guard to a landscape image resolved to `full`", () => {
    expect(
      resolveImageBlock({ authoredLayout: "full", aspectRatio: 1.5 })
        .applyMaxHeightGuard,
    ).toBe(true);
  });

  it("applies the guard to a `full` image even when aspect ratio is unknown", () => {
    expect(
      resolveImageBlock({ authoredLayout: "full" }).applyMaxHeightGuard,
    ).toBe(true);
  });

  it("applies the guard to a portrait image routed from `full` to `inset`", () => {
    expect(
      resolveImageBlock({ authoredLayout: "full", aspectRatio: 0.6 })
        .applyMaxHeightGuard,
    ).toBe(true);
  });

  it("does not apply the guard to a landscape `inset` image", () => {
    expect(
      resolveImageBlock({ authoredLayout: "inset", aspectRatio: 1.5 })
        .applyMaxHeightGuard,
    ).toBe(false);
  });

  it("applies the guard to a portrait `inset` image", () => {
    expect(
      resolveImageBlock({ authoredLayout: "inset", aspectRatio: 0.6 })
        .applyMaxHeightGuard,
    ).toBe(true);
  });

  it("flips exactly at the portrait threshold for `inset`", () => {
    const justBelow = resolveImageBlock({
      authoredLayout: "inset",
      aspectRatio: PORTRAIT_ASPECT_RATIO_THRESHOLD - 0.01,
    });
    const atThreshold = resolveImageBlock({
      authoredLayout: "inset",
      aspectRatio: PORTRAIT_ASPECT_RATIO_THRESHOLD,
    });
    expect(justBelow.applyMaxHeightGuard).toBe(true);
    expect(atThreshold.applyMaxHeightGuard).toBe(false);
  });

  it("does not apply the guard to an `inset` image when aspect ratio is unknown", () => {
    expect(
      resolveImageBlock({ authoredLayout: "inset" }).applyMaxHeightGuard,
    ).toBe(false);
  });

  it("does not apply the guard to a `pair`", () => {
    expect(
      resolveImageBlock({ authoredLayout: "pair", aspectRatio: 0.6 })
        .applyMaxHeightGuard,
    ).toBe(false);
  });
});
