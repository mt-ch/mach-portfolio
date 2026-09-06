import {
  ContentBlocks,
  hasRenderableBlocks,
} from "@/components/features/content/ContentBlocks";
import type { ProjectDetail } from "@/lib/sanity";

type StoryBlocks = NonNullable<ProjectDetail["story"]>;

// The Project Story is a Content Block array; rendering is delegated to the
// shared ContentBlocks renderer so Project detail pages and other block
// consumers share one path. Renders full-bleed-with-gutter, same as the rest
// of the page — no reading-column max-width.
export function ProjectStory({ blocks }: { blocks: StoryBlocks | null | undefined }) {
  if (!hasRenderableBlocks(blocks)) return null;

  return <ContentBlocks blocks={blocks} />;
}
