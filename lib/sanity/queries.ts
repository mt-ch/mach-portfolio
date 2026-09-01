import { defineQuery } from "groq";

export const featuredProjectsQuery = defineQuery(`
  *[_type == "project" && featured == true] | order(order asc) {
    _id,
    title,
    slug,
    summary,
    coverPrimary,
    coverSecondary,
    coverMobile,
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
    coverImage,
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
    story,
    coverImage,
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
    howIWork,
    siteName,
    titleTemplate,
    defaultMetaDescription,
    defaultOgImage
  }
`);
