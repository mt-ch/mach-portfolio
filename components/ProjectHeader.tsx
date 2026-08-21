import type { ProjectDetail } from "@/lib/sanity";

export function ProjectHeader({ project }: { project: ProjectDetail }) {
  return (
    <header className="gap-md flex flex-col">
      <h1 className="type-heading font-medium text-black">{project.title}</h1>
      <p className="type-subheading text-grey-300">{project.summary}</p>

      {(project.role || (project.techStack && project.techStack.length > 0)) && (
        <dl className="gap-x-2xl gap-y-sm mt-sm flex flex-wrap">
          {project.role && (
            <div>
              <dt className="type-caption text-grey-300 uppercase">Role</dt>
              <dd className="type-body text-black">{project.role}</dd>
            </div>
          )}
          {project.techStack && project.techStack.length > 0 && (
            <div>
              <dt className="type-caption text-grey-300 uppercase">Tech stack</dt>
              <dd className="type-body text-black">{project.techStack.join(", ")}</dd>
            </div>
          )}
        </dl>
      )}

      {project.links && project.links.length > 0 && (
        <ul className="gap-md mt-sm flex flex-wrap">
          {project.links.map((link) => (
            <li key={link._key}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="type-small text-black underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
