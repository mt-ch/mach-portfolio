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

// As of this ticket, Sanity's About.email is still the seed value
// "hello@test.com" (checked directly against the production dataset).
// Templating a fake address into model-visible text is a correctness bug,
// so known placeholder domains are guarded out here. This is a targeted
// guard against the current known placeholder, not exhaustive detection of
// every possible future placeholder — it self-clears once a real address
// (any domain outside this list) is published, no code change needed.
const PLACEHOLDER_EMAIL_DOMAINS = ["test.com", "example.com"];

function isPlaceholderEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain !== undefined && PLACEHOLDER_EMAIL_DOMAINS.includes(domain);
}

function findLinkedInUrl(socialLinks?: About["socialLinks"]): string | null {
  return socialLinks?.find((link) => link.platform.toLowerCase() === "linkedin")?.url ?? null;
}

export function templateAboutHeader(about: About): string {
  const linkedInUrl = findLinkedInUrl(about.socialLinks);

  return [
    `Name: ${about.name}`,
    `Headline: ${about.headline}`,
    about.email && !isPlaceholderEmail(about.email) ? `Email: ${about.email}` : null,
    linkedInUrl ? `LinkedIn: ${linkedInUrl}` : null,
    about.resumeUrl ? `Résumé: ${about.resumeUrl}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}
