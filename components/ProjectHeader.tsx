import Link from "next/link";

import { CornerDownRightIcon } from "lucide-react";

import type { ProjectDetail } from "@/lib/sanity";

export function ProjectHeader({ project }: { project: ProjectDetail }) {
  const backgroundColor = project.headerBackgroundColor?.hex;
  const foregroundColor = project.headerForegroundColor?.hex;
  const hasCustomColors = Boolean(backgroundColor && foregroundColor);

  return (
    <header
      className={`px-md pt-md relative min-h-124 grid lg:grid-cols-2 w-full${hasCustomColors ? "" : " bg-grey-400 text-white"}`}
      style={hasCustomColors ? { backgroundColor, color: foregroundColor } : undefined}
    >
      <div className="flex flex-col col-start-2 justify-between gap-2xl pt-4xl lg:pt-0">
        <h2 className="type-body font-medium hidden lg:block">(Work)</h2>
        <div className="flex flex-col gap-2xl">
          <div className="flex flex-col gap-md">
            <h1 className="type-subheading font-medium">{project.title}</h1>
            {project.heroText && <p className="type-body font-normal whitespace-pre-line">{project.heroText}</p>}
            {project.role && (
              <div>
                <p className="type-body font-normal text-grey-300">{project.role}</p>
              </div>
            )}
          </div>
          {project.links && project.links.length > 0 && (
            <ul className="gap-md flex flex-wrap">
              {project.links.map((link) => (
                <li key={link._key}>
                  <Link href={link.url} target="_blank" rel="noreferrer" className="type-body font-medium flex items-center gap-xs">
                    <CornerDownRightIcon className="size-md" strokeWidth={1.75} />
                    {link.label}
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
