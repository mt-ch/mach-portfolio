// The single source of truth for how portfolio imagery is shaped and sized.
// Framework-free on purpose: no React, no next/image, no Sanity client. Both
// image renderers (`CoverImage` for composed frames, `ContentBlocks` for Project
// Story Image Blocks) consume this so the layout decisions live in one tested
// place instead of being scattered across components.

/**
 * A target aspect-ratio token an editor crops toward. `16:9`, `4:3` and `4:5`
 * are the documented Image Block targets; `16:9` doubles as the fixed shape of
 * the homepage Featured Project row's desktop columns and of Project Story
 * `full`/`pair` images, `3:2` as the fixed shape of the Other Projects cards.
 */
export type RatioToken = "16:9" | "4:3" | "4:5" | "3:2";

/** Pixel dimensions handed to the Sanity image URL builder. */
export type ImageDimensions = { width: number; height: number };

/**
 * Dimensions requested from Sanity per ratio token, sized at roughly 1.5–2x the
 * maximum rendered CSS width for the surface that uses the token. Replaces the
 * hardcoded `1200x800` / `1600x1000` that used to live in the components.
 */
const RATIO_DIMENSIONS: Record<RatioToken, ImageDimensions> = {
  // Other Projects cards render close to full-bleed; ~2400px covers a large desktop.
  "3:2": { width: 2400, height: 1600 },
  // Shared by the Featured Project row's desktop columns and Project Story
  // `full`/`pair` images — all three render close to full-bleed. 2x for retina.
  "16:9": { width: 2400, height: 1350 },
  "4:3": { width: 2400, height: 1800 },
  // Portrait images render at the narrower inset width (~672px); a smaller
  // long edge is still comfortably 2x.
  "4:5": { width: 1600, height: 2000 },
};

/**
 * Maps a target ratio token to the `{ width, height }` pair passed to the Sanity
 * image URL builder.
 */
export function dimensionsForRatio(token: RatioToken): ImageDimensions {
  return RATIO_DIMENSIONS[token];
}

/**
 * The aspect-ratio boundary (width / height) below which an `inset` image
 * counts as "portrait" and gets the max-height guard (so a tall screenshot
 * shown uncropped at the narrower inset width still fits within roughly one
 * viewport). A single named constant so tuning it during visual review is a
 * one-line change. 4:3 (~1.33) stays above it; 4:5 (0.8) and phone
 * screenshots fall below.
 */
export const PORTRAIT_ASPECT_RATIO_THRESHOLD = 0.9;

/** The authored `layout` value on an Image Block. */
export type AuthoredImageLayout = "full" | "inset" | "pair";

/** The resolved layout an Image Block actually renders at. */
export type EffectiveImageLayout = "full" | "inset" | "pair";

export type ResolveImageBlockInput = {
  /** The layout the editor chose in the Studio. */
  authoredLayout: AuthoredImageLayout;
  /**
   * The image's intrinsic (post-crop) aspect ratio, width / height, from the
   * asset metadata. Optional: absent when metadata has not been fetched, in
   * which case the authored layout is taken at face value.
   */
  aspectRatio?: number;
};

export type ResolvedImageBlock = {
  /**
   * The layout to render at — always the authored layout; there is no
   * automatic routing between layouts. `full` and `pair` are both forced-crop
   * composed frames, so a portrait screenshot authored `full` still renders
   * full-bleed at the shared ratio rather than being narrowed to `inset`.
   */
  layout: EffectiveImageLayout;
  /**
   * A ratio the images must be cropped to, overriding their intrinsic ratio.
   * `full` and `pair` both force `16:9` (composed, full-bleed frames, cropped
   * the same way the homepage Featured Project row is); `inset` stays
   * intrinsic (`null`), since it exists specifically to show tall/portrait
   * screenshots uncropped.
   */
  forcedRatio: RatioToken | null;
  /**
   * How the image sits in its box. `cover` crops to fill (`full` and `pair`);
   * `contain` shows the whole image (`inset`, so the max-height guard can
   * letterbox tall images instead of cropping them).
   */
  objectFit: "cover" | "contain";
  /**
   * Whether the max-height guard applies (rendered via the
   * `--layout-max-bleed-height` CSS token for `full`/`pair`, and a fixed
   * `85vh` for a portrait `inset`). Applies to `full` and `pair`
   * unconditionally (full-bleed composed frames, exposed to the same "huge on
   * a big monitor" problem as the homepage row) and to `inset` only when the
   * image is portrait (aspect ratio below
   * {@link PORTRAIT_ASPECT_RATIO_THRESHOLD}).
   */
  applyMaxHeightGuard: boolean;
  /** The responsive `sizes` string for the resolved layout. */
  sizes: string;
};

const LAYOUT_SIZES: Record<EffectiveImageLayout, string> = {
  // No longer bounded by a reading column — full-bleed like the rest of the site.
  full: "100vw",
  inset: "(max-width: 1024px) 100vw, 672px",
  pair: "(max-width: 640px) 100vw, 50vw",
};

// The shared forced ratio for `full` and `pair` — see {@link ResolvedImageBlock.forcedRatio}.
const FULL_AND_PAIR_FORCED_RATIO: RatioToken = "16:9";

function isPortrait(aspectRatio: number | undefined): boolean {
  return aspectRatio !== undefined && aspectRatio < PORTRAIT_ASPECT_RATIO_THRESHOLD;
}

/**
 * Resolves an Image Block's authored layout plus intrinsic aspect ratio into the
 * effective rendering treatment.
 */
export function resolveImageBlock({
  authoredLayout,
  aspectRatio,
}: ResolveImageBlockInput): ResolvedImageBlock {
  if (authoredLayout === "pair") {
    return {
      layout: "pair",
      forcedRatio: FULL_AND_PAIR_FORCED_RATIO,
      objectFit: "cover",
      applyMaxHeightGuard: true,
      sizes: LAYOUT_SIZES.pair,
    };
  }

  if (authoredLayout === "full") {
    return {
      layout: "full",
      forcedRatio: FULL_AND_PAIR_FORCED_RATIO,
      objectFit: "cover",
      applyMaxHeightGuard: true,
      sizes: LAYOUT_SIZES.full,
    };
  }

  return {
    layout: "inset",
    forcedRatio: null,
    objectFit: "contain",
    applyMaxHeightGuard: isPortrait(aspectRatio),
    sizes: LAYOUT_SIZES.inset,
  };
}
