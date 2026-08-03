import type { ProjectListItem } from "@/lib/sanity";

import { ProjectCard } from "./ProjectCard";

export function FeaturedProjects({
  projects,
}: {
  projects: ProjectListItem[];
}) {
  const featured = projects.filter((project) => project.featured);

  if (featured.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="featured-projects-heading">
      <h2 id="featured-projects-heading" className="text-2xl font-bold">
        Featured Projects
      </h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {featured.map((project) => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </div>
    </section>
  );
}
