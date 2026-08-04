import Anthropic from "@anthropic-ai/sdk";

import { frameIntent } from "@/lib/guardrails/frame";
import { validateSelection, type SelectionEntry } from "@/lib/guardrails/validate";
import type { ProjectListItem } from "@/lib/sanity";

const MODEL = "claude-haiku-4-5";

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

interface LightweightProject {
  title: string;
  slug: string;
  summary: string;
  techStack: string[] | null;
  skills: string[] | null;
  impact: string[] | null;
  role: string | null;
  featured: boolean | null;
  order: number;
  dateCompleted: string | null;
}

function toLightweightProject(project: ProjectListItem): LightweightProject {
  return {
    title: project.title,
    slug: project.slug.current,
    summary: project.summary,
    techStack: project.techStack,
    skills: project.skills,
    impact: project.impact,
    role: project.role,
    featured: project.featured,
    order: project.order,
    dateCompleted: project.dateCompleted,
  };
}

const SYSTEM_PROMPT = [
  "You select which Projects from a portfolio are most relevant to a website visitor's stated intent.",
  "Return 3 to 6 entries, ordered most to least relevant, each with the Project's exact slug and a one-sentence match_reason.",
  "Only use slugs from the provided Project list.",
].join(" ");

export async function selectProjects(
  intent: string,
  projects: ProjectListItem[],
): Promise<SelectionEntry[]> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          frameIntent(intent),
          "Projects:",
          JSON.stringify(projects.map(toLightweightProject)),
        ].join("\n\n"),
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            selected: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  slug: { type: "string" },
                  match_reason: { type: "string" },
                },
                required: ["slug", "match_reason"],
                additionalProperties: false,
              },
            },
          },
          required: ["selected"],
          additionalProperties: false,
        },
      },
    },
  });

  const textBlock = response.content.find(
    (block: { type: string }) => block.type === "text",
  ) as { type: "text"; text: string } | undefined;

  const candidate = textBlock
    ? (JSON.parse(textBlock.text) as { selected: SelectionEntry[] })
    : { selected: [] };

  const validSlugs = new Set(projects.map((project) => project.slug.current));
  return validateSelection(candidate, validSlugs).slice(0, 6);
}
