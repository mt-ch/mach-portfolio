import { VoyageAIClient } from "voyageai";

const MODEL = "voyage-4-lite";
const OUTPUT_DIMENSION = 512;

let client: VoyageAIClient | undefined;

function getClient(): VoyageAIClient {
  if (!client) {
    client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
  }
  return client;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await getClient().embed({
    input: texts,
    model: MODEL,
    inputType: "document",
    outputDimension: OUTPUT_DIMENSION,
  });

  const data = response.data ?? [];
  return data
    .slice()
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((item) => item.embedding ?? []);
}
