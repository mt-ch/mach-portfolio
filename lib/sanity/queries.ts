import { defineQuery } from "groq";

// Attaches the Sanity image asset's low-quality placeholder and intrinsic
// dimensions to an image projection, so render paths can add blur-up
// placeholders and layout-shift-free sizing. `asset` (the reference) is left
// untouched so `urlFor` keeps working. Inlined per query rather than shared as
// an interpolated fragment because `sanity typegen` resolves the projection
// only when it appears literally inside `defineQuery`.
//   <image field> {
//     ...,
//     "metadata": asset->metadata { lqip, dimensions }
//   }

export const featuredProjectsQuery = defineQuery(`
  *[_type == "project" && featured == true] | order(order asc) {
    _id,
    title,
    slug,
    summary,
    coverPrimary {
      ...,
      "metadata": asset->metadata { lqip, dimensions }
    },
    coverSecondary {
      ...,
      "metadata": asset->metadata { lqip, dimensions }
    },
    coverMobile {
      ...,
      "metadata": asset->metadata { lqip, dimensions }
    },
    coverLayout,
    order
  }
`);

export const projectsQuery = defineQuery(`
  *[_type == "project"] | order(order asc) {
    _id,
    title,
    slug,
    summary,
    coverImage,
    techStack,
    skills,
    impact,
    role,
    links,
    featured,
    order,
    dateCompleted
  }
`);

export const otherProjectsQuery = defineQuery(`
  *[_type == "project" && _id != $currentId] | order(order asc) [0...2] {
    _id,
    title,
    slug,
    summary,
    coverImage {
      ...,
      "metadata": asset->metadata { lqip, dimensions }
    },
    order
  }
`);

export const projectBySlugQuery = defineQuery(`
  *[_type == "project" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    summary,
    heroText,
    headerBackgroundColor,
    headerForegroundColor,
    story[] {
      ...,
      _type == "imageBlock" => {
        ...,
        image {
          ...,
          "metadata": asset->metadata { lqip, dimensions }
        },
        secondImage {
          ...,
          "metadata": asset->metadata { lqip, dimensions }
        }
      }
    },
    coverImage {
      ...,
      "metadata": asset->metadata { lqip, dimensions }
    },
    techStack,
    skills,
    impact,
    role,
    links,
    featured,
    order,
    dateCompleted,
    seo {
      metaTitle,
      metaDescription,
      ogImage,
      ogImageAlt,
      noIndex
    }
  }
`);

// Unlike projectsQuery (used for the listing page), this includes `story` —
// needed by the corpus indexing pipeline but wasted weight on the listing.
export const projectsForIndexQuery = defineQuery(`
  *[_type == "project"] {
    _id,
    title,
    slug,
    summary,
    heroText,
    role,
    coverImage,
    story,
    techStack,
    skills,
    impact,
    dateCompleted
  }
`);

// Minimal projection for app/sitemap.ts: just what buildSitemapEntries needs
// to emit (or skip) a URL. Ordered so the sitemap lists projects in the same
// order the site does.
export const projectsForSitemapQuery = defineQuery(`
  *[_type == "project"] | order(order asc) {
    _id,
    slug,
    _updatedAt,
    seo {
      noIndex
    }
  }
`);

// Unlike projectsForIndexQuery (used for a full backfill), this fetches a
// single project by id — needed by the reindex webhook to refetch just the
// document that was published/deleted.
export const projectForIndexByIdQuery = defineQuery(`
  *[_type == "project" && _id == $id][0] {
    _id,
    title,
    slug,
    summary,
    heroText,
    role,
    coverImage,
    story,
    techStack,
    skills,
    impact,
    dateCompleted
  }
`);

export const experienceQuery = defineQuery(`
  *[_type == "experience"] | order(order asc) {
    _id,
    company,
    companyUrl,
    logo,
    order,
    roles[] {
      _key,
      title,
      startDate,
      endDate,
      summary
    }
  }
`);

export const experienceEntryByIdQuery = defineQuery(`
  *[_type == "experience" && _id == $id][0] {
    _id,
    company,
    companyUrl,
    logo,
    order,
    roles[] {
      _key,
      title,
      startDate,
      endDate,
      summary
    }
  }
`);

export const knowledgeEntryByIdQuery = defineQuery(`
  *[_type == "knowledgeBaseEntry" && _id == $id][0] {
    _id,
    title,
    body,
    tags
  }
`);

export const knowledgeEntriesForIndexQuery = defineQuery(`
  *[_type == "knowledgeBaseEntry"] {
    _id,
    title,
    body,
    tags
  }
`);

// The homepage has no document of its own; app/sitemap.ts dates its entry
// from the `about` singleton's last-edited time.
export const aboutForSitemapQuery = defineQuery(`
  *[_type == "about"][0] {
    _updatedAt
  }
`);

export const aboutQuery = defineQuery(`
  *[_type == "about"][0] {
    _id,
    name,
    headline,
    bio,
    whatIDo[] {
      _key,
      title,
      description
    },
    logo,
    footerText,
    "resumeUrl": resumeFile.asset->url,
    email,
    socialLinks,
    howIWork[] {
      ...,
      _type == "imageBlock" => {
        ...,
        image {
          ...,
          "metadata": asset->metadata { lqip, dimensions }
        },
        secondImage {
          ...,
          "metadata": asset->metadata { lqip, dimensions }
        }
      }
    },
    seo {
      metaTitle,
      metaDescription,
      ogImage,
      ogImageAlt,
      noIndex
    },
    siteName,
    titleTemplate,
    defaultMetaDescription,
    defaultOgImage
  }
`);
