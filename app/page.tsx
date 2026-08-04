import { getAbout, getExperience, getProjects } from "@/lib/sanity";
import { AboutSection } from "@/components/AboutSection";
import { ExperienceList } from "@/components/ExperienceList";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { PrototypeSwitcher } from "@/components/prototype/PrototypeSwitcher";
import { VariantA } from "@/components/prototype/VariantA";
import { VariantB } from "@/components/prototype/VariantB";
import { VariantC1 } from "@/components/prototype/VariantC1";
import { VariantC2 } from "@/components/prototype/VariantC2";

// PROTOTYPE wiring for issues #12 (default homepage state) and #13
// (loading/reframing interaction) — remove the ?variant= branch and
// prototype/ components once a variant is chosen.
const PROTOTYPE_VARIANTS = [
  { key: "A", label: "Content-first" },
  { key: "B", label: "Input-first" },
  { key: "C1", label: "Reframe: collapse to bar" },
  { key: "C2", label: "Reframe: recede to pill" },
];

const PROTOTYPE_COMPONENTS = {
  A: VariantA,
  B: VariantB,
  C1: VariantC1,
  C2: VariantC2,
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  if (process.env.NODE_ENV !== "production") {
    const { variant } = await searchParams;
    const key = (
      variant && variant in PROTOTYPE_COMPONENTS ? variant : "A"
    ) as keyof typeof PROTOTYPE_COMPONENTS;
    const Variant = PROTOTYPE_COMPONENTS[key];
    return (
      <>
        <Variant />
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
