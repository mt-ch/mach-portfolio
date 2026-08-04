"use client";

// PROTOTYPE — variant B: "input-first". Only the intent input is shown
// initially; default content is withheld until generation completes (or the
// visitor chooses to skip / see the default page). Uses flat placeholder
// content, not live Sanity data (see placeholderContent.tsx).

import { useState } from "react";

import { placeholderAbout, placeholderProjects } from "./placeholderContent";

export function VariantB() {
  const [status, setStatus] = useState<"idle" | "loading" | "revealed">(
    "idle",
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setTimeout(() => setStatus("revealed"), 1400);
  };

  if (status !== "revealed") {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold">{placeholderAbout.name}</h1>
        <p className="mt-2 text-gray-500">
          Tell me what you're looking for, and I'll tailor this page to it.
        </p>
        <form onSubmit={submit} className="mt-8 flex w-full gap-2">
          <input
            type="text"
            autoFocus
            placeholder="e.g. show me something with complex state management"
            className="w-full rounded-md border border-black/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-black px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            {status === "loading" ? "Tailoring…" : "Go"}
          </button>
        </form>
        {status === "loading" && (
          <p className="mt-4 text-xs text-gray-500">
            Generating a tailored view… (prototype: this is a fixed 1.4s
            delay; real target is ~1-2s to first token)
          </p>
        )}
        <button
          type="button"
          onClick={() => setStatus("revealed")}
          className="mt-6 text-xs text-gray-400 underline"
        >
          Skip — show me the default page
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-16 px-6 py-16">
      <section aria-labelledby="about-heading">
        <h1 id="about-heading" className="text-3xl font-bold">
          {placeholderAbout.name}
        </h1>
        <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">
          {placeholderAbout.headline}
        </p>
        <p className="prose mt-6 dark:prose-invert">{placeholderAbout.bio}</p>
      </section>

      <section aria-labelledby="featured-projects-heading">
        <h2 id="featured-projects-heading" className="text-2xl font-bold">
          Featured Projects
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {placeholderProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border border-black/10 p-4 dark:border-white/10"
            >
              <h3 className="font-semibold">{project.title}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {project.blurb}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
