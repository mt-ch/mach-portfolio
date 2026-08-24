import Link from "next/link";

import type { FeaturedProjectListItem } from "@/lib/sanity";

import { CoverImage } from "./CoverImage";

export function FeaturedProjectRow({
  project,
}: {
  project: FeaturedProjectListItem;
}) {
  const href = `/projects/${project.slug.current}`;
  const layout = project.coverLayout ?? "left-dominant";
  const isRightDominant = layout === "right-dominant";

  return (
    <Link
      href={href}
      className="inline-flex flex-col gap-md"
      aria-label={`${project.title}: ${project.summary}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-sm aspect-3/2 h-124">
        <div className="relative h-full w-full overflow-hidden lg:hidden">
          <CoverImage image={project.coverMobile} alt="" sizes="100vw" />
        </div>
        {isRightDominant ? (
          <>
            <div className="relative col-span-2 hidden h-full w-full overflow-hidden lg:block">
              <CoverImage
                image={project.coverSecondary}
                alt=""
                sizes="(max-width: 768px) 0vw, 66vw"
              />
            </div>
            <div className="relative hidden h-full w-full overflow-hidden lg:block">
              <CoverImage
                image={project.coverPrimary}
                alt=""
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
                sizes="(max-width: 768px) 0vw, 33vw"
              />
            </div>
            <div className="relative col-span-2 hidden h-full w-full overflow-hidden lg:block">
              <CoverImage
                image={project.coverSecondary}
                alt=""
                sizes="(max-width: 768px) 0vw, 66vw"
              />
            </div>
          </>
        )}
      </div>
      <h2 className="type-body font-medium text-black">
        {project.title}:{" "}
        <span className="text-grey-300">{project.summary}</span>
      </h2>
    </Link>
  );
}
