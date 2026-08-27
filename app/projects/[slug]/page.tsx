import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAbout, getOtherProjects, getProject, getProjects } from "@/lib/sanity";
import { OtherProjects } from "@/components/features/project/OtherProjects";
import { ProjectHeader } from "@/components/features/project/ProjectHeader";
import { ProjectStory } from "@/components/features/project/ProjectStory";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug.current }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    return {};
  }

  return { title: project.title, description: project.summary };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const [about, project] = await Promise.all([getAbout(), getProject(slug)]);

  if (!about || !project) {
    notFound();
  }

  const otherProjects = await getOtherProjects(project._id);

  return (
    <main className="relative text-foreground">
      <div className="bg-background">
        <SiteNav about={about} />
        <ProjectHeader project={project} />
        <div className="flex flex-col gap-2xl py-2xl">
          <ProjectStory blocks={project.story} />
          <OtherProjects projects={otherProjects} />
        </div>
      </div>
      <SiteFooter about={about} />
    </main>
  );
}
