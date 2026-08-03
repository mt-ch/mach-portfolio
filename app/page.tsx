import { getAbout, getExperience, getProjects } from "@/lib/sanity";
import { AboutSection } from "@/components/AboutSection";
import { ExperienceList } from "@/components/ExperienceList";
import { FeaturedProjects } from "@/components/FeaturedProjects";

export default async function Home() {
  const [about, experience, projects] = await Promise.all([
    getAbout(),
    getExperience(),
    getProjects(),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-16 px-6 py-16">
      {about && <AboutSection about={about} />}
      <ExperienceList entries={experience} />
      <FeaturedProjects projects={projects} />
    </main>
  );
}
