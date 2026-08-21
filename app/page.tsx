import { getAbout, getFeaturedProjects } from "@/lib/sanity";
import { FeaturedProjectRow } from "@/components/home/FeaturedProjectRow";
import { HeroSection } from "@/components/home/HeroSection";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteNav } from "@/components/home/SiteNav";

export default async function Home() {
  const [about, projects] = await Promise.all([getAbout(), getFeaturedProjects()]);

  if (!about) {
    return (
      <main className="relative p-md">
        <p className="type-body text-black">About content is not configured yet.</p>
      </main>
    );
  }

  return (
    <main className="relative">
      <SiteNav about={about} />
      <HeroSection about={about} />
      {projects.length > 0 && (
        <div className="p-md gap-md relative flex flex-col bg-white">
          {projects.map((project) => (
            <FeaturedProjectRow key={project._id} project={project} />
          ))}
        </div>
      )}
      <SiteFooter about={about} />
    </main>
  );
}
