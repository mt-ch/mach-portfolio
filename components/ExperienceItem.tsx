import type { ExperienceEntry } from "@/lib/sanity";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

export function ExperienceItem({ entry }: { entry: ExperienceEntry }) {
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="font-semibold">{entry.title}</p>
          <p className="text-sm text-muted-foreground">{entry.company}</p>
        </div>
        <p className="whitespace-nowrap text-sm text-muted-foreground">
          {formatDate(entry.startDate)} –{" "}
          {entry.isCurrent ? "Present" : formatDate(entry.endDate!)}
        </p>
      </div>
    </li>
  );
}
