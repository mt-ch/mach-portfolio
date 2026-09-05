import type { FeaturedProjectListItem } from "@/lib/sanity";

import { CoverImage } from "@/components/ui/CoverImage";
import { TransitionLink } from "@/components/features/transition/TransitionLink";

export function FeaturedProjectRow({
  project,
  priority = false,
}: {
  project: FeaturedProjectListItem;
  /** Load-priority hint for the first row's cover, the probable LCP image. */
  priority?: boolean;
}) {
  const href = `/projects/${project.slug.current}`;
  const layout = project.coverLayout ?? "left-dominant";
  const isRightDominant = layout === "right-dominant";

  return (
    <TransitionLink
      href={href}
      className="inline-flex flex-col gap-md"
      aria-label={`${project.title}: ${project.summary}`}
      data-cursor="label"
      data-cursor-label="View Project"
      data-cursor-icon="eye"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-sm aspect-4/3 lg:aspect-3/2 w-full max-w-full">
        <div className="relative h-full w-full overflow-hidden lg:hidden">
          <CoverImage
            image={project.coverMobile}
            alt=""
            ratio="4:3"
            sizes="100vw"
            priority={priority}
          />
        </div>
        {isRightDominant ? (
          <>
            <div className="relative col-span-2 hidden h-full w-full overflow-hidden lg:block">
              <CoverImage
                image={project.coverSecondary}
                alt=""
                ratio="3:2"
                sizes="(max-width: 768px) 0vw, 66vw"
                priority={priority}
              />
            </div>
            <div className="relative hidden h-full w-full overflow-hidden lg:block">
              <CoverImage
                image={project.coverPrimary}
                alt=""
                ratio="3:2"
                sizes="(max-width: 768px) 0vw, 33vw"
              />
            </div>
          </>
        ) : (
          <>
            <div className="relative hidden h-full w-full overflow-hidden lg:block">
              <CoverImage
                image={project.coverPrimary}
                alt=""
                ratio="3:2"
                sizes="(max-width: 768px) 0vw, 33vw"
              />
            </div>
            <div className="relative col-span-2 hidden h-full w-full overflow-hidden lg:block">
              <CoverImage
                image={project.coverSecondary}
                alt=""
                ratio="3:2"
                sizes="(max-width: 768px) 0vw, 66vw"
                priority={priority}
              />
            </div>
          </>
        )}
      </div>
      <h2 className="type-body font-medium px-md lg:px-0">
        [{project.title}] <span className="text-grey-500 dark:text-grey-400">{project.summary}</span>
      </h2>
    </TransitionLink>
  );
}
