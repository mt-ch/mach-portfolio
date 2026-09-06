import { describe, expect, it } from "vitest";

import {
  PORTRAIT_ASPECT_RATIO_THRESHOLD,
  type RatioToken,
  dimensionsForRatio,
  dimensionsForResponsiveRatio,
  resolveForcedRatio,
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

describe("resolveImageBlock — layout is always the authored layout", () => {
  it("keeps a portrait image authored `full` as `full`", () => {
    const resolved = resolveImageBlock({
      authoredLayout: "full",
      aspectRatio: 0.8,
    });
    expect(resolved.layout).toBe("full");
  });

  it("keeps a landscape image authored `full` as `full`", () => {
    const resolved = resolveImageBlock({
      authoredLayout: "full",
      aspectRatio: 16 / 9,
    });
    expect(resolved.layout).toBe("full");
  });

  it("takes the authored layout at face value when aspect ratio is unknown", () => {
    const resolved = resolveImageBlock({ authoredLayout: "full" });
    expect(resolved.layout).toBe("full");
  });

  it("leaves an authored `inset` image as `inset` regardless of ratio", () => {
    expect(
      resolveImageBlock({ authoredLayout: "inset", aspectRatio: 0.8 }).layout,
    ).toBe("inset");
    expect(
      resolveImageBlock({ authoredLayout: "inset", aspectRatio: 16 / 9 }).layout,
    ).toBe("inset");
  });
});

describe("resolveImageBlock — forced-ratio treatment", () => {
  it("forces a ratio with object-cover for a `pair`", () => {
    const resolved = resolveImageBlock({
      authoredLayout: "pair",
      aspectRatio: 2,
    });
    expect(resolved).toMatchObject({
      layout: "pair",
      forcesRatio: true,
      objectFit: "cover",
      applyMaxHeightGuard: true,
    });
  });

  it("forces a ratio with object-cover for a resolved `full`", () => {
    const resolved = resolveImageBlock({
      authoredLayout: "full",
      aspectRatio: 4 / 3,
    });
    expect(resolved).toMatchObject({
      layout: "full",
      forcesRatio: true,
      objectFit: "cover",
      applyMaxHeightGuard: true,
    });
  });

  it("does not force a ratio for `inset`", () => {
    expect(resolveImageBlock({ authoredLayout: "inset" }).forcesRatio).toBe(
      false,
    );
  });

  it("renders `inset` images with object-contain", () => {
    expect(resolveImageBlock({ authoredLayout: "inset" }).objectFit).toBe(
      "contain",
    );
  });
});

describe("resolveForcedRatio — per-image, per-breakpoint ratio", () => {
  it("defaults both breakpoints to 16:9 when unset", () => {
    expect(resolveForcedRatio(undefined)).toEqual({
      mobile: "16:9",
      desktop: "16:9",
    });
    expect(resolveForcedRatio(null)).toEqual({
      mobile: "16:9",
      desktop: "16:9",
    });
  });

  it("uses the editor's selection for both breakpoints when fully set", () => {
    expect(resolveForcedRatio({ mobile: "4:5", desktop: "3:2" })).toEqual({
      mobile: "4:5",
      desktop: "3:2",
    });
  });

  it("defaults only the unset breakpoint when partially set", () => {
    expect(resolveForcedRatio({ desktop: "4:3" })).toEqual({
      mobile: "16:9",
      desktop: "4:3",
    });
    expect(resolveForcedRatio({ mobile: "4:3" })).toEqual({
      mobile: "4:3",
      desktop: "16:9",
    });
  });
});

describe("dimensionsForResponsiveRatio", () => {
  it("uses the fixed full-bleed width regardless of ratio", () => {
    expect(
      dimensionsForResponsiveRatio({ mobile: "16:9", desktop: "16:9" }).width,
    ).toBe(2400);
    expect(
      dimensionsForResponsiveRatio({ mobile: "4:5", desktop: "4:5" }).width,
    ).toBe(2400);
  });

  it("matches dimensionsForRatio's height when both breakpoints agree", () => {
    expect(
      dimensionsForResponsiveRatio({ mobile: "4:3", desktop: "4:3" }),
    ).toEqual(dimensionsForRatio("4:3"));
  });

  it("uses the taller breakpoint's height when desktop is wider than mobile", () => {
    // desktop 16:9 alone would need less height than a 4:5 mobile crop —
    // fetching only the desktop dimensions would under-provision mobile.
    const dimensions = dimensionsForResponsiveRatio({
      mobile: "4:5",
      desktop: "16:9",
    });
    expect(dimensions.height).toBe(dimensionsForResponsiveRatio({
      mobile: "4:5",
      desktop: "4:5",
    }).height);
  });

  it("uses the taller breakpoint's height when mobile is wider than desktop", () => {
    const dimensions = dimensionsForResponsiveRatio({
      mobile: "16:9",
      desktop: "4:5",
    });
    expect(dimensions.height).toBe(dimensionsForResponsiveRatio({
      mobile: "4:5",
      desktop: "4:5",
    }).height);
  });
});

describe("resolveImageBlock — sizes string", () => {
  it("returns the full-bleed sizes for a resolved `full`", () => {
    expect(
      resolveImageBlock({ authoredLayout: "full", aspectRatio: 16 / 9 }).sizes,
    ).toBe("100vw");
  });

  it("returns the inset sizes for a resolved `inset`", () => {
    expect(
      resolveImageBlock({ authoredLayout: "inset" }).sizes,
    ).toBe("(max-width: 1024px) 100vw, 672px");
  });

  it("returns the full-bleed sizes for a portrait image authored `full`", () => {
    expect(
      resolveImageBlock({ authoredLayout: "full", aspectRatio: 0.8 }).sizes,
    ).toBe("100vw");
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

  it("applies the guard to a portrait image authored `full`", () => {
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

  it("applies the guard to a `pair`", () => {
    expect(
      resolveImageBlock({ authoredLayout: "pair", aspectRatio: 0.6 })
        .applyMaxHeightGuard,
    ).toBe(true);
  });
});
