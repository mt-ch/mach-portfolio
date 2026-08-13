import { Index } from "@upstash/vector";

const VOYAGE_MODEL = "voyage-4-lite";
const VOYAGE_DIMENSIONS = 512;
export const TOP_K = 4;

// The corpus-indexing pipeline (a separate ticket) writes chunks to Upstash
// Vector with this metadata shape: enough to build a citation pill without a
// second Sanity lookup. `data` carries the chunk's own embedded text.
export interface ChunkMetadata extends Record<string, unknown> {
  label: string;
  href: string;
}

export interface RetrievedChunk {
  id: string;
  score: number;
  text: string;
  label: string;
  href: string;
}

let index: Index<ChunkMetadata> | undefined;

function getIndex(): Index<ChunkMetadata> {
  if (!index) {
    index = Index.fromEnv();
  }
  return index;
}

export async function embedQuery(text: string): Promise<number[]> {
  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: [text],
      model: VOYAGE_MODEL,
      output_dimension: VOYAGE_DIMENSIONS,
      input_type: "query",
    }),
  });

  if (!response.ok) {
    throw new Error(
      `embedQuery: Voyage embeddings request failed with status ${response.status}`,
    );
  }

  const payload = (await response.json()) as {
    data: { embedding: number[] }[];
  };
  const embedding = payload.data[0]?.embedding;
  if (!embedding) {
    throw new Error("embedQuery: Voyage response contained no embedding");
  }

  return embedding;
}

export async function retrieveChunks(
  queryEmbedding: number[],
): Promise<RetrievedChunk[]> {
  const results = await getIndex().query({
    vector: queryEmbedding,
    topK: TOP_K,
    includeMetadata: true,
    includeData: true,
  });

  return results.map((match) => ({
    id: String(match.id),
    score: match.score,
    text: match.data ?? "",
    label: match.metadata?.label ?? "",
    href: match.metadata?.href ?? "",
  }));
}
