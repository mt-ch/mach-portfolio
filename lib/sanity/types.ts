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

type ExperienceQueryRole = NonNullable<
  NonNullable<ExperienceQueryResult[number]["roles"]>[number]
>;

// One stint at a company. `isCurrent` is computed by the fetcher from an
// empty `endDate`; display order follows the array order from the Studio.
export type ExperienceRole = ExperienceQueryRole & {
  isCurrent: boolean;
};

// One Experience document is a company holding one or more Roles.
export type ExperienceEntry = Omit<ExperienceQueryResult[number], "roles"> & {
  roles: ExperienceRole[];
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

// A Content Block is one item in any Content Block array — a Text Block
// (Portable Text) or an Image Block (one or two images with alt text and an
// optional caption). The union is deliberately generic, not Project-specific:
// Project `story` is the current consumer, and it is the intended single type
// for any future Content Block array (e.g. the homepage "How I work" section).
// See sanity/schemaTypes/blocks.
export interface TextContentBlock {
  _type: "textBlock";
  heading?: string;
  content: PortableTextBlock[];
  layout?: "one-column" | "two-column-split" | "two-column-left" | "two-column-right";
}

export interface ImageContentBlock {
  _type: "imageBlock";
  image?: { alt?: string };
  secondImage?: { alt?: string };
  caption?: string;
  layout?: "full" | "inset" | "pair";
}

export type ContentBlock = TextContentBlock | ImageContentBlock;

export interface ProjectForIndex {
  _id: string;
  title: string;
  slug: { current: string };
  summary: string;
  heroText: string | null;
  role: string | null;
  coverImage: SanityImage | null;
  story: ContentBlock[] | null;
  techStack: string[] | null;
  skills: string[] | null;
  impact: string[] | null;
  dateCompleted: string | null;
}
