import Link from "next/link";

import type { About } from "@/lib/sanity";

export function SiteNav({ about }: { about: About }) {
  return (
    <div className="fixed top-md left-md z-10 mix-blend-difference">
      <Link href="/" className="type-body font-medium text-white">
        {about.name}
      </Link>
    </div>
  );
}
