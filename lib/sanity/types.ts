import type {
  AboutQueryResult,
  ExperienceQueryResult,
  FeaturedProjectsQueryResult,
  ProjectBySlugQueryResult,
  ProjectsQueryResult,
} from "@/sanity.types";

export type ProjectListItem = ProjectsQueryResult[number];
export type FeaturedProjectListItem = FeaturedProjectsQueryResult[number];
export type ProjectDetail = NonNullable<ProjectBySlugQueryResult>;

export type ExperienceEntry = ExperienceQueryResult[number] & {
  isCurrent: boolean;
};

export type About = NonNullable<AboutQueryResult>;

// Portable Text block shape shared by About.bio, Project.body, and
// Experience.summary. Typed by hand (rather than via sanity.types.ts) since
// projectsForIndexQuery has no generated type — typegen requires a live
// Sanity project connection this repo's local/CI environments don't have.
export interface PortableTextBlock {
  style?: "blockquote" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "normal";
  children?: Array<{ text?: string }>;
}

export interface ProjectForIndex {
  _id: string;
  title: string;
  slug: { current: string };
  summary: string;
  body: PortableTextBlock[] | null;
  techStack: string[] | null;
  skills: string[] | null;
  impact: string[] | null;
  dateCompleted: string | null;
}
