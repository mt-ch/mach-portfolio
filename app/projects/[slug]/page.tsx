import { PortableText } from "@portabletext/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProject, getProjects } from "@/lib/sanity";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug.current }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    return {};
  }

  return { title: project.title, description: project.summary };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
      <p className="mt-2 text-lg text-muted-foreground">{project.summary}</p>

      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
        {project.role && (
          <div>
            <dt className="font-semibold">Role</dt>
            <dd className="text-muted-foreground">{project.role}</dd>
          </div>
        )}
        {project.techStack && project.techStack.length > 0 && (
          <div>
            <dt className="font-semibold">Tech stack</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </dd>
          </div>
        )}
      </dl>

      {project.links && project.links.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {project.links.map((link) => (
            <Button
              key={link._key}
              variant="outline"
              size="sm"
              render={<a href={link.url} target="_blank" rel="noreferrer" />}
            >
              {link.label}
            </Button>
          ))}
        </div>
      )}

      {project.body && (
        <div className="prose mt-10 dark:prose-invert">
          <PortableText value={project.body} />
        </div>
      )}
    </main>
  );
}
