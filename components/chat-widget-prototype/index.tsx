"use client";

// PROTOTYPE — throwaway. Mounts three radically different chat-widget
// variants on the real site, switchable via ?variant=A|B|C, plus a floating
// bottom bar to flip between them. Hidden in production builds.
// Answers issue #40 (chat widget UI design) — see docs/agents/issue-tracker.md
// wayfinder conventions. Capture the winner, then delete this directory.

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VariantA, name as nameA } from "./variant-a-corner-bubble";
import { VariantB, name as nameB } from "./variant-b-command-bar";
import { VariantC, name as nameC } from "./variant-c-side-drawer";

const VARIANTS = {
  A: { Component: VariantA, name: nameA },
  B: { Component: VariantB, name: nameB },
  C: { Component: VariantC, name: nameC },
} as const;

type VariantKey = keyof typeof VARIANTS;
const KEYS = Object.keys(VARIANTS) as VariantKey[];

export function ChatWidgetPrototype() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("variant")?.toUpperCase();
  const current: VariantKey = (raw && raw in VARIANTS ? raw : "A") as VariantKey;

  const setVariant = useCallback(
    (key: VariantKey) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("variant", key);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const cycle = useCallback(
    (dir: 1 | -1) => {
      const idx = KEYS.indexOf(current);
      setVariant(KEYS[(idx + dir + KEYS.length) % KEYS.length]);
    },
    [current, setVariant]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable) return;
      if (e.key === "ArrowLeft") cycle(-1);
      if (e.key === "ArrowRight") cycle(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cycle]);

  const Active = VARIANTS[current].Component;

  return (
    <>
      <Active key={current} />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-foreground/20 bg-foreground px-3 py-1.5 text-xs text-background shadow-lg">
          <button
            onClick={() => cycle(-1)}
            className="rounded-full p-1 hover:bg-background/20"
            aria-label="Previous variant"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="font-mono">
            {current} — {VARIANTS[current].name}
          </span>
          <button
            onClick={() => cycle(1)}
            className="rounded-full p-1 hover:bg-background/20"
            aria-label="Next variant"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
