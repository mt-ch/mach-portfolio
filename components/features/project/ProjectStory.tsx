import { ContentBlocks } from "@/components/features/content/ContentBlocks";
import type { ProjectDetail } from "@/lib/sanity";

type StoryBlocks = NonNullable<ProjectDetail["story"]>;

// The Project Story is a Content Block array; rendering is delegated to the
// shared ContentBlocks renderer so Project detail pages and other block
// consumers share one path.
export function ProjectStory({ blocks }: { blocks: StoryBlocks | null | undefined }) {
  return <ContentBlocks blocks={blocks} />;
}
