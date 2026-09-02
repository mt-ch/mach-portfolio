import { ASK_ENABLED } from "../config";

import { getVectorCount } from "./vectorStore";

// A reachable-but-empty index means backfill was never run (or wiped every
// chunk) — the chat's confidence gate then trips on every request with a
// silent refusal, so this needs to be an explicit, readable failure.
export async function checkIndexHealth(): Promise<void> {
  // The assistant is disabled (docs/adr/0013), so an empty index harms
  // nobody — don't force a backfill just to build the site. The gate
  // restores itself when ASK_ENABLED goes back to true.
  if (!ASK_ENABLED) return;

  const vectorCount = await getVectorCount();

  if (vectorCount === 0) {
    throw new Error(
      "Vector index is empty: the chat assistant will refuse every question. Run `pnpm backfill` against this environment's Upstash index.",
    );
  }
}
