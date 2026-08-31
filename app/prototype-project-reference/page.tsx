"use client";

/**
 * PROTOTYPE — throwaway. Answers issue #153: "Project reference component:
 * hide citations by default, surface a Project when the answer is about one."
 *
 * Three structurally different variants of the inline Project reference
 * component, switchable via `?variant=A|B|C` and the floating bottom bar
 * (or ← / → keys). Locked decisions this prototype assumes:
 *   - Rich card: cover image + title + one-line summary, links to /projects/<slug>
 *   - Exactly one Project per answer (the primary one)
 *   - Rendered inline, directly after the answer text, inside the bubble
 *   - The Project is model-asserted (see the "Scenario" toggle: a general
 *     answer asserts no Project, so nothing renders — hidden by default)
 *
 * Not production code: no tests, no real data, no react-markdown (the answer
 * body is hand-rolled to mimic the #149 Markdown output). Run with `pnpm dev`
 * and open /prototype-project-reference.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

type VariantKey = "A" | "B" | "C";

const VARIANTS: { key: VariantKey; name: string }[] = [
  { key: "A", name: "Horizontal strip" },
  { key: "B", name: "Stacked poster" },
  { key: "C", name: "Accented reference block" },
];

interface ProjectRef {
  slug: string;
  title: string;
  summary: string;
  coverImage: string; // data URI in the prototype; a cdn.sanity.io URL in prod
}

const MOCK_PROJECT: ProjectRef = {
  slug: "helios-design-system",
  title: "Helios Design System",
  summary:
    "A component library and design-token pipeline that unified the UI across six product teams.",
  coverImage: fauxCover("#FF3F0B", "#00c9b1"),
};

// A deterministic inline SVG so the prototype has zero network dependencies.
function fauxCover(from: string, to: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/>
    </linearGradient></defs>
    <rect width='480' height='300' fill='url(#g)'/>
    <g fill='rgba(255,255,255,0.14)'>
      <rect x='40' y='40' width='140' height='140'/>
      <rect x='210' y='90' width='230' height='40'/>
      <rect x='210' y='150' width='170' height='40'/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ------------------------------------------------------------------ */
