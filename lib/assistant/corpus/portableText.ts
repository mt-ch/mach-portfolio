import { toPlainText } from "@/lib/sanity/portableText";
import type { ContentBlock, ImageContentBlock, PortableTextBlock } from "@/lib/sanity";

export { toPlainText };

function imageBlockText(block: ImageContentBlock): string {
  return [block.caption, block.image?.alt, block.secondImage?.alt]
    .filter((text): text is string => !!text)
    .join(" ");
}

// Flattens a Project Story (Text Block + Image Block array) back into a
// single ordered Portable Text sequence, so the existing heading-split logic
// below can run over it unchanged. Each Text Block's `content` is unwrapped
// in place; a Text Block with an authored `heading` gets a synthetic h2
// block inserted immediately before its content, so splitAtHeadings later
// breaks the story into one chunk per authored section. An Image Block
// folds its caption/alt text in as a plain block at its position,
// contributing nothing when both are empty.
export function flattenStory(story: ContentBlock[] | null | undefined): PortableTextBlock[] {
  if (!story) return [];
  return story.flatMap((block) => {
    if (block._type === "textBlock") {
      if (!block.heading) return block.content;
      const heading: PortableTextBlock = {
        style: "h2",
        children: [{ text: block.heading }],
      };
      return [heading, ...block.content];
    }
    const text = imageBlockText(block);
    return text ? [{ style: "normal" as const, children: [{ text }] }] : [];
  });
}

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
