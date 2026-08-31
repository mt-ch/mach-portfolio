import { getAbout, getExperience, getFeaturedProjects } from "@/lib/sanity";
import { ExperienceSection } from "@/components/features/home/ExperienceSection";
import { FeaturedProjectRow } from "@/components/features/home/FeaturedProjectRow";
import { HeroSection } from "@/components/features/home/HeroSection";
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
          <div className="px-md gap-md relative grid grid-cols-1 sm:grid-cols-2 mb-3xl pb-3xl">
            <h2 className="type-body font-medium">[What I do]</h2>
            <div className="gap-lg relative flex flex-col">
              <div className="gap-xs relative flex flex-col">
                <h3 className="type-body text-grey-500 dark:text-grey-400 font-medium">
                  Fractional leadership
                </h3>
                <p className="type-body">
                  Senior design leadership for teams that need help setting
                  direction, aligning product decisions, and raising the quality
                  of the work as it moves.
                </p>
              </div>
              <div className="gap-xs relative flex flex-col">
                <h3 className="type-body text-grey-500 dark:text-grey-400 font-medium">
                  UX/UI design
                </h3>
                <p className="type-body">
                  End-to-end product design from flows and wireframes to final
                  UI. I work fast and at high fidelity.
                </p>
              </div>
              <div className="gap-xs relative flex flex-col">
                <h3 className="type-body text-grey-500 dark:text-grey-400 font-medium">
                  Design systems
                </h3>
                <p className="type-body">
                  Component libraries, tokens, documentation. Built to be handed
                  off and actually used.{" "}
                </p>
              </div>
              <div className="gap-xs relative flex flex-col">
                <h3 className="type-body text-grey-500 dark:text-grey-400 font-medium">
                  Visual direction
                </h3>
                <p className="type-body">
                  Visual language, UI polish, design QA. I can step in late in a
                  project and raise the quality bar quickly.{" "}
                </p>
              </div>
            </div>
          </div>
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
