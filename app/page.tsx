import { getAbout, getFeaturedProjects } from "@/lib/sanity";
import { FeaturedProjectRow } from "@/components/home/FeaturedProjectRow";
import { HeroSection } from "@/components/home/HeroSection";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteNav } from "@/components/home/SiteNav";

import { ArrowUpIcon, CornerDownRightIcon, RotateCwIcon, XIcon } from "lucide-react";

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
    <>
      <main className="relative">
        <SiteNav about={about} />
        <HeroSection about={about} />
        {projects.length > 0 && (
          <div className="p-md gap-md relative flex flex-col">
            {projects.map((project) => (
              <FeaturedProjectRow key={project._id} project={project} />
            ))}
          </div>
        )}
        <SiteFooter about={about} />
      </main>
      {/* Chat */}
      <aside className="fixed bottom-0 right-0 w-124 bg-grey-100 h-full border-l border-grey-200 flex flex-col">
        {/* Header */}
        <div className="p-md border-b border-grey-200 flex items-center justify-between gap-sm">
          <p className="type-body font-medium text-black">Matt LLM</p>
          <div className="flex items-center gap-md">
            <button className="inline-flex items-center gap-sm">
              <RotateCwIcon className="size-md text-grey-300" strokeWidth={1.75} />
            </button>
            <button className="inline-flex items-center gap-sm">
              <XIcon className="size-md text-grey-300" strokeWidth={1.75} />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="p-md flex flex-col justify-between gap-md flex-1">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-md h-full">
            {/* User message */}
            <div className="flex justify-end">
              <div className="inline-flex flex-col gap-sm border border-grey-200 bg-white p-sm">
                <p className="type-body text-black">What was your experience at Pertemps?</p>
              </div>
            </div>
            {/* Example message */}
            <p className="type-body text-black">
              At 1Password, I worked as a Product Design Intern focusing on bringing autofill to macOS. It was a challenge because native macOS
              autofill wasn&apos;t supported, which broke user trust. I had to navigate Apple&apos;s ecosystem constraints to design flows that solved
              this issue. I got to dive into user research, competitive analysis, and prototyping to create a seamless experience. Overall, it was a
              great learning experience in systems thinking and user-centered design.
            </p>
            {/* Suggested questions */}
            <div className="flex flex-col gap-sm border-t border-grey-200 pt-md">
              <div className="inline-flex items-center gap-sm">
                <CornerDownRightIcon className="size-md text-grey-300" strokeWidth={1.75} />
                <p className="type-body text-grey-300">What’s your favourite project and why?</p>
              </div>
              <div className="inline-flex items-center gap-sm">
                <CornerDownRightIcon className="size-md text-grey-300" strokeWidth={1.75} />
                <p className="type-body text-grey-300">What was your experience at Pertemps?</p>
              </div>
              <div className="inline-flex items-center gap-sm">
                <CornerDownRightIcon className="size-md text-grey-300" strokeWidth={1.75} />
                <p className="type-body text-grey-300">What’s your favourite project and why?</p>
              </div>
            </div>
          </div>
          {/* Input */}
          <div className="border bg-white border-grey-200 flex items-center justify-between">
            <input type="text" placeholder="Ask about Matt..." className="w-full text-black p-sm type-body placeholder:text-grey-300" />
            <button className="inline-flex items-center gap-sm p-sm">
              <ArrowUpIcon className="size-md text-grey-300" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
