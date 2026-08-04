"use client";

// PROTOTYPE — variant A: "content-first". Full default content renders
// immediately; the intent input sits above it and reframes in place.
// Uses flat placeholder content, not live Sanity data (see
// placeholderContent.tsx) — the question here is layout/behaviour, not data.

import { useState } from "react";

import { placeholderAbout, placeholderProjects } from "./placeholderContent";

export function VariantA() {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setTimeout(() => setStatus("done"), 1400);
  };

  return (
    <main className="mx-auto max-w-3xl space-y-16 px-6 py-16">
      <section aria-label="Intent input">
        <form onSubmit={submit} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. I'm hiring a senior frontend engineer"
            className="w-full rounded-md border border-black/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-black px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            {status === "loading" ? "Tailoring…" : "Tailor this page"}
          </button>
        </form>
        {status === "loading" && (
          <p className="mt-2 text-xs text-gray-500">
            Reframing content in place — existing content stays visible while
            this streams in.
          </p>
        )}
        {status === "done" && (
          <p className="mt-2 text-xs text-gray-500">
            (prototype: content below would now reflect the tailored
            selection/copy)
          </p>
        )}
      </section>

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
