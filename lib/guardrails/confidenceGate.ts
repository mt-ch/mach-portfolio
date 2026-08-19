import type { CorpusChunkMatch } from "@/lib/corpus/vectorStore";

// Below this, retrieval didn't find anything meaningfully related to the
// question — generating against weak context risks a hallucinated answer,
// so generation is skipped in favor of the fixed refusal.
export const MIN_RETRIEVAL_CONFIDENCE = 0.5;

export function passesConfidenceGate(chunks: CorpusChunkMatch[]): boolean {
  if (chunks.length === 0) return false;
  return chunks[0].score >= MIN_RETRIEVAL_CONFIDENCE;
}
