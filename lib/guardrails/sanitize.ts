export const DEFAULT_MAX_LENGTH = 500;

export type SanitizeResult =
  | { ok: true; value: string }
  | { ok: false; reason: "empty" | "too_long" };

const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

export function sanitizeInput(
  raw: string,
  maxLength: number = DEFAULT_MAX_LENGTH,
): SanitizeResult {
  const stripped = raw.replace(CONTROL_CHARS, "");
  const collapsed = stripped.replace(/\s+/g, " ").trim();

  if (collapsed === "") {
    return { ok: false, reason: "empty" };
  }

  if (collapsed.length > maxLength) {
    return { ok: false, reason: "too_long" };
  }

  return { ok: true, value: collapsed };
}
