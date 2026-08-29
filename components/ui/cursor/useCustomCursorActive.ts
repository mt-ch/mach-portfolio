"use client";

import { useEffect } from "react";

// The custom cursor only makes sense for a fine hover-capable pointer. The
// query is re-evaluated on `change` so plugging in a mouse on a touch device
// activates the cursor without a reload (and unplugging it deactivates).
const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const ACTIVE_CLASS = "custom-cursor-active";

export function useCustomCursorActive() {
  useEffect(() => {
    const mql = window.matchMedia(FINE_POINTER_QUERY);
    const root = document.documentElement;

    const apply = () => root.classList.toggle(ACTIVE_CLASS, mql.matches);

    apply();
    mql.addEventListener("change", apply);

    return () => {
      mql.removeEventListener("change", apply);
      root.classList.remove(ACTIVE_CLASS);
    };
  }, []);
}
