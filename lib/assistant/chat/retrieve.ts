import { embedTexts } from "@/lib/assistant/corpus/embed";
import { queryChunks, type CorpusChunkMatch } from "@/lib/assistant/corpus/vectorStore";

// Fixed rather than scaled to corpus size, so retrieval behavior stays
// predictable as the corpus grows.
export const TOP_K = 4;

export async function retrieveChunks(
  message: string,
): Promise<CorpusChunkMatch[]> {
  const [vector] = await embedTexts([message]);
  if (!vector || vector.length === 0) return [];

  return queryChunks(vector, TOP_K);
}
