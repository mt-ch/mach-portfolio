import Link from "next/link";

import { CornerDownRightIcon } from "lucide-react";

import type { ProjectDetail } from "@/lib/sanity";

export function ProjectHeader({ project }: { project: ProjectDetail }) {
  return (
    <header className="p-md bg-grey-400 relative h-124 grid lg:grid-cols-2 w-full">
      <div className="flex flex-col col-start-2 justify-between gap-sm">
        <div className="flex flex-col gap-sm">
          <h1 className="type-subheading font-medium text-white">{project.title}</h1>
          <p className="type-body font-medium text-white">{project.summary}</p>
          {project.role && (
            <div>
              <p className="type-body font-medium text-white">{project.role}</p>
            </div>
          )}
        </div>

        {project.links && project.links.length > 0 && (
          <ul className="gap-md flex flex-wrap">
            {project.links.map((link) => (
              <li key={link._key}>
                <Link href={link.url} target="_blank" rel="noreferrer" className="type-body text-white font-medium flex items-center gap-xs">
                  <CornerDownRightIcon className="size-md" strokeWidth={1.75} />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
