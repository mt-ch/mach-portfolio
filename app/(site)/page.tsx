import type { Metadata } from "next";

import { getAbout, getExperience, getFeaturedProjects } from "@/lib/sanity";
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  resolveSeo,
} from "@/lib/seo/resolveSeo";
import { ExperienceSection } from "@/components/features/home/ExperienceSection";
import { FeaturedProjectRow } from "@/components/features/home/FeaturedProjectRow";
import { HeroSection } from "@/components/features/home/HeroSection";
import { HowIWorkSection } from "@/components/features/home/HowIWorkSection";
import { WhatIDoSection } from "@/components/features/home/WhatIDoSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteNav } from "@/components/layout/SiteNav";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAbout();

  const siteName = about?.siteName?.trim() || "Matt Chan";
  const titleTemplate = about?.titleTemplate?.trim() || "%s | Matt Chan";

  const seo = resolveSeo(about ?? {}, {
    siteName,
    defaultMetaDescription:
      about?.defaultMetaDescription?.trim() || "Portfolio site",
    defaultOgImage: about?.defaultOgImage ?? null,
  });

  // Next replaces (not deep-merges) the root layout's `openGraph`/`twitter`,
  // so the social-card title is rebuilt here. When the homepage sets no
  // meta-title override, resolveSeo returns the bare site name, which must be
  // shown verbatim rather than run through the "%s | …" template (which would
  // double it up); the same guard keeps `title.absolute` off the template.
  const hasTitleOverride = seo.title !== siteName;
  const socialTitle = hasTitleOverride
    ? titleTemplate.replace("%s", seo.title)
    : siteName;

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
    title: hasTitleOverride ? seo.title : { absolute: siteName },
    description: seo.description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName,
      title: socialTitle,
      description: seo.description,
      url: "/",
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

export default async function Home() {
  const [about, projects, experience] = await Promise.all([
    getAbout(),
    getFeaturedProjects(),
    getExperience(),
  ]);

  if (!about) {
    return (
      <main className="p-md relative">
        <p className="type-body text-black">
          About content is not configured yet.
        </p>
      </main>
    );
  }

  return (
    <main className="text-foreground relative">
      <div className="bg-background">
        <SiteNav about={about} />
        <HeroSection about={about} />
        {projects.length > 0 && (
          <div className="gap-xl lg:px-md relative flex flex-col">
            {projects.map((project) => (
              <FeaturedProjectRow key={project._id} project={project} />
            ))}
          </div>
        )}
        <div className="relative flex flex-col py-3xl my-3xl">
          <WhatIDoSection about={about} />
          <HowIWorkSection about={about} />
          <ExperienceSection entries={experience} />
        </div>
      </div>
      <SiteFooter about={about} />
    </main>
  );
}
