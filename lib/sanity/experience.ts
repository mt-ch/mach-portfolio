import type { ExperienceQueryResult } from "@/sanity.types";

import { client, freshClient } from "./client";
import { experienceEntryByIdQuery, experienceQuery } from "./queries";
import type { ExperienceEntry } from "./types";

type RawExperienceEntry = ExperienceQueryResult[number];

// A role is current when it has no end date. Company-level fields carry over
// unchanged; only the per-role `isCurrent` flag is computed here.
function withComputedRoles(entry: RawExperienceEntry): ExperienceEntry {
  return {
    ...entry,
    roles: (entry.roles ?? []).map((role) => ({
      ...role,
      isCurrent: role.endDate === null,
    })),
  };
}

export async function getExperience(): Promise<ExperienceEntry[]> {
  const entries = await client.fetch(experienceQuery);
  return entries.map(withComputedRoles);
}

export async function getExperienceEntryById(
  id: string,
): Promise<ExperienceEntry | null> {
  const entry = await freshClient.fetch(experienceEntryByIdQuery, { id });
  if (!entry) return null;
  return withComputedRoles(entry);
}
