// Pure, dependency-free variant resolution — the one unit-test seam for the
// cursor. Given the nearest `[data-cursor]` element (or `null`), it returns the
// descriptor the cursor body should animate to. No DOM traversal, no GSAP: the
// caller (`useCursorInteractions`) owns `closest()` and the animation.

export type CursorIconKey = "eye" | "mail";

export type CursorVariant =
  | { kind: "base" }
  | { kind: "link" }
  | { kind: "button" }
  | { kind: "label"; text: string; icon?: CursorIconKey };

export const BASE_VARIANT: CursorVariant = { kind: "base" };

const ICON_KEYS: readonly CursorIconKey[] = ["eye", "mail"];

function toIconKey(value: string | null): CursorIconKey | undefined {
  return ICON_KEYS.includes(value as CursorIconKey) ? (value as CursorIconKey) : undefined;
}

/**
 * Resolve the cursor variant for an element. `data-cursor` is the single
 * required discriminator with three values (`link` | `button` | `label`);
 * anything else — including `null` or an untagged element — is the base dot.
 */
export function cursorVariants(element: Element | null): CursorVariant {
  const value = element?.getAttribute("data-cursor") ?? null;

  switch (value) {
    case "link":
      return { kind: "link" };
    case "button":
      return { kind: "button" };
    case "label": {
      const text = element?.getAttribute("data-cursor-label") ?? "";
      const icon = toIconKey(element?.getAttribute("data-cursor-icon") ?? null);
      return icon ? { kind: "label", text, icon } : { kind: "label", text };
    }
    default:
      return BASE_VARIANT;
  }
}
