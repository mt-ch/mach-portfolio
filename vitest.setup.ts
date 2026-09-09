import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import { MotionGlobalConfig } from "motion";

// `next-view-transitions` ships an ESM build that imports `next/link` via a
// bare specifier Node's resolver rejects under vitest (Next resolves it fine
// at build/runtime). Stub it globally so any component reaching it through
// `TransitionLink` still renders; individual suites can override this mock.
vi.mock("next-view-transitions", async () => {
  const nextLink = (await vi.importActual<{ default: unknown }>("next/link")).default;
  const noop = () => {};
  return {
    ViewTransitions: ({ children }: { children: unknown }) => children,
    Link: nextLink,
    useTransitionRouter: () => ({
      push: noop,
      replace: noop,
      prefetch: noop,
      back: noop,
      forward: noop,
      refresh: noop,
    }),
  };
});

// Resolve `motion` animations to their final state synchronously in tests.
MotionGlobalConfig.skipAnimations = true;

// jsdom has no ResizeObserver; Lenis constructs one for its dimensions
// tracking. A no-op stub is enough — tests never exercise real resize.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// CoverImage imports sanity/env at module load; CI has no .env.local.
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= "test-project";
process.env.NEXT_PUBLIC_SANITY_DATASET ??= "production";
