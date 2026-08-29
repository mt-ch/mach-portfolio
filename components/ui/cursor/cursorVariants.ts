// Pure, dependency-free decision core for the custom cursor: given the DOM
// element the pointer is over (or null when it is over nothing special),
// return the descriptor for the shape the cursor should take. No React,
// GSAP, or DOM-listener code lives here — this is the one unit-tested seam
// of the cursor, mirroring the `transitionPhase` reducer seam (#118).

export type CursorIconName = "eye" | "mail";

export type CursorVariant =
  | { kind: "base" }
  | { kind: "link" }
  | { kind: "button" }
  | { kind: "label"; text: string; icon?: CursorIconName };

export const BASE_VARIANT: CursorVariant = { kind: "base" };

// The set of icon keys the cursor knows how to render. A `data-cursor-icon`
// value outside this set resolves to no icon rather than an error.
const KNOWN_ICONS = new Set<CursorIconName>(["eye", "mail"]);

function toIconName(value: string | null): CursorIconName | undefined {
  return value && KNOWN_ICONS.has(value as CursorIconName) ? (value as CursorIconName) : undefined;
}

export function cursorVariants(el: HTMLElement | null): CursorVariant {
  if (!el) return BASE_VARIANT;

  // A labelled element (project tiles) wins over the plain link/button
  // hints: it is the most specific opt-in.
  if (el.hasAttribute("data-cursor-text")) {
    const icon = toIconName(el.getAttribute("data-cursor-icon"));
    return {
      kind: "label",
      text: el.getAttribute("data-cursor-text") ?? "",
      ...(icon ? { icon } : {}),
    };
  }

  const cursor = el.getAttribute("data-cursor");
  if (cursor === "link") return { kind: "link" };
  if (cursor === "button") return { kind: "button" };

  return BASE_VARIANT;
}
