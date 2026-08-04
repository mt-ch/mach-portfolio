"use client";

// PROTOTYPE — variant C2 for issue #13: "recede to pill". The default
// content (about + projects) is on screen from the start — leaning harder
// into #14's "default content is already server-rendered" decision — and
// the intent input recedes into a small corner pill instead of physically
// docking. Cards patch in place (reorder + blurb swap) rather than skeleton
// -> reveal, so a fallback is *literally* indistinguishable from having
// never submitted: the pill just fades away and nothing else moves.

import { useEffect, useRef, useState } from "react";

import { reframeAbout, reframeProjects } from "./reframePlaceholderData";
import { useReframe } from "./useReframe";

export function VariantC2() {
  const { status, intent, selection, copy, submit, reset } = useReframe();
  const [overlayOpen, setOverlayOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const reopenRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (overlayOpen) inputRef.current?.focus();
  }, [overlayOpen]);

  const orderedProjects =
    selection?.selected
      .map((s) => reframeProjects.find((p) => p.slug === s.slug))
      .filter((p): p is (typeof reframeProjects)[number] => Boolean(p)) ??
    reframeProjects;

  const blurbFor = (slug: string) =>
    copy?.projects.find((p) => p.slug === slug)?.blurb ??
    reframeProjects.find((p) => p.slug === slug)?.defaultBlurb;

  const isMatching = (slug: string) =>
    status === "selected" &&
    selection?.selected.some((s) => s.slug === slug);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("intent");
    setOverlayOpen(false);
    submit(typeof value === "string" ? value : "");
  };

  const closeOverlayToDefault = () => {
    setOverlayOpen(false);
    reset();
  };

  const reopenOverlay = () => {
    setOverlayOpen(true);
    reset();
  };

  return (
    <main className="relative mx-auto max-w-3xl space-y-16 px-6 py-16">
      <div role="status" aria-live="polite" className="sr-only">
        {status === "selecting" && "Tailoring this page to your request."}
        {status === "done" && `View updated for: ${intent}`}
      </div>

      {overlayOpen && (
        <div className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-white/95 px-6 text-center backdrop-blur dark:bg-black/95">
          <h1 className="text-2xl font-semibold">{reframeAbout.name}</h1>
          <p className="mt-2 text-gray-500">
            Tell me what you&apos;re looking for, and I&apos;ll tailor this
            page to it.
          </p>
          <form onSubmit={onSubmit} className="mt-8 flex w-full max-w-2xl gap-2">
            <label htmlFor="intent2" className="sr-only">
              What are you looking for?
            </label>
            <input
              ref={inputRef}
              id="intent2"
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
          <button
            type="button"
            onClick={closeOverlayToDefault}
            className="mt-6 text-xs text-gray-400 underline"
          >
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

      <section aria-labelledby="about-heading">
        <h1 id="about-heading" className="text-3xl font-bold">
          {reframeAbout.name}
        </h1>
        <p
          className={`mt-2 text-xl text-gray-600 transition-colors duration-500 motion-reduce:transition-none dark:text-gray-400 ${
            status === "done" ? "bg-yellow-100/60 dark:bg-yellow-500/10" : ""
          }`}
        >
          {copy ? copy.hero.headline : reframeAbout.headline}
        </p>
        {copy && (
          <p className="mt-1 text-sm text-gray-500">
            {copy.hero.subheadline}
          </p>
        )}
        <p
          className={`prose mt-6 dark:prose-invert ${
            status === "done" ? "bg-yellow-100/60 dark:bg-yellow-500/10" : ""
          }`}
        >
          {copy ? copy.about.emphasis : reframeAbout.bio}
        </p>
      </section>

      <section aria-labelledby="featured-projects-heading">
        <div className="flex items-center justify-between">
          <h2 id="featured-projects-heading" className="text-2xl font-bold">
            Featured Projects
          </h2>
          {!overlayOpen && (
            <button
              ref={reopenRef}
              type="button"
              onClick={reopenOverlay}
              className="text-xs text-gray-400 underline"
            >
              Try a different intent
            </button>
          )}
        </div>
        <div className="mt-6 grid gap-6 transition-all duration-500 motion-reduce:transition-none sm:grid-cols-2">
          {orderedProjects.map((project) => (
            <div
              key={project.slug}
              className={`rounded-lg border p-4 transition-all duration-500 motion-reduce:transition-none dark:border-white/10 ${
                isMatching(project.slug)
                  ? "border-black/40 dark:border-white/40"
                  : "border-black/10"
              }`}
            >
              <h3 className="font-semibold">{project.title}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {blurbFor(project.slug)}
              </p>
              {isMatching(project.slug) && status !== "done" && (
                <p className="mt-2 text-xs italic text-gray-400">Matching…</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
