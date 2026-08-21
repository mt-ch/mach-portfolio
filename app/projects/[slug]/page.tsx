import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAbout, getProject, getProjects } from "@/lib/sanity";
import { ProjectHeader } from "@/components/ProjectHeader";
import { ProjectStory } from "@/components/ProjectStory";
import { SiteNav } from "@/components/home/SiteNav";
import { SiteFooter } from "@/components/home/SiteFooter";

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

  return (
    <main className="relative">
      <SiteNav about={about} />
      <ProjectHeader project={project} />
      <div className="flex flex-col gap-xl py-md">
        <ProjectStory blocks={project.story} />
        {/* Other Projects */}
        <div className="px-md flex flex-col gap-md">
          <h2 className="type-subheading font-medium text-black">Other Projects</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-sm">
            {/* Project */}
            <div className="inline-flex flex-col gap-md" aria-label={`${project.title}: ${project.summary}`}>
              <div className="aspect-3/2 h-124">
                <div className="relative h-full w-full overflow-hidden bg-grey-200"></div>
              </div>
              <h2 className="type-body font-medium text-black">
                {project.title}: <span className="text-grey-200">{project.summary}</span>
              </h2>
            </div>
            {/* Project */}
            <div className="inline-flex flex-col gap-md" aria-label={`${project.title}: ${project.summary}`}>
              <div className="aspect-3/2 h-124">
                <div className="relative h-full w-full overflow-hidden bg-grey-200"></div>
              </div>
              <h2 className="type-body font-medium text-black">
                {project.title}: <span className="text-grey-200">{project.summary}</span>
              </h2>
            </div>
            {/* Project */}
            <div className="inline-flex flex-col gap-md" aria-label={`${project.title}: ${project.summary}`}>
              <div className="aspect-3/2 h-124">
                <div className="relative h-full w-full overflow-hidden bg-grey-200"></div>
              </div>
              <h2 className="type-body font-medium text-black">
                {project.title}: <span className="text-grey-200">{project.summary}</span>
              </h2>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter about={about} />
    </main>
  );
}
