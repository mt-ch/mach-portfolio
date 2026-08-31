import { getAbout, getExperience, getFeaturedProjects } from "@/lib/sanity";
import { ExperienceSection } from "@/components/features/home/ExperienceSection";
import { FeaturedProjectRow } from "@/components/features/home/FeaturedProjectRow";
import { HeroSection } from "@/components/features/home/HeroSection";
import { HowIWorkSection } from "@/components/features/home/HowIWorkSection";
import { WhatIDoSection } from "@/components/features/home/WhatIDoSection";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteNav } from "@/components/layout/SiteNav";

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
