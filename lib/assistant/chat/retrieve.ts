import { embedTexts } from "@/lib/assistant/corpus/embed";
import { queryChunks, type CorpusChunkMatch } from "@/lib/assistant/corpus/vectorStore";

// Fixed rather than scaled to corpus size, so retrieval behavior stays
// predictable as the corpus grows.
export const TOP_K = 6;

// Over-fetch, then trim down to TOP_K locally so the knowledge-base cap can be
// applied by score without a second round-trip to the vector store.
const OVER_FETCH_K = 12;

// Knowledge-base chunks can't fill more than ⌈k/2⌉ slots per query, so generic
// KB material never crowds out the primary portfolio content.
const MAX_KNOWLEDGE = Math.ceil(TOP_K / 2);

export async function retrieveChunks(
  message: string,
): Promise<CorpusChunkMatch[]> {
  const [vector] = await embedTexts([message]);
  if (!vector || vector.length === 0) return [];

  const matches = await queryChunks(vector, OVER_FETCH_K);
  return trimMatches(matches);
}

// Walk matches in score order: take any non-`knowledge` chunk, take `knowledge`
// chunks only until MAX_KNOWLEDGE are in, stop at TOP_K. Slots freed by the KB
// cap are backfilled by the next-best Sanity chunks. Small-index fallback: when
// the store returned no more than TOP_K, there's nothing to balance — pass them
// straight through, matching the pre-retune behaviour.
function trimMatches(matches: CorpusChunkMatch[]): CorpusChunkMatch[] {
  if (matches.length <= TOP_K) return matches;

  const selected: CorpusChunkMatch[] = [];
  let knowledgeCount = 0;

  for (const match of matches) {
    if (selected.length >= TOP_K) break;
    if (match.metadata.documentType === "knowledge") {
      if (knowledgeCount >= MAX_KNOWLEDGE) continue;
      knowledgeCount += 1;
    }
    selected.push(match);
  }

  return selected;
}