/* Variant A — Horizontal strip                                        */
/* Compact single row: small square cover left, title + summary right, */
/* the whole block is one bordered link. Lowest vertical footprint —   */
/* reads like a richer version of today's citation chip.               */
/* ------------------------------------------------------------------ */
function VariantA({ project }: { project: ProjectRef }) {
  return (
    <a
      href={`/projects/${project.slug}`}
      data-cursor="link"
      className="group flex items-stretch gap-sm border border-grey-200 bg-white hover:bg-grey-100 dark:border-grey-700 dark:bg-grey-900 dark:hover:bg-grey-800 transition-colors duration-200"
    >
      <img
        src={project.coverImage}
        alt=""
        aria-hidden="true"
        className="size-16 shrink-0 object-cover"
      />
      <span className="flex min-w-0 flex-col justify-center gap-2xs py-xs pr-sm">
        <span className="type-small font-medium text-black group-hover:text-brand dark:text-white transition-colors duration-200">
          {project.title}
        </span>
        <span className="type-caption text-grey-500 dark:text-grey-400 line-clamp-2">
          {project.summary}
        </span>
      </span>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Variant B — Stacked poster                                          */
/* Full-width 16:9 cover on top, then title + summary + an explicit    */
/* "View the project" affordance. Editorial / magazine feel; the most  */
/* visually prominent. No outer border — the image is the frame.       */
/* ------------------------------------------------------------------ */
function VariantB({ project }: { project: ProjectRef }) {
  return (
    <a
      href={`/projects/${project.slug}`}
      data-cursor="link"
      className="group block"
    >
      <img
        src={project.coverImage}
        alt=""
        aria-hidden="true"
        className="aspect-video w-full object-cover"
      />
      <span className="mt-sm flex flex-col gap-2xs">
        <span className="type-small font-medium text-black dark:text-white">
          {project.title}
        </span>
        <span className="type-caption text-grey-500 dark:text-grey-400">
          {project.summary}
        </span>
        <span className="mt-2xs type-caption font-medium text-brand">
          View the project &rarr;
        </span>
      </span>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Variant C — Accented reference block                                */
/* Left brand accent border + "Project" eyebrow clearly frame this as  */
/* a distinct reference element, not part of the answer body. Title is */
/* the link; a small cover thumbnail sits right.                       */
/* ------------------------------------------------------------------ */
function VariantC({ project }: { project: ProjectRef }) {
  return (
    <div className="flex gap-sm border-l-2 border-brand bg-grey-100 dark:bg-grey-900 py-sm pl-sm pr-sm">
      <div className="flex min-w-0 flex-1 flex-col gap-2xs">
        <span className="type-caption font-medium uppercase tracking-wide text-grey-500 dark:text-grey-400">
          Project
        </span>
        <a
          href={`/projects/${project.slug}`}
          data-cursor="link"
          className="type-small font-medium text-black hover:text-brand dark:text-white transition-colors duration-200"
        >
          {project.title}
        </a>
        <span className="type-caption text-grey-500 dark:text-grey-400">
          {project.summary}
        </span>
      </div>
      <img
        src={project.coverImage}
        alt=""
        aria-hidden="true"
        className="size-12 shrink-0 object-cover"
      />
    </div>
  );
}

function ProjectReference({ variant, project }: { variant: VariantKey; project: ProjectRef }) {
  if (variant === "A") return <VariantA project={project} />;
  if (variant === "B") return <VariantB project={project} />;
  return <VariantC project={project} />;
}

/* ------------------------------------------------------------------ */
/* Mock assistant bubble — mimics the #149 Markdown answer body        */
/* (paragraphs, bold, a short list) so the card is judged against     */
/* real bubble density, not in a vacuum.                              */
/* ------------------------------------------------------------------ */
function AssistantBubble({
  children,
  reference,
}: {
  children: React.ReactNode;
  reference?: React.ReactNode;
}) {
  return (
    <div className="flex justify-start">
      <div className="space-y-md max-w-11/12">
        <div className="type-small space-y-sm text-black dark:text-white">{children}</div>
        {reference}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-11/12 border border-grey-200 bg-white p-sm type-small text-black dark:border-grey-700 dark:bg-grey-900 dark:text-grey-200">
        {text}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Floating variant switcher — hidden in production builds.            */
/* ------------------------------------------------------------------ */
function PrototypeSwitcher({
  current,
  onChange,
}: {
  current: VariantKey;
  onChange: (next: VariantKey) => void;
}) {
  const index = VARIANTS.findIndex((v) => v.key === current);

  const cycle = useCallback(
    (dir: 1 | -1) => {
      const next = (index + dir + VARIANTS.length) % VARIANTS.length;
      onChange(VARIANTS[next].key);
    },
    [index, onChange],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") cycle(-1);
      if (e.key === "ArrowRight") cycle(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycle]);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-black/10 bg-white px-3 py-2 text-sm shadow-lg dark:border-white/15 dark:bg-grey-950">
      <button
        type="button"
        onClick={() => cycle(-1)}
        className="flex size-7 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Previous variant"
      >
        &larr;
      </button>
      <span className="font-mono tabular-nums text-black dark:text-white">
        {current} &mdash; {VARIANTS[index].name}
      </span>
      <button
        type="button"
        onClick={() => cycle(1)}
        className="flex size-7 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Next variant"
      >
        &rarr;
      </button>
    </div>
  );
}

type Scenario = "about-project" | "general" | "compare";

const SCENARIOS: { key: Scenario; label: string }[] = [
  { key: "about-project", label: "Answer about a Project" },
  { key: "general", label: "General answer (no Project asserted)" },
  { key: "compare", label: "Answer touching 2 Projects (only primary shown)" },
];

export default function PrototypeProjectReferencePage() {
  const [variant, setVariant] = useState<VariantKey>(() => {
    if (typeof window === "undefined") return "A";
    const v = new URLSearchParams(window.location.search).get("variant");
    return v === "A" || v === "B" || v === "C" ? v : "A";
  });
  const [scenario, setScenario] = useState<Scenario>("about-project");

  const changeVariant = useCallback((next: VariantKey) => {
    setVariant(next);
    const url = new URL(window.location.href);
    url.searchParams.set("variant", next);
    window.history.replaceState(null, "", url);
  }, []);

  const showReference = scenario !== "general";

  const reference = useMemo(
    () => (showReference ? <ProjectReference variant={variant} project={MOCK_PROJECT} /> : null),
    [showReference, variant],
  );

  return (
    <div className="h-full overflow-y-auto bg-grey-100 dark:bg-grey-800">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-lg p-md pb-32">
        <header className="flex flex-col gap-sm">
          <p className="type-caption font-mono text-grey-500 dark:text-grey-400">
            PROTOTYPE · issue #153 · throwaway
          </p>
          <h1 className="type-subheading font-medium text-black dark:text-white">
            Project reference component
          </h1>
          <div className="flex flex-wrap gap-xs">
            {SCENARIOS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setScenario(s.key)}
                className={`border p-xs type-caption transition-colors duration-200 ${
                  scenario === s.key
                    ? "border-brand bg-brand text-white"
                    : "border-grey-300 text-grey-600 hover:border-grey-500 dark:border-grey-700 dark:text-grey-300"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </header>

        {/* The chat column, at its real 408px (w-102) width and bubble density. */}
        <div className="w-102 max-w-full self-center border border-grey-200 bg-grey-100 dark:border-grey-700 dark:bg-grey-800">
          <div className="border-b border-grey-200 px-md py-md dark:border-grey-700">
            <p className="type-body font-medium text-brand">[Ask]</p>
          </div>
          <div className="flex flex-col gap-lg p-md">
            {scenario === "about-project" && (
              <>
                <UserBubble text="What's the project you're most proud of?" />
                <AssistantBubble reference={reference}>
                  <p>
                    Probably the <strong>Helios Design System</strong>. I built it as part of
                    my role at Northwind, starting from a Figma audit and ending with a
                    published component library six teams shipped against.
                  </p>
                  <p>The parts I care about most:</p>
                  <ul className="ml-md list-disc space-y-2xs">
                    <li>a token pipeline that kept design and code in sync automatically</li>
                    <li>a contribution model so teams could add components without me</li>
                  </ul>
                </AssistantBubble>
              </>
            )}

            {scenario === "general" && (
              <>
                <UserBubble text="How do you like to work with designers?" />
                <AssistantBubble reference={reference}>
                  <p>
                    Closely and early. I&rsquo;d rather sit in on the messy first pass than
                    get a finished comp over the wall &mdash; that&rsquo;s when the
                    engineering constraints are cheapest to fold in.
                  </p>
                  <p>
                    In practice that means shared components, a lot of quick Loom
                    walkthroughs, and treating the design file as the source of truth for
                    intent, not pixel measurements.
                  </p>
                </AssistantBubble>
                <p className="type-caption text-grey-500 dark:text-grey-400">
                  &uarr; No Project asserted, so nothing renders. This is the default state
                  for most answers.
                </p>
              </>
            )}

            {scenario === "compare" && (
              <>
                <UserBubble text="Have you done much data-viz work?" />
                <AssistantBubble reference={reference}>
                  <p>
                    A fair amount. The clearest example is <strong>Helios Design System</strong>,
                    where the charting package was the hardest surface to get right &mdash;
                    accessible tooltips, colour-blind-safe scales, the lot.
                  </p>
                  <p>
                    I also did a leaner dashboard for a fintech contract, but Helios is the
                    one with the depth to point at.
                  </p>
                </AssistantBubble>
                <p className="type-caption text-grey-500 dark:text-grey-400">
                  &uarr; Two Projects mentioned; the model asserts only the primary one, so
                  only Helios surfaces.
                </p>
              </>
            )}
          </div>
        </div>

        <section className="w-102 max-w-full self-center type-caption text-grey-500 dark:text-grey-400">
          <p className="font-medium text-grey-700 dark:text-grey-300">Open plumbing questions (not UI):</p>
          <ol className="ml-md mt-xs list-decimal space-y-2xs">
            <li>How the model asserts the slug — tool call vs. trailing sentinel line.</li>
            <li>Whether an asserted slug not present in retrieved chunks is trusted or dropped.</li>
            <li>Where the card&rsquo;s title/summary/cover come from — retrieved chunk metadata vs. a Sanity fetch by slug in the route.</li>
            <li>The <code>citations</code> SSE payload shape change (array of chips &rarr; one optional Project ref).</li>
          </ol>
        </section>
      </div>

      <PrototypeSwitcher current={variant} onChange={changeVariant} />
    </div>
  );
}
