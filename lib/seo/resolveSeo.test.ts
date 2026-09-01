import { describe, expect, it } from "vitest";
import type { Image } from "sanity";

import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  resolveSeo,
  type SeoDocument,
  type SeoObject,
  type SiteSeoDefaults,
} from "./resolveSeo";

// The Sanity image-url builder parses the asset ref, so it must be well-formed
// (`image-<id>-<dimensions>-<ext>`). `slug` is folded into the id so a fixture
// can be recognised in the generated URL.
function makeImage(slug: string, extra: Partial<Image> = {}): Image {
  const id = `${slug}`.replace(/[^a-z0-9]/gi, "").padEnd(20, "0");
  return {
    _type: "image",
    asset: { _type: "reference", _ref: `image-${id}-2000x1050-jpg` },
    ...extra,
  };
}

function makeSeo(overrides: Partial<SeoObject> = {}): SeoObject {
  return {
    metaTitle: null,
    metaDescription: null,
    ogImage: null,
    ogImageAlt: null,
    noIndex: null,
    ...overrides,
  };
}

function makeDoc(overrides: Partial<SeoDocument> = {}): SeoDocument {
  return {
    title: "Collab Canvas",
    summary: "A collaborative whiteboard.",
    coverImage: null,
    seo: null,
    ...overrides,
  };
}

function makeSiteDefaults(
  overrides: Partial<SiteSeoDefaults> = {},
): SiteSeoDefaults {
  return {
    siteName: "Matt Chan",
    defaultMetaDescription: "Design engineer portfolio.",
    defaultOgImage: makeImage("sitedefault"),
    ...overrides,
  };
}

describe("resolveSeo — title fallback chain", () => {
  it("prefers the seo.metaTitle override", () => {
    const result = resolveSeo(
      makeDoc({ seo: makeSeo({ metaTitle: "Custom Title" }) }),
      makeSiteDefaults(),
    );

    expect(result.title).toBe("Custom Title");
  });

  it("falls back to the document title when metaTitle is blank", () => {
    const result = resolveSeo(
      makeDoc({ seo: makeSeo({ metaTitle: "   " }) }),
      makeSiteDefaults(),
    );

    expect(result.title).toBe("Collab Canvas");
  });

  it("falls back to the site name when the document has no title", () => {
    const result = resolveSeo(
      makeDoc({ title: null, seo: null }),
      makeSiteDefaults(),
    );

    expect(result.title).toBe("Matt Chan");
  });
});

describe("resolveSeo — description fallback chain", () => {
  it("prefers the seo.metaDescription override", () => {
    const result = resolveSeo(
      makeDoc({ seo: makeSeo({ metaDescription: "Custom description." }) }),
      makeSiteDefaults(),
    );

    expect(result.description).toBe("Custom description.");
  });

  it("falls back to the document summary when metaDescription is blank", () => {
    const result = resolveSeo(makeDoc(), makeSiteDefaults());

    expect(result.description).toBe("A collaborative whiteboard.");
  });

  it("falls back to the site default when the document has no summary", () => {
    const result = resolveSeo(
      makeDoc({ summary: null }),
      makeSiteDefaults(),
    );

    expect(result.description).toBe("Design engineer portfolio.");
  });
});

describe("resolveSeo — ogImage fallback chain", () => {
  it("passes the seo.ogImage override through the URL builder at fixed dimensions", () => {
    const result = resolveSeo(
      makeDoc({ seo: makeSeo({ ogImage: makeImage("seooverride") }) }),
      makeSiteDefaults(),
    );

    expect(result.ogImage).toContain("seooverride");
    expect(result.ogImage).toMatch(/^https?:\/\//);
    expect(result.ogImage).toContain(`w=${OG_IMAGE_WIDTH}`);
    expect(result.ogImage).toContain(`h=${OG_IMAGE_HEIGHT}`);
    expect(result.ogImage).toContain("fit=crop");
  });

  it("falls back to the document cover image", () => {
    const result = resolveSeo(
      makeDoc({ coverImage: makeImage("covershot") }),
      makeSiteDefaults(),
    );

    expect(result.ogImage).toContain("covershot");
  });

  it("falls back to the site default image", () => {
    const result = resolveSeo(makeDoc(), makeSiteDefaults());

    expect(result.ogImage).toContain("sitedefault");
  });

  it("skips an assetless image object and falls through to the next tier", () => {
    const result = resolveSeo(
      makeDoc({
        seo: makeSeo({ ogImage: { _type: "image" } as Image }),
        coverImage: makeImage("covershot"),
      }),
      makeSiteDefaults(),
    );

    expect(result.ogImage).toContain("covershot");
  });

  it("returns null when no image is available at any tier", () => {
    const result = resolveSeo(
      makeDoc(),
      makeSiteDefaults({ defaultOgImage: null }),
    );

    expect(result.ogImage).toBeNull();
  });
});

describe("resolveSeo — ogImageAlt", () => {
  it("prefers the explicit ogImageAlt", () => {
    const result = resolveSeo(
      makeDoc({ seo: makeSeo({ ogImageAlt: "Two people sketching." }) }),
      makeSiteDefaults(),
    );

    expect(result.ogImageAlt).toBe("Two people sketching.");
  });

  it("falls back to the resolved title", () => {
    const result = resolveSeo(
      makeDoc({ seo: makeSeo({ metaTitle: "Custom Title" }) }),
      makeSiteDefaults(),
    );

    expect(result.ogImageAlt).toBe("Custom Title");
  });
});

describe("resolveSeo — noIndex", () => {
  it("defaults to false when unset", () => {
    expect(resolveSeo(makeDoc(), makeSiteDefaults()).noIndex).toBe(false);
    expect(
      resolveSeo(
        makeDoc({ seo: makeSeo() }),
        makeSiteDefaults(),
      ).noIndex,
    ).toBe(false);
  });

  it("passes through an explicit true", () => {
    const result = resolveSeo(
      makeDoc({ seo: makeSeo({ noIndex: true }) }),
      makeSiteDefaults(),
    );

    expect(result.noIndex).toBe(true);
  });
});

describe("resolveSeo — homepage vs project shape", () => {
  it("resolves a homepage-shaped doc (no summary/slug) to the site defaults", () => {
    const result = resolveSeo(
      { title: "Matt Chan", seo: null },
      makeSiteDefaults(),
    );

    expect(result).toEqual({
      title: "Matt Chan",
      description: "Design engineer portfolio.",
      ogImage: expect.stringContaining("sitedefault"),
      ogImageAlt: "Matt Chan",
      noIndex: false,
    });
  });
});
