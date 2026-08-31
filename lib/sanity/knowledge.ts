import { client, freshClient } from "./client";
import { knowledgeEntriesForIndexQuery, knowledgeEntryByIdQuery } from "./queries";
import type { KnowledgeBaseEntry } from "./types";

// Bypasses the CDN so the reindex webhook never indexes stale content from
// right after a publish. See lib/sanity/client.ts.
export async function getKnowledgeEntryById(
  id: string,
): Promise<KnowledgeBaseEntry | null> {
  return freshClient.fetch(knowledgeEntryByIdQuery, { id });
}

export async function getKnowledgeEntriesForIndex(): Promise<KnowledgeBaseEntry[]> {
  return client.fetch(knowledgeEntriesForIndexQuery);
}
