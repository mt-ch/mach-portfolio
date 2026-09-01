import Link from "next/link";

import { ArrowUpRightIcon } from "lucide-react";

import type { ProjectDetail } from "@/lib/sanity";

export function ProjectHeader({ project }: { project: ProjectDetail }) {
  return (
    <header className="px-md pt-md relative grid min-h-124 w-full lg:grid-cols-2">
      <div className="gap-3xl pt-4xl col-start-2 flex flex-col justify-between lg:pt-0">
        <h2 className="type-body text-brand hidden font-medium lg:block">
          [Work]
        </h2>
        <div className="gap-2xl flex flex-col">
          <div className="gap-md flex flex-col">
            <h1 className="type-subheading font-medium">{project.title}</h1>
            {project.heroText && (
              <p className="type-body font-normal whitespace-pre-line">
                {project.heroText}
              </p>
            )}
            {project.role && (
              <div>
                <p className="type-body text-grey-500 dark:text-grey-400 font-normal">
                  {project.role}
                </p>
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
                    className="type-body gap-sm flex items-center font-medium"
                    data-cursor="button"
                  >
                    {link.label}
                    <div className="bg-grey-200 text-grey-700 dark:bg-grey-700 dark:text-grey-200 inline-flex size-10 cursor-pointer items-center justify-center">
                      <ArrowUpRightIcon
                        className="size-md"
                        strokeWidth={1.75}
                      />
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
