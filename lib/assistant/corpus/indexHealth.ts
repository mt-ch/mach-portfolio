import { getVectorCount } from "./vectorStore";

// A reachable-but-empty index means backfill was never run (or wiped every
// chunk) — the chat's confidence gate then trips on every request with a
// silent refusal, so this needs to be an explicit, readable failure.
export async function checkIndexHealth(): Promise<void> {
  const vectorCount = await getVectorCount();

  if (vectorCount === 0) {
    throw new Error(
      "Vector index is empty: the chat assistant will refuse every question. Run `pnpm backfill` against this environment's Upstash index.",
    );
  }
}
