import Link from "next/link";

import type { About } from "@/lib/sanity";

export function SiteNav({ about }: { about: About }) {
  return (
    <header>
      <Link href="/" className="fixed z-10 top-md left-md mix-blend-difference text-white type-body font-medium">
        {about.name}
      </Link>
    </header>
  );
}
