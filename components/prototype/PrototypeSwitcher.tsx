"use client";

// PROTOTYPE — throwaway UI comparison for issue #12 (default homepage state).
// Not for production. Delete along with the other prototype/ components once
// a variant is chosen.

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type VariantMeta = { key: string; label: string };

export function PrototypeSwitcher({ variants }: { variants: VariantMeta[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("variant") ?? variants[0].key;
  const currentIndex = variants.findIndex((v) => v.key === current);

  const go = (index: number) => {
    const next = variants[(index + variants.length) % variants.length];
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", next.key);
    router.replace(`?${params.toString()}`);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") go(currentIndex - 1);
      if (e.key === "ArrowRight") go(currentIndex + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-2 text-sm shadow-lg dark:border-white/20 dark:bg-neutral-900">
      <button
        onClick={() => go(currentIndex - 1)}
        aria-label="Previous variant"
        className="px-1 font-mono"
      >
        ←
      </button>
      <span className="font-mono font-semibold">
        {current} — {variants[currentIndex]?.label}
      </span>
      <button
        onClick={() => go(currentIndex + 1)}
        aria-label="Next variant"
        className="px-1 font-mono"
      >
        →
      </button>
    </div>
  );
}
