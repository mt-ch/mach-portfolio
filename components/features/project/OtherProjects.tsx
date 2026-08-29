import type { OtherProjectListItem } from "@/lib/sanity";
import { CoverImage } from "@/components/ui/CoverImage";
import { TransitionLink } from "@/components/features/transition/TransitionLink";

export function OtherProjects({ projects }: { projects: OtherProjectListItem[] }) {
  return (
    <div className="lg:px-md flex flex-col gap-md">
      <h2 className="type-subheading font-medium px-md lg:px-0">Other Projects</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md lg:gap-sm">
        {projects.map((project) => (
          <TransitionLink
            key={project._id}
            href={`/projects/${project.slug.current}`}
            className="inline-flex flex-col gap-md"
            aria-label={`${project.title}: ${project.summary}`}
            data-cursor-text="View Project"
            data-cursor-icon="eye"
          >
            <div className="aspect-3/2 h-124 w-full max-w-full">
              <div className="relative h-full w-full overflow-hidden">
                <CoverImage image={project.coverImage} alt="" />
              </div>
            </div>
            <h2 className="type-body font-medium px-md lg:px-0">
              [{project.title}] <span className="text-grey-500 dark:text-grey-400">{project.summary}</span>
            </h2>
          </TransitionLink>
        ))}
      </div>
    </div>
  );
}
