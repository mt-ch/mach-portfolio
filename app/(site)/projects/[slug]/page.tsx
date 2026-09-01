import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAbout, getOtherProjects, getProject, getProjects } from "@/lib/sanity";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  resolveSeo,
} from "@/lib/seo/resolveSeo";
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
  const [about, project] = await Promise.all([getAbout(), getProject(slug)]);

  if (!project) {
    return {};
  }

  const siteName = about?.siteName?.trim() || "Matt Chan";
  const titleTemplate = about?.titleTemplate?.trim() || "%s | Matt Chan";

  const seo = resolveSeo(project, {
    siteName,
    defaultMetaDescription:
      about?.defaultMetaDescription?.trim() || "Portfolio site",
    defaultOgImage: about?.defaultOgImage ?? null,
  });

  // Next applies `title.template` only to the `title` field, and it replaces
  // (not deep-merges) the root layout's `openGraph`/`twitter`. Apply the
  // template by hand here so the social-card title and `og:site_name` match
  // every other route.
  const socialTitle = titleTemplate.replace("%s", seo.title);

  const canonicalPath = `/projects/${slug}`;
  const ogImages = seo.ogImage
    ? [
        {
          url: seo.ogImage,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: seo.ogImageAlt,
        },
      ]
    : undefined;

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "article",
      siteName,
      title: socialTitle,
      description: seo.description,
      url: canonicalPath,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: seo.description,
      images: ogImages,
    },
    robots: seo.noIndex ? { index: false, follow: true } : undefined,
  };
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
        <div className="flex flex-col gap-3xl pt-3xl pb-3xl mb-3xl lg:px-md">
          <ProjectStory blocks={project.story} />
          <OtherProjects projects={otherProjects} />
        </div>
      </div>
      <SiteFooter about={about} />
    </main>
  );
}
