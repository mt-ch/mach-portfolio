import "@testing-library/jest-dom/vitest";
import { MotionGlobalConfig } from "motion";

// Resolve `motion` animations to their final state synchronously in tests.
MotionGlobalConfig.skipAnimations = true;

// CoverImage imports sanity/env at module load; CI has no .env.local.
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= "test-project";
process.env.NEXT_PUBLIC_SANITY_DATASET ??= "production";
