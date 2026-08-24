import "@testing-library/jest-dom/vitest";

// CoverImage imports sanity/env at module load; CI has no .env.local.
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= "test-project";
process.env.NEXT_PUBLIC_SANITY_DATASET ??= "production";
