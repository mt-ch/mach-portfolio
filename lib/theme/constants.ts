// Single source of truth for the theme primitives shared by the React
// provider (components/features/theme/ThemeProvider.tsx) and the
// pre-hydration bootstrap script (app/layout.tsx). Neither the storage
// key, the dark class, nor the media query is written twice.

export const THEME_STORAGE_KEY = "theme";
export const DARK_CLASS = "dark";
export const PREFERS_DARK_QUERY = "(prefers-color-scheme: dark)";

export type Theme = "light" | "dark";
