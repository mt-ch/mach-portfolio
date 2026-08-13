import { client } from "./client";
import {
  projectBySlugQuery,
  projectForIndexByIdQuery,
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

export async function getProjectForIndexById(
  id: string,
): Promise<ProjectForIndex | null> {
  return client.fetch<ProjectForIndex | null>(projectForIndexByIdQuery, { id });
}
