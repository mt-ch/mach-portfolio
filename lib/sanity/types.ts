import type { Image as SanityImage } from "sanity";

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

// Hand-typed (rather than via sanity.types.ts) since typegen requires a live
// Sanity project connection this repo's local/CI environments don't have.
export interface OtherProjectListItem {
  _id: string;
  title: string;
  slug: { current: string };
  summary: string;
  coverImage: SanityImage | null;
  order: number | null;
}

export type ExperienceEntry = ExperienceQueryResult[number] & {
  isCurrent: boolean;
};

export type About = NonNullable<AboutQueryResult>;

// Portable Text block shape shared by About.bio, Project story Text Blocks,
// and Experience.summary. Typed by hand (rather than via sanity.types.ts)
// since projectsForIndexQuery has no generated type — typegen requires a live
// Sanity project connection this repo's local/CI environments don't have.
export interface PortableTextBlock {
  style?: "blockquote" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "normal";
  children?: Array<{ text?: string }>;
}

// A Project Story is a reorderable array of generic Content Blocks — Text
// Block (Portable Text) and Image Block (one or two images with alt text and
// an optional caption). See sanity/schemaTypes/blocks.
export interface TextStoryBlock {
  _type: "textBlock";
  content: PortableTextBlock[];
}

export interface ImageStoryBlock {
  _type: "imageBlock";
  image?: { alt?: string };
  secondImage?: { alt?: string };
  caption?: string;
  layout?: "full" | "inset" | "pair";
}

export type StoryBlock = TextStoryBlock | ImageStoryBlock;

export interface ProjectForIndex {
  _id: string;
  title: string;
  slug: { current: string };
  summary: string;
  story: StoryBlock[] | null;
  techStack: string[] | null;
  skills: string[] | null;
  impact: string[] | null;
  dateCompleted: string | null;
}
