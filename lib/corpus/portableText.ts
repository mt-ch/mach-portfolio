import { toPlainText } from "@/lib/sanity/portableText";
import type { PortableTextBlock } from "@/lib/sanity";

export { toPlainText };

const HEADING_STYLES = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

function isHeading(block: PortableTextBlock): boolean {
  return !!block.style && HEADING_STYLES.has(block.style);
}

function blockText(block: PortableTextBlock): string {
  return (block.children ?? []).map((span) => span.text ?? "").join("");
}

export interface PortableTextSection {
  heading: string | null;
  text: string;
}

// One chunk per document is the default: if the body has no headings, it's a
// single section. Headings only split further when an author actually uses
// them — no size-driven splitting.
export function splitAtHeadings(
  blocks: PortableTextBlock[] | null | undefined,
): PortableTextSection[] {
  if (!blocks || blocks.length === 0) return [];

  if (!blocks.some(isHeading)) {
    const text = toPlainText(blocks);
    return text ? [{ heading: null, text }] : [];
  }

  const sections: PortableTextSection[] = [];
  let current: { heading: string | null; parts: string[] } = {
    heading: null,
    parts: [],
  };

  for (const block of blocks) {
    if (isHeading(block)) {
      sections.push({ heading: current.heading, text: current.parts.join("\n\n") });
      current = { heading: blockText(block), parts: [] };
      continue;
    }
    const text = blockText(block);
    if (text) current.parts.push(text);
  }
  sections.push({ heading: current.heading, text: current.parts.join("\n\n") });

  return sections.filter((section) => section.heading || section.text);
}
