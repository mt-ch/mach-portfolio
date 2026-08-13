import { client, freshClient } from "./client";
import { experienceEntryByIdQuery, experienceQuery } from "./queries";
import type { ExperienceEntry } from "./types";

export async function getExperience(): Promise<ExperienceEntry[]> {
  const entries = await client.fetch(experienceQuery);
  return entries.map((entry) => ({
    ...entry,
    isCurrent: entry.endDate === null,
  }));
}

export async function getExperienceEntryById(
  id: string,
): Promise<ExperienceEntry | null> {
  const entry = await freshClient.fetch(experienceEntryByIdQuery, { id });
  if (!entry) return null;
  return { ...entry, isCurrent: entry.endDate === null };
}
