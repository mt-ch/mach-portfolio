import { getAbout, getExperience, getFeaturedProjects } from "@/lib/sanity";
import { ExperienceSection } from "@/components/features/home/ExperienceSection";
import { FeaturedProjectRow } from "@/components/features/home/FeaturedProjectRow";
import { HeroSection } from "@/components/features/home/HeroSection";
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
          <div className="px-md gap-md relative grid grid-cols-1 sm:grid-cols-2 mb-3xl pb-3xl">
            <h2 className="type-body font-medium">[How I work]</h2>
            <div className="gap-lg relative flex flex-col">
              <div className="gap-xs relative flex flex-col">
                <p className="type-body">
                  I slot into existing teams quickly. I communicate in Slack,
                  deliver in Figma, and stay close to the work without needing
                  layers of coordination. <br />
                  <br /> I am comfortable with ambiguous briefs, shifting
                  priorities, and tight deadlines. Available for project work,
                  retainers, and short embedded support. Remote or on-site in
                  Brussels and Oslo.
                </p>
              </div>
            </div>
          </div>
          <ExperienceSection entries={experience} />
        </div>
      </div>
      <SiteFooter about={about} />
    </main>
  );
}
