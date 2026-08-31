import type { ProjectReference as ProjectReferenceData } from "@/lib/assistant/chat/types";

interface ProjectReferenceProps {
  reference: ProjectReferenceData;
}

// Variant B — stacked poster: a full-width 16:9 cover, then title, one-line
// summary, and a "View the project →" affordance. The whole block is one link
// to the Project page. When there's no cover image it degrades to just the
// title, summary, and link.
export function ProjectReference({ reference }: ProjectReferenceProps) {
  const { slug, title, summary, imageUrl } = reference;

  return (
    <a
      href={`/projects/${slug}`}
      data-cursor="link"
      className="group block"
      data-testid="project-reference"
    >
      {imageUrl && (
        // A plain <img>: the src is a pre-sized Sanity CDN URL baked into the
        // chunk metadata at index time, and the card is a small decorative
        // element in the chat drawer, not an LCP candidate.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="aspect-video w-full object-cover"
        />
      )}
      <span className={`flex flex-col gap-2xs${imageUrl ? " mt-sm" : ""}`}>
        <span className="type-small font-medium text-black dark:text-white">
          {title}
        </span>
        {summary && (
          <span className="type-caption text-grey-500 dark:text-grey-400">
            {summary}
          </span>
        )}
        <span className="mt-2xs type-caption font-medium text-brand">
          View the project &rarr;
        </span>
      </span>
    </a>
  );
}
