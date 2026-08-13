import type { About, ExperienceEntry, ProjectForIndex } from "@/lib/sanity";

function formatList(label: string, items?: string[] | null): string | null {
  if (!items || items.length === 0) return null;
  return `${label}: ${items.join(", ")}`;
}

export function templateProjectHeader(project: ProjectForIndex): string {
  return [
    `Title: ${project.title}`,
    `Summary: ${project.summary}`,
    formatList("Tech stack", project.techStack),
    formatList("Skills", project.skills),
    formatList("Impact", project.impact),
    project.dateCompleted ? `Date completed: ${project.dateCompleted}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function templateExperienceHeader(entry: ExperienceEntry): string {
  const dateRange = `${entry.startDate} – ${entry.isCurrent ? "present" : entry.endDate}`;
  return [
    `Company: ${entry.company}`,
    `Title: ${entry.title}`,
    `Dates: ${dateRange}`,
  ].join("\n");
}

export function templateAboutHeader(about: About): string {
  return [`Name: ${about.name}`, `Headline: ${about.headline}`].join("\n");
}
