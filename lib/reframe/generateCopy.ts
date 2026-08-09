import Anthropic from "@anthropic-ai/sdk";

import { frameIntent } from "@/lib/guardrails/frame";
import {
  validateCopy,
  type CopyBounds,
  type CopyCandidate,
  type ValidatedCopy,
} from "@/lib/guardrails/validate";
import type { About, ProjectDetail } from "@/lib/sanity";

const MODEL = "claude-haiku-4-5";

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

export interface SelectedProject {
  project: ProjectDetail;
  match_reason: string;
}

export const COPY_BOUNDS: CopyBounds = {
  headline: 80,
  subheadline: 140,
  blurb: 200,
  emphasis: 300,
};

const SYSTEM_PROMPT = [
  "You write portfolio copy tailored to a website visitor's stated intent.",
  "Produce all three surfaces in one pass so the tone stays consistent: a hero, one blurb per selected Project, and a single sentence of About emphasis.",
  "Write in the site owner's voice, grounded in the supplied Projects and About — never invent work, employers, metrics, or technologies that aren't there.",
  "Write a blurb for every selected Project, reusing its exact slug.",
  `Hard length limits, in characters: headline ${COPY_BOUNDS.headline}, subheadline ${COPY_BOUNDS.subheadline}, each blurb ${COPY_BOUNDS.blurb}, About emphasis ${COPY_BOUNDS.emphasis}. Copy over a limit is discarded, so stay well under.`,
].join(" ");

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    hero: {
      type: "object",
      properties: {
        headline: { type: "string" },
        subheadline: { type: "string" },
      },
      required: ["headline", "subheadline"],
      additionalProperties: false,
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          slug: { type: "string" },
          blurb: { type: "string" },
        },
        required: ["slug", "blurb"],
        additionalProperties: false,
      },
    },
    about: {
      type: "object",
      properties: { emphasis: { type: "string" } },
      required: ["emphasis"],
      additionalProperties: false,
    },
  },
  required: ["hero", "projects", "about"],
  additionalProperties: false,
} as const;

type PortableTextBlocks = About["bio"];

// The prompt is plain text, so Portable Text blocks are flattened to their spans.
function toPlainText(blocks: PortableTextBlocks): string {
  if (!blocks) return "";
  return blocks
    .map((block) =>
      (block.children ?? []).map((span) => span.text ?? "").join(""),
    )
    .filter(Boolean)
    .join("\n\n");
}

function toGenerationContext({ project, match_reason }: SelectedProject) {
  return {
    title: project.title,
    slug: project.slug.current,
    summary: project.summary,
    body: toPlainText(project.body as PortableTextBlocks),
    techStack: project.techStack,
    skills: project.skills,
    impact: project.impact,
    role: project.role,
    match_reason,
  };
}

const EMPTY_CANDIDATE: CopyCandidate = {
  hero: null,
  projects: [],
  about: null,
};

function isString(value: unknown): value is string {
  return typeof value === "string";
}

// The model can return a partial or misshapen object; anything that doesn't
// arrive as the expected surface is dropped rather than allowed to throw.
function normalizeCandidate(parsed: unknown): CopyCandidate {
  const raw = (parsed ?? {}) as Record<string, unknown>;
  const hero = (raw.hero ?? {}) as Record<string, unknown>;
  const about = (raw.about ?? {}) as Record<string, unknown>;
  const projects = Array.isArray(raw.projects) ? raw.projects : [];

  return {
    hero:
      isString(hero.headline) && isString(hero.subheadline)
        ? { headline: hero.headline, subheadline: hero.subheadline }
        : null,
    projects: projects
      .map((entry) => (entry ?? {}) as Record<string, unknown>)
      .filter((entry) => isString(entry.slug) && isString(entry.blurb))
      .map((entry) => ({
        slug: entry.slug as string,
        blurb: entry.blurb as string,
      })),
    about: isString(about.emphasis) ? { emphasis: about.emphasis } : null,
  };
}

export async function generateCopy(
  intent: string,
  selected: SelectedProject[],
  about: About,
): Promise<ValidatedCopy> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          frameIntent(intent),
          "Selected Projects (already chosen as most relevant — write a blurb for each):",
          JSON.stringify(selected.map(toGenerationContext)),
          "About:",
          JSON.stringify({
            headline: about.headline,
            bio: toPlainText(about.bio),
          }),
        ].join("\n\n"),
      },
    ],
    output_config: {
      format: { type: "json_schema", schema: OUTPUT_SCHEMA },
    },
  });

  const textBlock = response.content.find(
    (block: { type: string }) => block.type === "text",
  ) as { type: "text"; text: string } | undefined;

  let candidate = EMPTY_CANDIDATE;
  if (textBlock) {
    try {
      candidate = normalizeCandidate(JSON.parse(textBlock.text));
    } catch {
      console.error("generateCopy: failed to parse model output as JSON", {
        stopReason: response.stop_reason,
      });
    }
  }

  const validSlugs = new Set(
    selected.map(({ project }) => project.slug.current),
  );

  return validateCopy(candidate, validSlugs, COPY_BOUNDS);
}
