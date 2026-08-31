import type { CorpusChunkMatch } from "@/lib/assistant/corpus/vectorStore";

import type { ProjectReference } from "./types";

// Growth guardrail on stuffed context size, per the spec's ~4,000-6,000 token
// budget. No tokenizer is wired up for this estimate; ~4 chars/token is a
// standard-enough approximation for a size cap, not an exact count.
const MAX_CONTEXT_TOKENS = 6000;
const CHARS_PER_TOKEN = 4;
const MAX_CONTEXT_CHARS = MAX_CONTEXT_TOKENS * CHARS_PER_TOKEN;

export interface ChatContext {
  contextText: string;
}

// Chunks arrive pre-sorted by retrieval score (best match first); that order
// is preserved for which chunks make the token cut.
export function buildContext(chunks: CorpusChunkMatch[]): ChatContext {
  const included: CorpusChunkMatch[] = [];
  let usedChars = 0;

  for (const chunk of chunks) {
    if (!chunk.text) continue;
    const nextChars = usedChars + chunk.text.length;
    if (included.length > 0 && nextChars > MAX_CONTEXT_CHARS) break;
    included.push(chunk);
    usedChars = nextChars;
  }

  const contextText = included
    .map((chunk) => chunk.text)
    .join("\n\n---\n\n");

  return { contextText };
}

// The card only renders if the model-asserted slug matches a Project chunk
// that was actually retrieved for this answer — never for `knowledge`, never
// for About/Experience, never for a slug retrieval didn't surface.
export function projectReferenceFrom(
  chunks: CorpusChunkMatch[],
  assertedSlug: string | null,
): ProjectReference | null {
  if (!assertedSlug) return null;

  for (const chunk of chunks) {
    if (chunk.metadata.documentType !== "project") continue;
    if (chunk.metadata.slug !== assertedSlug) continue;

    const title =
      typeof chunk.metadata.title === "string" ? chunk.metadata.title : "Project";
    const summary =
      typeof chunk.metadata.summary === "string" ? chunk.metadata.summary : "";
    const imageUrl =
      typeof chunk.metadata.imageUrl === "string" ? chunk.metadata.imageUrl : null;

    return { slug: assertedSlug, title, summary, imageUrl };
  }

  return null;
}
