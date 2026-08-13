import { client } from "./client";
import {
  projectBySlugQuery,
  projectsForIndexQuery,
  projectsQuery,
} from "./queries";
import type { ProjectDetail, ProjectForIndex, ProjectListItem } from "./types";

export async function getProjects(): Promise<ProjectListItem[]> {
  return client.fetch(projectsQuery);
}

export async function getProject(
  slug: string,
): Promise<ProjectDetail | null> {
  return client.fetch(projectBySlugQuery, { slug });
}

export async function getProjectsForIndex(): Promise<ProjectForIndex[]> {
  return client.fetch<ProjectForIndex[]>(projectsForIndexQuery);
}
