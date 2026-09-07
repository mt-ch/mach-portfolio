import "@testing-library/jest-dom/vitest";
import { MotionGlobalConfig } from "motion";

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
