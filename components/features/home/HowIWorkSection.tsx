import {
  ContentBlocks,
  hasRenderableBlocks,
} from "@/components/features/content/ContentBlocks";
import { HomeSection } from "@/components/features/home/HomeSection";
import type { About } from "@/lib/sanity";

// The homepage "How I work" section: a Content Block array on the About
// document, rendered through the shared ContentBlocks path inside the standard
// HomeSection shell. An empty or absent `howIWork` leaves no section on the
// page.
export function HowIWorkSection({ about }: { about: About }) {
  if (!hasRenderableBlocks(about.howIWork)) {
    return null;
  }

  return (
    <div className="mb-3xl pb-3xl">
      <HomeSection title="How I work">
        <ContentBlocks blocks={about.howIWork} />
      </HomeSection>
    </div>
  );
}
