import type { ExperienceEntry } from "@/lib/sanity";

import { ExperienceItem } from "./ExperienceItem";

export function ExperienceList({ entries }: { entries: ExperienceEntry[] }) {
  return (
    <section aria-labelledby="experience-heading">
      <h2 id="experience-heading" className="text-2xl font-bold tracking-tight">
        Experience
      </h2>
      <ul className="mt-6 divide-y divide-border">
        {entries.map((entry) => (
          <ExperienceItem key={entry._id} entry={entry} />
        ))}
      </ul>
    </section>
  );
}
