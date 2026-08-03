import type { ExperienceEntry } from "@/lib/sanity";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

export function ExperienceItem({ entry }: { entry: ExperienceEntry }) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="font-semibold">{entry.title}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {entry.company}
          </p>
        </div>
        <p className="whitespace-nowrap text-sm text-gray-500">
          {formatDate(entry.startDate)} –{" "}
          {entry.isCurrent ? "Present" : formatDate(entry.endDate!)}
        </p>
      </div>
    </li>
  );
}
