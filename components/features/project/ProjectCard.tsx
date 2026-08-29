import type { ProjectListItem } from "@/lib/sanity";

import { TransitionLink } from "@/components/features/transition/TransitionLink";

export function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <article className="rounded-md border border-gray-200 p-6 dark:border-gray-800">
      <h3 className="text-lg font-semibold">
        <TransitionLink href={`/projects/${project.slug.current}`}>
          {project.title}
        </TransitionLink>
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {project.summary}
      </p>
      {project.techStack && project.techStack.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {project.techStack.map((tech) => (
            <li
              key={tech}
              className="rounded-full bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800"
            >
              {tech}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
