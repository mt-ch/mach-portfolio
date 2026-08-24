import { Fragment } from "react";

import type { About } from "@/lib/sanity";

import { LogoImage } from "./CoverImage";

export function HeroSection({ about }: { about: About }) {
  const headlineLines = about.headline
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <div className="p-md gap-xl bg-white relative flex flex-col h-124">
      <h1 className="type-body font-medium text-black">
        <span className="text-transparent">{about.name}{" "}</span>
        {headlineLines.map((line, index) => (
          <Fragment key={index}>
            {index > 0 && <br />}
            {line}
          </Fragment>
        ))}
      </h1>

      {about.logo && (
        <div className="size-sm">
          <LogoImage image={about.logo} alt="" />
        </div>
      )}
    </div>
  );
}
