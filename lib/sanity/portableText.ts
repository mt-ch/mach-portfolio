import type { PortableTextBlock } from "./types";

// Flattens Portable Text blocks (About.bio, Project.body, Experience.summary
// all share this shape) down to plain text, joining blocks with blank lines.
export function toPlainText(
  blocks: PortableTextBlock[] | null | undefined,
): string {
  if (!blocks) return "";
  return blocks
    .map((block) => (block.children ?? []).map((span) => span.text ?? "").join(""))
    .filter(Boolean)
    .join("\n\n");
}
