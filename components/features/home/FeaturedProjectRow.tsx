import Link from "next/link";

import type { FeaturedProjectListItem } from "@/lib/sanity";

import { CoverImage } from "@/components/ui/CoverImage";

export function FeaturedProjectRow({ project }: { project: FeaturedProjectListItem }) {
  const href = `/projects/${project.slug.current}`;
  const layout = project.coverLayout ?? "left-dominant";
  const isRightDominant = layout === "right-dominant";

  return (
    <Link
      href={href}
      className="inline-flex flex-col gap-md"
      aria-label={`${project.title}: ${project.summary}`}
      data-cursor-text="View Project"
      data-cursor-icon="eye"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-sm aspect-3/2 h-124 w-full max-w-full">
        <div className="relative h-full w-full overflow-hidden lg:hidden">
          <CoverImage image={project.coverMobile} alt="" sizes="100vw" />
        </div>
        {isRightDominant ? (
          <>
            <div className="relative col-span-2 hidden h-full w-full overflow-hidden lg:block">
              <CoverImage image={project.coverSecondary} alt="" sizes="(max-width: 768px) 0vw, 66vw" />
            </div>
            <div className="relative hidden h-full w-full overflow-hidden lg:block">
              <CoverImage image={project.coverPrimary} alt="" sizes="(max-width: 768px) 0vw, 33vw" />
            </div>
          </>
        ) : (
          <>
            <div className="relative hidden h-full w-full overflow-hidden lg:block">
              <CoverImage image={project.coverPrimary} alt="" sizes="(max-width: 768px) 0vw, 33vw" />
            </div>
            <div className="relative col-span-2 hidden h-full w-full overflow-hidden lg:block">
              <CoverImage image={project.coverSecondary} alt="" sizes="(max-width: 768px) 0vw, 66vw" />
            </div>
          </>
        )}
      </div>
      <h2 className="type-body font-medium px-md lg:px-0">
        [{project.title}] <span className="text-grey-500 dark:text-grey-400">{project.summary}</span>
      </h2>
    </Link>
  );
}
