"use client";

// PROTOTYPE — variant C1 for issue #13: "collapse to top bar". Builds on
// #12's input-first default state (Variant B). On submit, the full-viewport
// input docks into a slim sticky bar; content streams in below it as
// skeletons resolve into real data across the `selection` → `copy` events.
// The bar stays put after success, doubling as the way to issue a new query;
// an explicit "start over" link is the answer to this ticket's deferred
// reset-to-default question.

import { useEffect, useRef } from "react";

import { reframeAbout, reframeProjects } from "./reframePlaceholderData";
import { useReframe } from "./useReframe";

function SkeletonLine({ width }: { width: string }) {
  return (
    <div
      className={`h-4 animate-pulse rounded bg-black/10 motion-reduce:animate-none dark:bg-white/10 ${width}`}
    />
  );
}

export function VariantC1() {
  const { status, intent, selection, copy, submit, reset } = useReframe();
  const inputRef = useRef<HTMLInputElement>(null);
  const docked = status !== "input";

  useEffect(() => {
    if (status === "input") inputRef.current?.focus();
  }, [status]);

  const orderedProjects =
    selection?.selected
      .map((s) => reframeProjects.find((p) => p.slug === s.slug))
      .filter((p): p is (typeof reframeProjects)[number] => Boolean(p)) ??
    reframeProjects;

  const blurbFor = (slug: string) =>
    copy?.projects.find((p) => p.slug === slug)?.blurb ??
    reframeProjects.find((p) => p.slug === slug)?.defaultBlurb;

  const matchReasonFor = (slug: string) =>
    selection?.selected.find((s) => s.slug === slug)?.match_reason;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("intent");
    submit(typeof value === "string" ? value : "");
  };

  return (
    <main className="min-h-[80vh]">
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {status === "selecting" && "Tailoring this page to your request."}
        {status === "done" && `View updated for: ${intent}`}
        {status === "fallback" && ""}
      </div>

      <div
        className={
          docked
            ? "sticky top-0 z-10 border-b border-black/10 bg-white/90 px-6 py-3 backdrop-blur transition-all duration-500 motion-reduce:transition-none dark:border-white/10 dark:bg-black/80"
            : "flex min-h-[80vh] flex-col items-center justify-center px-6 text-center transition-all duration-500 motion-reduce:transition-none"
        }
      >
        {!docked && (
          <>
            <h1 className="text-2xl font-semibold">{reframeAbout.name}</h1>
            <p className="mt-2 text-gray-500">
              Tell me what you&apos;re looking for, and I&apos;ll tailor this
              page to it.
            </p>
          </>
        )}
        <form
          onSubmit={onSubmit}
          className={docked ? "mx-auto flex max-w-2xl gap-2" : "mt-8 flex w-full max-w-2xl gap-2"}
        >
          <label htmlFor="intent" className="sr-only">
            What are you looking for?
          </label>
          <input
            ref={inputRef}
            id="intent"
            name="intent"
            type="text"
            defaultValue=""
            placeholder="e.g. show me something with complex state management"
            className="w-full rounded-md border border-black/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-black px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            {status === "selecting" ? "Tailoring…" : "Go"}
          </button>
        </form>
        {!docked && (
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 text-xs text-gray-400 underline"
          >
            Skip — show me the default page
          </button>
        )}
        {docked && status === "done" && (
          <div className="mx-auto mt-2 max-w-2xl text-center">
            <button
              type="button"
              onClick={reset}
              className="text-xs text-gray-400 underline"
            >
              Start over — reset to default
            </button>
          </div>
        )}
      </div>

      {docked && (
        <div className="mx-auto max-w-3xl space-y-16 px-6 py-16">
          <section aria-labelledby="about-heading">
            <h1 id="about-heading" className="text-3xl font-bold">
              {reframeAbout.name}
            </h1>
            {status === "selecting" ? (
              <div className="mt-3 space-y-2">
                <SkeletonLine width="w-2/3" />
                <SkeletonLine width="w-1/3" />
              </div>
            ) : (
              <div className="animate-[fadein_400ms_ease-out]">
                <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">
                  {copy ? copy.hero.headline : reframeAbout.headline}
                </p>
                {copy && (
                  <p className="mt-1 text-sm text-gray-500">
                    {copy.hero.subheadline}
                  </p>
                )}
              </div>
            )}
            <p className="prose mt-6 dark:prose-invert">
              {copy ? copy.about.emphasis : reframeAbout.bio}
            </p>
          </section>

          <section aria-labelledby="featured-projects-heading">
            <h2 id="featured-projects-heading" className="text-2xl font-bold">
              Featured Projects
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {status === "selecting"
                ? reframeProjects.map((project) => (
                    <div
                      key={project.slug}
                      className="space-y-2 rounded-lg border border-black/10 p-4 dark:border-white/10"
                    >
                      <SkeletonLine width="w-1/2" />
                      <SkeletonLine width="w-full" />
                      <SkeletonLine width="w-2/3" />
                    </div>
                  ))
                : orderedProjects.map((project, i) => (
                    <div
                      key={project.slug}
                      style={{ transitionDelay: `${i * 80}ms` }}
                      className="animate-[fadein_400ms_ease-out] rounded-lg border border-black/10 p-4 dark:border-white/10"
                    >
                      <h3 className="font-semibold">{project.title}</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {blurbFor(project.slug)}
                      </p>
                      {matchReasonFor(project.slug) && (
                        <p className="mt-2 text-xs italic text-gray-400">
                          Matched: {matchReasonFor(project.slug)}
                        </p>
                      )}
                    </div>
                  ))}
            </div>
          </section>
        </div>
      )}

      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
