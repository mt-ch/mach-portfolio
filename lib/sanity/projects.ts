import { client, freshClient } from "./client";
import {
  featuredProjectsQuery,
  otherProjectsQuery,
  projectBySlugQuery,
  projectForIndexByIdQuery,
  projectsForIndexQuery,
  projectsForSitemapQuery,
  projectsQuery,
} from "./queries";
import type {
  FeaturedProjectListItem,
  OtherProjectListItem,
  ProjectDetail,
  ProjectForIndex,
  ProjectListItem,
  ProjectSitemapItem,
} from "./types";

export async function getFeaturedProjects(): Promise<FeaturedProjectListItem[]> {
  return client.fetch(featuredProjectsQuery);
}

export async function getProjects(): Promise<ProjectListItem[]> {
  return client.fetch(projectsQuery);
}

export async function getProject(
  slug: string,
): Promise<ProjectDetail | null> {
  return client.fetch(projectBySlugQuery, { slug });
}

export async function getOtherProjects(
  currentId: string,
): Promise<OtherProjectListItem[]> {
  return client.fetch(otherProjectsQuery, { currentId });
}

export async function getProjectsForSitemap(): Promise<ProjectSitemapItem[]> {
  return client.fetch(projectsForSitemapQuery);
}

export async function getProjectsForIndex(): Promise<ProjectForIndex[]> {
  return client.fetch<ProjectForIndex[]>(projectsForIndexQuery);
}

export async function getProjectForIndexById(
  id: string,
): Promise<ProjectForIndex | null> {
  return freshClient.fetch<ProjectForIndex | null>(projectForIndexByIdQuery, {
    id,
  });
}
