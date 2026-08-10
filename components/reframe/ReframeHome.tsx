"use client";

import { useEffect, useRef, useState } from "react";

import { AboutSection } from "@/components/AboutSection";
import { ProjectCard } from "@/components/ProjectCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { About, ProjectListItem } from "@/lib/sanity";

import { useReframe } from "./useReframe";

export function ReframeHome({
  about,
  projects,
}: {
  about: About;
  projects: ProjectListItem[];
}) {
  const { status, intent, selection, copy, submit, reset } = useReframe();
  const [overlayOpen, setOverlayOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (overlayOpen) inputRef.current?.focus();
  }, [overlayOpen]);

  useEffect(() => {
    if (!overlayOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [overlayOpen]);

  const featured = projects.filter((project) => project.featured);
  const isTailored = status === "selected" || status === "done";

  const orderedProjects = isTailored
    ? (selection?.selected
        .map((entry) => featured.find((p) => p.slug.current === entry.slug))
        .filter((p): p is ProjectListItem => Boolean(p)) ?? featured)
    : featured;

  const isMatching = (slug: string) =>
    isTailored && (selection?.selected.some((s) => s.slug === slug) ?? false);

  const blurbFor = (slug: string) =>
    status === "done"
      ? copy?.projects.find((p) => p.slug === slug)?.blurb
      : undefined;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("intent");
    setOverlayOpen(false);
    submit(typeof value === "string" ? value : "");
  };

  const skipOverlay = () => {
    setOverlayOpen(false);
  };

  const reopenOverlay = () => {
    setOverlayOpen(true);
    reset();
  };

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        {status === "selecting" && "Tailoring this page to your request."}
        {status === "done" && `View updated for: ${intent}`}
      </div>

      {overlayOpen && (
        <div className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-background/95 px-6 text-center backdrop-blur">
          <h2 className="text-2xl font-semibold tracking-tight">
            Tell me what you&apos;re looking for
          </h2>
          <p className="mt-2 text-muted-foreground">
            I&apos;ll tailor this page to it.
          </p>
          <form onSubmit={onSubmit} className="mt-8 flex w-full max-w-2xl gap-2">
            <label htmlFor="reframe-intent" className="sr-only">
              What are you looking for?
            </label>
            <Input
              ref={inputRef}
              id="reframe-intent"
              name="intent"
              type="text"
              placeholder="e.g. show me something with complex state management"
              className="h-11 px-4 text-sm"
            />
            <Button type="submit" size="lg" className="h-11 shrink-0 px-5">
              Go
            </Button>
          </form>
          <Button type="button" variant="link" size="sm" onClick={skipOverlay} className="mt-6 text-muted-foreground">
            Skip — show me the default page
          </Button>
        </div>
      )}

      {!overlayOpen && (status === "selecting" || status === "selected") && (
        <div
          role="status"
          aria-label="Tailoring page"
          className="fixed right-4 top-4 z-20 flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-card-foreground shadow-md"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-foreground motion-reduce:animate-none" />
          Tailoring for &ldquo;{intent}&rdquo;…
        </div>
      )}

      {!overlayOpen && status === "done" && (
        <Badge
          variant="outline"
          className="fixed right-4 top-4 z-20 bg-card px-3 py-1.5 text-xs shadow-md"
        >
          Tailored for &ldquo;{intent}&rdquo;
        </Badge>
      )}

      <AboutSection
        about={about}
        heroOverride={status === "done" ? (copy?.hero ?? undefined) : undefined}
        emphasisOverride={
          status === "done" ? (copy?.about?.emphasis ?? undefined) : undefined
        }
        highlight={status === "done"}
      />

      <section aria-labelledby="featured-projects-heading">
        <div className="flex items-center justify-between">
          <h2 id="featured-projects-heading" className="text-2xl font-bold tracking-tight">
            Featured Projects
          </h2>
          {!overlayOpen && (
            <Button type="button" variant="link" size="sm" onClick={reopenOverlay} className="text-muted-foreground">
              Try a different intent
            </Button>
          )}
        </div>
        <div className="mt-6 grid gap-6 transition-all duration-500 motion-reduce:transition-none sm:grid-cols-2">
          {orderedProjects.map((project) => {
            const slug = project.slug.current;
            const matching = isMatching(slug);
            const blurb = blurbFor(slug);
            const displayProject = blurb ? { ...project, summary: blurb } : project;

            return (
              <div
                key={project._id}
                data-matching={matching || undefined}
                className={cn(
                  "rounded-xl transition-all duration-500 motion-reduce:transition-none",
                  matching && "ring-2 ring-ring"
                )}
              >
                <ProjectCard project={displayProject} />
                {matching && status !== "done" && (
                  <p className="mt-2 text-xs italic text-muted-foreground">Matching…</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
