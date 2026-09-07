// The single source of truth for how portfolio imagery is shaped and sized.
// Framework-free on purpose: no React, no next/image, no Sanity client. Both
// image renderers (`CoverImage` for composed frames, `ContentBlocks` for
// Project Story Image Blocks) consume this so the layout decisions live in
// one tested place instead of being scattered across components.

/**
 * A target aspect-ratio token. `16:9` is the fixed shape of the homepage
 * Featured Project row's desktop columns (`4:3` is its mobile shape); `3:2`
 * is the fixed shape of the Other Projects cards and of every Project Story
 * `full`/`pair` Image Block.
 */
export type RatioToken = "16:9" | "4:3" | "3:2";

/** Pixel dimensions handed to the Sanity image URL builder. */
export type ImageDimensions = { width: number; height: number };

/**
 * Dimensions requested from Sanity per ratio token, sized at roughly 1.5–2x
 * the maximum rendered CSS width for the surface that uses the token.
 */
const RATIO_DIMENSIONS: Record<RatioToken, ImageDimensions> = {
  // Other Projects cards and Project Story `full`/`pair` images render close
  // to full-bleed; ~2400px covers a large desktop. 2x for retina.
  "3:2": { width: 2400, height: 1600 },
  "16:9": { width: 2400, height: 1350 },
  "4:3": { width: 2400, height: 1800 },
};

/**
 * Maps a target ratio token to the `{ width, height }` pair passed to the
 * Sanity image URL builder.
 */
export function dimensionsForRatio(token: RatioToken): ImageDimensions {
  return RATIO_DIMENSIONS[token];
}

/** The `layout` value on an Image Block: one full-bleed image, or two side by side. */
export type ImageBlockLayout = "full" | "pair";

/**
 * The fixed ratio every Project Story Image Block crops to (`object-cover`),
 * at every breakpoint — the same shape as the Other Projects cards. Both
 * `full` and `pair` share it, and for `pair` it's the frame as a whole (not
 * each panel) that carries it — see `ContentBlocks.tsx` — so a `full` image
 * and a `pair` row render at the same height.
 */
export const CONTENT_BLOCK_RATIO: RatioToken = "3:2";

/**
 * The responsive `sizes` string per Image Block layout. `full` runs
 * edge-to-edge with the rest of the site; `pair` splits into two roughly
 * equal columns at `sm:` and up, stacking full-width below that.
 */
export const CONTENT_BLOCK_SIZES: Record<ImageBlockLayout, string> = {
  full: "100vw",
  pair: "(max-width: 640px) 100vw, 50vw",
};
