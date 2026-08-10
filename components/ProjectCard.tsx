import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ProjectListItem } from "@/lib/sanity";

export function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-heading text-lg leading-snug font-medium">
          <Link href={`/projects/${project.slug.current}`}>
            {project.title}
          </Link>
        </h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{project.summary}</p>
        {project.techStack && project.techStack.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <li key={tech}>
                <Badge variant="secondary">{tech}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
