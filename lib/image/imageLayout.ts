// The single source of truth for how portfolio imagery is shaped and sized.
// Framework-free on purpose: no React, no next/image, no Sanity client. Both
// image renderers (`CoverImage` for composed frames, `ContentBlocks` for Project
// Story Image Blocks) consume this so the layout decisions live in one tested
// place instead of being scattered across components.

/**
 * A target aspect-ratio token an editor crops toward. `16:9`, `4:3` and `4:5`
 * are the documented Image Block targets; `16:9` doubles as the fixed shape of
 * the homepage Featured Project row's desktop columns, `3:2` as the fixed
 * shape of the Other Projects cards.
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
  // Story `full` images cap at the ~1200px reading column; the Featured
  // Project row's desktop columns render close to full-bleed. 2x either way
  // for retina.
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
 * The aspect-ratio boundary (width / height) below which an image counts as
 * "portrait": it is routed to the inset width even when authored full, and it
 * gets the max-height guard. A single named constant so tuning it during visual
 * review is a one-line change. 4:3 (~1.33) stays above it; 4:5 (0.8) and phone
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
  /** The layout to render at after portrait routing. */
  layout: EffectiveImageLayout;
  /**
   * A ratio the images must be cropped to, overriding their intrinsic ratio.
   * Only `pair` forces one (both images to 4:3); `null` everywhere else.
   */
  forcedRatio: RatioToken | null;
  /**
   * How the image sits in its box. `cover` crops to fill (paired images);
   * `contain` shows the whole image (everything else, so the max-height guard
   * can letterbox tall images).
   */
  objectFit: "cover" | "contain";
  /**
   * Whether the ~85vh max-height guard applies, keeping a single image within
   * roughly one viewport. Applies whenever the resolved layout is `full` — at
   * the ~1200px reading column width, even a moderately-landscape screenshot
   * (aspect ratio near 1) can otherwise render tall enough to dominate the
   * screen — and to any portrait image (aspect ratio below
   * {@link PORTRAIT_ASPECT_RATIO_THRESHOLD}), including one routed to the
   * narrower `inset` width.
   */
  applyMaxHeightGuard: boolean;
  /** The responsive `sizes` string for the resolved layout. */
  sizes: string;
};

const LAYOUT_SIZES: Record<EffectiveImageLayout, string> = {
  // Bounded by the ~1200px story reading column.
  full: "(max-width: 1200px) 100vw, 1200px",
  inset: "(max-width: 1024px) 100vw, 672px",
  pair: "(max-width: 640px) 100vw, 50vw",
};

const PAIR_FORCED_RATIO: RatioToken = "4:3";

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
      forcedRatio: PAIR_FORCED_RATIO,
      objectFit: "cover",
      applyMaxHeightGuard: false,
      sizes: LAYOUT_SIZES.pair,
    };
  }

  const portrait = isPortrait(aspectRatio);
  const layout: EffectiveImageLayout =
    authoredLayout === "full" && portrait ? "inset" : authoredLayout;

  return {
    layout,
    forcedRatio: null,
    objectFit: "contain",
    applyMaxHeightGuard: layout === "full" || portrait,
    sizes: LAYOUT_SIZES[layout],
  };
}
