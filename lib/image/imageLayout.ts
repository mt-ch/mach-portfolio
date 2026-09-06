// The single source of truth for how portfolio imagery is shaped and sized.
// Framework-free on purpose: no React, no next/image, no Sanity client. Both
// image renderers (`CoverImage` for composed frames, `ContentBlocks` for Project
// Story Image Blocks) consume this so the layout decisions live in one tested
// place instead of being scattered across components.

/**
 * A target aspect-ratio token. `16:9` is the fixed shape of the homepage
 * Featured Project row's desktop columns and the default for Project Story
 * `full`/`pair` images; `3:2` is the fixed shape of the Other Projects cards.
 * All four values are also the editor-facing choices for each image's
 * per-breakpoint "Aspect ratio" Studio field on a `full`/`pair` Image Block.
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
   * Whether this layout force-crops its image(s) to a ratio (`object-cover`)
   * rather than showing their intrinsic ratio. True for `full` and `pair` —
   * each image then supplies its own {@link ResponsiveRatio} (see {@link
   * resolveForcedRatio}), since the ratio is set per image, not per block.
   * False for `inset`, which always renders intrinsic.
   */
  forcesRatio: boolean;
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
      forcesRatio: true,
      objectFit: "cover",
      applyMaxHeightGuard: true,
      sizes: LAYOUT_SIZES.pair,
    };
  }

  if (authoredLayout === "full") {
    return {
      layout: "full",
      forcesRatio: true,
      objectFit: "cover",
      applyMaxHeightGuard: true,
      sizes: LAYOUT_SIZES.full,
    };
  }

  return {
    layout: "inset",
    forcesRatio: false,
    objectFit: "contain",
    applyMaxHeightGuard: isPortrait(aspectRatio),
    sizes: LAYOUT_SIZES.inset,
  };
}

/**
 * The forced ratio for a `full`/`pair` image, per breakpoint. Set
 * independently on each image (a `pair`'s two images can crop differently,
 * and each can crop differently on mobile vs. desktop) via the image's own
 * Studio "Aspect ratio" field.
 */
export type ResponsiveRatio = { mobile: RatioToken; desktop: RatioToken };

/**
 * Falls back to `16:9` on both breakpoints — either the image predates the
 * Studio "Aspect ratio" field, or a breakpoint was left unset.
 */
export const DEFAULT_RESPONSIVE_RATIO: ResponsiveRatio = {
  mobile: "16:9",
  desktop: "16:9",
};

/**
 * Resolves an image's authored (possibly partial) Studio ratio selection into
 * a complete {@link ResponsiveRatio}, defaulting each unset breakpoint to
 * {@link DEFAULT_RESPONSIVE_RATIO}. Only meaningful when {@link
 * ResolvedImageBlock.forcesRatio} is true.
 */
export function resolveForcedRatio(
  ratio: Partial<ResponsiveRatio> | null | undefined,
): ResponsiveRatio {
  return {
    mobile: ratio?.mobile ?? DEFAULT_RESPONSIVE_RATIO.mobile,
    desktop: ratio?.desktop ?? DEFAULT_RESPONSIVE_RATIO.desktop,
  };
}

// The full-bleed fetch width for a `full`/`pair` image, independent of a
// ratio token's own `RATIO_DIMENSIONS` width — that width was tuned for the
// token's usual surface (e.g. `4:5`'s narrower inset column), not necessarily
// this full-bleed context, where every token needs the same wide baseline.
const FORCED_RATIO_FETCH_WIDTH = 2400;

function ratioValue(token: RatioToken): number {
  const { width, height } = RATIO_DIMENSIONS[token];
  return width / height;
}

/**
 * Dimensions to request from Sanity for a `full`/`pair` image with a
 * {@link ResponsiveRatio}: a fixed full-bleed width, and a height tall enough
 * to satisfy whichever breakpoint's ratio is taller — so, say, a portrait
 * mobile crop is never fetched shorter than it needs to render at just
 * because the desktop ratio happens to be wider.
 */
export function dimensionsForResponsiveRatio(
  ratio: ResponsiveRatio,
): ImageDimensions {
  const height = Math.max(
    FORCED_RATIO_FETCH_WIDTH / ratioValue(ratio.desktop),
    FORCED_RATIO_FETCH_WIDTH / ratioValue(ratio.mobile),
  );
  return { width: FORCED_RATIO_FETCH_WIDTH, height: Math.round(height) };
}
