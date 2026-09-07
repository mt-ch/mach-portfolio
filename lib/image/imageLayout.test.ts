import { describe, expect, it } from "vitest";

import {
  CONTENT_BLOCK_RATIO,
  CONTENT_BLOCK_SIZES,
  type RatioToken,
  dimensionsForRatio,
} from "./imageLayout";

describe("dimensionsForRatio", () => {
  const cases: Array<[RatioToken, { width: number; height: number }]> = [
    ["16:9", { width: 2400, height: 1350 }],
    ["4:3", { width: 2400, height: 1800 }],
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

describe("CONTENT_BLOCK_RATIO", () => {
  it("is 3:2, matching the Other Projects cards", () => {
    expect(CONTENT_BLOCK_RATIO).toBe("3:2");
  });
});

describe("CONTENT_BLOCK_SIZES", () => {
  it("runs full width for `full`", () => {
    expect(CONTENT_BLOCK_SIZES.full).toBe("100vw");
  });

  it("splits into two columns at sm: for `pair`", () => {
    expect(CONTENT_BLOCK_SIZES.pair).toBe("(max-width: 640px) 100vw, 50vw");
  });
});
