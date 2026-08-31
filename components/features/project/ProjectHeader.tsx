import Link from "next/link";

import { ArrowUpRightIcon } from "lucide-react";

import type { ProjectDetail } from "@/lib/sanity";

export function ProjectHeader({ project }: { project: ProjectDetail }) {
  return (
    <header className="px-md pt-md relative min-h-124 grid lg:grid-cols-2 w-full">
      <div className="flex flex-col col-start-2 justify-between gap-3xl pt-4xl lg:pt-0">
        <h2 className="type-body font-medium hidden lg:block text-brand">[Work]</h2>
        <div className="flex flex-col gap-2xl">
          <div className="flex flex-col gap-md">
            <h1 className="type-subheading font-medium">{project.title}</h1>
            {project.heroText && <p className="type-body font-medium whitespace-pre-line">{project.heroText}</p>}
            {project.role && (
              <div>
                <p className="type-body font-medium text-grey-500 dark:text-grey-400">{project.role}</p>
              </div>
            )}
          </div>
          {project.links && project.links.length > 0 && (
            <ul className="gap-md flex flex-wrap">
              {project.links.map((link) => (
                <li key={link._key}>
                  <Link
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="type-body font-medium flex items-center gap-md"
                    data-cursor="button"
                  >
                    
                    {link.label}
                    <div
                      className="bg-grey-200 text-grey-700 dark:bg-grey-700 dark:text-grey-200 inline-flex size-10 cursor-pointer items-center justify-center"
                    >
                      <ArrowUpRightIcon className="size-md" strokeWidth={1.75}/>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
