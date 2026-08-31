import type { About, ExperienceEntry, ProjectForIndex } from "@/lib/sanity";
import { toPlainText } from "@/lib/sanity/portableText";

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

// One Experience document is a company with one or more roles. Every role is
// emitted under the same company heading so company context attaches to each
// role in the single corpus entry.
export function templateExperienceHeader(entry: ExperienceEntry): string {
  const lines: string[] = [`Company: ${entry.company}`];
  if (entry.companyUrl) lines.push(`Company URL: ${entry.companyUrl}`);

  for (const role of entry.roles) {
    const dateRange = `${role.startDate} – ${role.isCurrent ? "present" : role.endDate}`;
    lines.push("", `Role: ${role.title}`, `Dates: ${dateRange}`);
    const summary = toPlainText(role.summary).trim();
    if (summary) lines.push(summary);
  }

  return lines.join("\n");
}

export function templateAboutHeader(about: About): string {
  return [`Name: ${about.name}`, `Headline: ${about.headline}`].join("\n");
}
