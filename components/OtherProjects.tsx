import Link from "next/link";

import type { OtherProjectListItem } from "@/lib/sanity";
import { CoverImage } from "@/components/home/CoverImage";

export function OtherProjects({
  projects,
}: {
  projects: OtherProjectListItem[];
}) {
  return (
    <div className="px-md flex flex-col gap-md">
      <h2 className="type-subheading font-medium text-black">
        Other Projects
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md lg:gap-sm">
        {projects.map((project) => (
          <Link
            key={project._id}
            href={`/projects/${project.slug.current}`}
            className="inline-flex flex-col gap-md"
            aria-label={`${project.title}: ${project.summary}`}
          >
            <div className="aspect-3/2 h-124">
              <div className="relative h-full w-full overflow-hidden">
                <CoverImage image={project.coverImage} alt="" />
              </div>
            </div>
            <h2 className="type-body font-medium text-black">
              {project.title}:{" "}
              <span className="text-grey-300">{project.summary}</span>
            </h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
