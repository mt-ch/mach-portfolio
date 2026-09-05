import {
  ContentBlocks,
  hasRenderableBlocks,
} from "@/components/features/content/ContentBlocks";
import type { ProjectDetail } from "@/lib/sanity";

type StoryBlocks = NonNullable<ProjectDetail["story"]>;

// The Project Story is a Content Block array; rendering is delegated to the
// shared ContentBlocks renderer so Project detail pages and other block
// consumers share one path. The Story is bounded to a reading column
// (--layout-story-max-width) and centred here rather than inside the shared
// renderer, so the homepage "How I work" section stays full-width.
export function ProjectStory({ blocks }: { blocks: StoryBlocks | null | undefined }) {
  if (!hasRenderableBlocks(blocks)) return null;

  return (
    <div className="mx-auto w-full max-w-story">
      <ContentBlocks blocks={blocks} />
    </div>
  );
}
