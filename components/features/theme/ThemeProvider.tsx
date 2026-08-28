"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { DARK_CLASS, PREFERS_DARK_QUERY, THEME_STORAGE_KEY, type Theme } from "@/lib/theme/constants";

export type { Theme };

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable (private mode, blocked storage) — fall
    // through to the OS preference below.
  }
  return window.matchMedia(PREFERS_DARK_QUERY).matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle(DARK_CLASS, theme === "dark");
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (private mode, quota) — the choice just
      // won't persist across visits.
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
