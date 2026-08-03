import type {
  AboutQueryResult,
  ExperienceQueryResult,
  ProjectBySlugQueryResult,
  ProjectsQueryResult,
} from "@/sanity.types";

export type ProjectListItem = ProjectsQueryResult[number];
export type ProjectDetail = NonNullable<ProjectBySlugQueryResult>;

export type ExperienceEntry = ExperienceQueryResult[number] & {
  isCurrent: boolean;
};

export type About = NonNullable<AboutQueryResult>;
