import { PortableText } from "@portabletext/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
      <h1 id="about-heading" className="text-3xl font-bold tracking-tight">
        {about.name}
      </h1>
      <p className={cn("mt-2 text-xl text-muted-foreground", highlightClass)}>
        {heroOverride ? heroOverride.headline : about.headline}
      </p>
      {heroOverride && (
        <p className="mt-1 text-sm text-muted-foreground">
          {heroOverride.subheadline}
        </p>
      )}
      {emphasisOverride ? (
        <p className={cn("prose mt-6 dark:prose-invert", highlightClass)}>
          {emphasisOverride}
        </p>
      ) : (
        about.bio && (
          <div className="prose mt-6 dark:prose-invert">
            <PortableText value={about.bio} />
          </div>
        )
      )}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {about.resumeUrl && (
          <Button variant="outline" size="sm" render={<a href={about.resumeUrl} download />}>
            Resume
          </Button>
        )}
        <Button variant="link" size="sm" render={<a href={`mailto:${about.email}`} />}>
          {about.email}
        </Button>
        {about.socialLinks?.map((link) => (
          <Button
            key={link._key}
            variant="link"
            size="sm"
            render={<a href={link.url} target="_blank" rel="noreferrer" />}
          >
            {link.platform}
          </Button>
        ))}
      </div>
    </section>
  );
}
