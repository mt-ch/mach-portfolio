import { PortableText } from "@portabletext/react";

import type { About } from "@/lib/sanity";

import { LogoImage } from "./CoverImage";

export function HeroSection({ about }: { about: About }) {
  return (
    <div className="p-md gap-xl bg-brand relative flex flex-col h-124">
      <h1 className="type-body font-medium text-accent">
        <span className="text-transparent">{about.name}</span>
        {about.headline}
        {about.bio && about.bio.length > 0 && (
          <>
            <br />
            <br />
            <PortableText value={about.bio} />
          </>
        )}
      </h1>

      {about.logo && (
        <div className="size-sm">
          <LogoImage image={about.logo} alt="" />
        </div>
      )}
    </div>
  );
}
