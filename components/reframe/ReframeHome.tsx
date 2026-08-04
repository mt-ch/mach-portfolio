"use client";

import { useEffect, useRef, useState } from "react";

import { AboutSection } from "@/components/AboutSection";
import { ProjectCard } from "@/components/ProjectCard";
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
        <div className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-white/95 px-6 text-center backdrop-blur dark:bg-black/95">
          <h2 className="text-2xl font-semibold">
            Tell me what you&apos;re looking for
          </h2>
          <p className="mt-2 text-gray-500">
            I&apos;ll tailor this page to it.
          </p>
          <form onSubmit={onSubmit} className="mt-8 flex w-full max-w-2xl gap-2">
            <label htmlFor="reframe-intent" className="sr-only">
              What are you looking for?
            </label>
            <input
              ref={inputRef}
              id="reframe-intent"
              name="intent"
              type="text"
              placeholder="e.g. show me something with complex state management"
              className="w-full rounded-md border border-black/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
            />
            <button
              type="submit"
              className="shrink-0 rounded-md bg-black px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              Go
            </button>
          </form>
          <button type="button" onClick={skipOverlay} className="mt-6 text-xs text-gray-400 underline">
            Skip — show me the default page
          </button>
        </div>
      )}

      {!overlayOpen && (status === "selecting" || status === "selected") && (
        <div
          role="status"
          aria-label="Tailoring page"
          className="fixed right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs shadow-md dark:border-white/10 dark:bg-neutral-900"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-black motion-reduce:animate-none dark:bg-white" />
          Tailoring for &ldquo;{intent}&rdquo;…
        </div>
      )}

      {!overlayOpen && status === "done" && (
        <div className="fixed right-4 top-4 z-20 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs shadow-md dark:border-white/10 dark:bg-neutral-900">
          Tailored for &ldquo;{intent}&rdquo;
        </div>
      )}

      <AboutSection
        about={about}
        heroOverride={status === "done" ? copy?.hero : undefined}
        emphasisOverride={status === "done" ? copy?.about.emphasis : undefined}
        highlight={status === "done"}
      />

      <section aria-labelledby="featured-projects-heading">
        <div className="flex items-center justify-between">
          <h2 id="featured-projects-heading" className="text-2xl font-bold">
            Featured Projects
          </h2>
          {!overlayOpen && (
            <button type="button" onClick={reopenOverlay} className="text-xs text-gray-400 underline">
              Try a different intent
            </button>
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
                className={`rounded-md transition-all duration-500 motion-reduce:transition-none ${
                  matching ? "ring-2 ring-black/40 dark:ring-white/40" : ""
                }`}
              >
                <ProjectCard project={displayProject} />
                {matching && status !== "done" && (
                  <p className="mt-2 text-xs italic text-gray-400">Matching…</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
