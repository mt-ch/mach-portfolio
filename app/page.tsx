import { getAbout, getExperience, getProjects } from "@/lib/sanity";
import { AboutSection } from "@/components/AboutSection";
import { ExperienceList } from "@/components/ExperienceList";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { PrototypeSwitcher } from "@/components/prototype/PrototypeSwitcher";
import { VariantA } from "@/components/prototype/VariantA";
import { VariantB } from "@/components/prototype/VariantB";

// PROTOTYPE wiring for issue #12 (default homepage state) — remove the
// ?variant= branch and prototype/ components once a variant is chosen.
const PROTOTYPE_VARIANTS = [
  { key: "A", label: "Content-first" },
  { key: "B", label: "Input-first" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  if (process.env.NODE_ENV !== "production") {
    const { variant } = await searchParams;
    const resolved = variant === "B" ? "B" : "A";
    return (
      <>
        {resolved === "A" ? <VariantA /> : <VariantB />}
        <PrototypeSwitcher variants={PROTOTYPE_VARIANTS} />
      </>
    );
  }

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
