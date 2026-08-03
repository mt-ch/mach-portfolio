import { client } from "./client";
import { experienceQuery } from "./queries";
import type { ExperienceEntry } from "./types";

export async function getExperience(): Promise<ExperienceEntry[]> {
  const entries = await client.fetch(experienceQuery);
  return entries.map((entry) => ({
    ...entry,
    isCurrent: entry.endDate === null,
  }));
}
