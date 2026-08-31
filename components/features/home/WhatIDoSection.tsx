import type { About } from "@/lib/sanity";

import { HomeSection } from "./HomeSection";

export function WhatIDoSection({ about }: { about: About }) {
  const items = about.whatIDo ?? [];

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-3xl pb-3xl">
      <HomeSection title="What I do">
        {items.map((item) => (
          <div key={item._key} className="gap-xs relative flex flex-col">
            <h3 className="type-body text-grey-500 dark:text-grey-400 font-medium">
              {item.title}
            </h3>
            <p className="type-body font-medium">{item.description}</p>
          </div>
        ))}
      </HomeSection>
    </div>
  );
}
