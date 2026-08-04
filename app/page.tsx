import { getAbout, getExperience, getProjects } from "@/lib/sanity";
import { ExperienceList } from "@/components/ExperienceList";
import { ReframeHome } from "@/components/reframe/ReframeHome";

export default async function Home() {
  const [about, experience, projects] = await Promise.all([
    getAbout(),
    getExperience(),
    getProjects(),
  ]);

  return (
    <main className="relative mx-auto max-w-3xl space-y-16 px-6 py-16">
      {about && <ReframeHome about={about} projects={projects} />}
      <ExperienceList entries={experience} />
    </main>
  );
}
