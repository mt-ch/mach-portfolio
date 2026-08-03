import { client } from "./client";
import { projectBySlugQuery, projectsQuery } from "./queries";
import type { ProjectDetail, ProjectListItem } from "./types";

export async function getProjects(): Promise<ProjectListItem[]> {
  return client.fetch(projectsQuery);
}

export async function getProject(
  slug: string,
): Promise<ProjectDetail | null> {
  return client.fetch(projectBySlugQuery, { slug });
}
