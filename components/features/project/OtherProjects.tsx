import type { OtherProjectListItem } from "@/lib/sanity";
import { CoverImage } from "@/components/ui/CoverImage";
import { TransitionLink } from "@/components/features/transition/TransitionLink";

export function OtherProjects({
  projects,
}: {
  projects: OtherProjectListItem[];
}) {
  return (
    <div className="gap-md mt-3xl flex flex-col">
      <h2 className="type-subheading px-md font-medium lg:px-0">
        Other Projects
      </h2>
      <div className="gap-md lg:gap-sm grid grid-cols-1 lg:grid-cols-2">
        {projects.map((project) => (
          <TransitionLink
            key={project._id}
            href={`/projects/${project.slug.current}`}
            className="gap-md inline-flex flex-col"
            aria-label={`${project.title}: ${project.summary}`}
            data-cursor="label"
            data-cursor-label="View Project"
            data-cursor-icon="eye"
          >
            <div className="aspect-3/2 h-124 w-full max-w-full">
              <div className="relative h-full w-full overflow-hidden">
                <CoverImage image={project.coverImage} alt="" />
              </div>
            </div>
            <h2 className="type-body px-md font-medium lg:px-0">
              [{project.title}]{" "}
              <span className="text-grey-500 dark:text-grey-400">
                {project.summary}
              </span>
            </h2>
          </TransitionLink>
        ))}
      </div>
    </div>
  );
}
