import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProject, getProjects } from "@/lib/sanity";
import { ProjectHeader } from "@/components/ProjectHeader";
import { ProjectStory } from "@/components/ProjectStory";

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
    <main className="site-container section">
      <ProjectHeader project={project} />
      <ProjectStory blocks={project.story} />
    </main>
  );
}
