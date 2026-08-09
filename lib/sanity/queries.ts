import { defineQuery } from "groq";

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

export const projectBySlugQuery = defineQuery(`
  *[_type == "project" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    summary,
    body,
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

export const experienceQuery = defineQuery(`
  *[_type == "experience"] | order(order asc) {
    _id,
    company,
    title,
    startDate,
    endDate,
    summary,
    logo,
    order
  }
`);

export const aboutQuery = defineQuery(`
  *[_type == "about"][0] {
    _id,
    name,
    headline,
    bio,
    "resumeUrl": resumeFile.asset->url,
    email,
    socialLinks
  }
`);
