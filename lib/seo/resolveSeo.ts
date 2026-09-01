import type { Image } from "sanity";

import { urlFor } from "@/lib/sanity/image";

// Fixed Open Graph / Twitter card image dimensions. The resolved `ogImage`
// URL is always requested at this size with a hotspot-aware crop.
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// The `seo` object embedded in a document (see sanity/schemaTypes/seo.ts).
export interface SeoObject {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: Image | null;
  ogImageAlt?: string | null;
  noIndex?: boolean | null;
}

// The minimal document shape resolveSeo reads. Both a project detail document
// and the homepage/about singleton satisfy it — fields absent on one side
// (e.g. `summary` on the homepage) simply fall through to the site default.
export interface SeoDocument {
  title?: string | null;
  summary?: string | null;
  coverImage?: Image | null;
  seo?: SeoObject | null;
}

// Site-wide fallbacks, sourced from the "Site SEO Defaults" group on the
// about singleton with the layout's hard-coded constants already applied.
export interface SiteSeoDefaults {
  siteName?: string | null;
  defaultMetaDescription?: string | null;
  defaultOgImage?: Image | null;
}

export interface ResolvedSeo {
  title: string;
  description: string;
  ogImage: string | null;
  ogImageAlt: string;
  noIndex: boolean;
}

// Sanity can leave an assetless `{ _type: "image", crop, hotspot }` behind
// when an editor uploads then clears an image field. Such an object is truthy
// but has no asset ref, so it must not short-circuit the fallback chain.
function hasAsset(source: Image | null | undefined): source is Image {
  return Boolean(source && (source as { asset?: unknown }).asset);
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return "";
}

// Pure three-tier fallback resolver. No Sanity-client or Next imports — the
// only dependency is the Sanity image URL builder, used to turn whichever
// image tier wins into an absolute, fixed-size, hotspot-aware CDN URL.
// The title template is NOT applied here; that stays a Next Metadata concern.
export function resolveSeo(
  doc: SeoDocument,
  siteDefaults: SiteSeoDefaults,
): ResolvedSeo {
  const seo = doc.seo ?? {};

  const title = firstNonEmpty(seo.metaTitle, doc.title, siteDefaults.siteName);

  const description = firstNonEmpty(
    seo.metaDescription,
    doc.summary,
    siteDefaults.defaultMetaDescription,
  );

  const imageSource = [
    seo.ogImage,
    doc.coverImage,
    siteDefaults.defaultOgImage,
  ].find(hasAsset);

  const ogImage = imageSource
    ? urlFor(imageSource)
        .width(OG_IMAGE_WIDTH)
        .height(OG_IMAGE_HEIGHT)
        .fit("crop")
        .url()
    : null;

  const ogImageAlt = firstNonEmpty(seo.ogImageAlt) || title;

  return {
    title,
    description,
    ogImage,
    ogImageAlt,
    noIndex: seo.noIndex ?? false,
  };
}
