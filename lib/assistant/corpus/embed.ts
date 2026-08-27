import { VoyageAIClient, VoyageAIError } from "voyageai";

const MODEL = "voyage-4-lite";
const OUTPUT_DIMENSION = 512;

// Free-tier Voyage AI caps at 3 requests/min, so a burst of documents needs
// room to back off across multiple 429s rather than a couple of quick retries
// — the delay cap keeps a single retry from stalling indefinitely while still
// letting the cumulative backoff span past a full rate-limit window.
const MAX_ATTEMPTS = 8;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 20000;

let client: VoyageAIClient | undefined;

function getClient(): VoyageAIClient {
  if (!client) {
    client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
  }
  return client;
}

function isRateLimitError(error: unknown): error is VoyageAIError {
  return error instanceof VoyageAIError && error.statusCode === 429;
}

function retryDelayMs(error: VoyageAIError, attempt: number): number {
  const retryAfter = error.rawResponse?.headers?.get?.("retry-after");
  const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : NaN;
  if (Number.isFinite(retryAfterMs) && retryAfterMs > 0) return retryAfterMs;
  return Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedWithRetry(
  texts: string[],
  retry: boolean,
): Promise<Awaited<ReturnType<VoyageAIClient["embed"]>>> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await getClient().embed({
        input: texts,
        model: MODEL,
        inputType: "document",
        outputDimension: OUTPUT_DIMENSION,
      });
    } catch (error) {
      if (!retry || !isRateLimitError(error) || attempt >= MAX_ATTEMPTS) throw error;
      await sleep(retryDelayMs(error, attempt));
    }
  }
}

export interface EmbedTextsOptions {
  // Retries a 429 with backoff. Only safe for offline/batch callers (e.g.
  // backfill) — the interactive chat request path must fail fast instead of
  // risking a serverless-timeout-length hang, so it leaves this off.
  retry?: boolean;
}

export async function embedTexts(
  texts: string[],
  { retry = false }: EmbedTextsOptions = {},
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await embedWithRetry(texts, retry);

  const data = response.data ?? [];
  return data
    .slice()
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((item) => item.embedding ?? []);
}
