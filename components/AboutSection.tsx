import { PortableText } from "@portabletext/react";

import type { About } from "@/lib/sanity";

export function AboutSection({
  about,
  heroOverride,
  emphasisOverride,
  highlight = false,
}: {
  about: About;
  heroOverride?: { headline: string; subheadline: string };
  emphasisOverride?: string;
  highlight?: boolean;
}) {
  const highlightClass = highlight
    ? "bg-yellow-100/60 transition-colors duration-500 motion-reduce:transition-none dark:bg-yellow-500/10"
    : "";

  return (
    <section aria-labelledby="about-heading">
      <h1 id="about-heading" className="text-3xl font-bold">
        {about.name}
      </h1>
      <p className={`mt-2 text-xl text-gray-600 dark:text-gray-400 ${highlightClass}`}>
        {heroOverride ? heroOverride.headline : about.headline}
      </p>
      {heroOverride && (
        <p className="mt-1 text-sm text-gray-500">{heroOverride.subheadline}</p>
      )}
      {emphasisOverride ? (
        <p className={`prose mt-6 dark:prose-invert ${highlightClass}`}>
          {emphasisOverride}
        </p>
      ) : (
        about.bio && (
          <div className="prose mt-6 dark:prose-invert">
            <PortableText value={about.bio} />
          </div>
        )
      )}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        {about.resumeUrl && (
          <a href={about.resumeUrl} className="underline" download>
            Resume
          </a>
        )}
        <a href={`mailto:${about.email}`} className="underline">
          {about.email}
        </a>
        {about.socialLinks?.map((link) => (
          <a
            key={link._key}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {link.platform}
          </a>
        ))}
      </div>
    </section>
  );
}
