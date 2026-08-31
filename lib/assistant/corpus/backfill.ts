import {
  getAbout,
  getExperience,
  getKnowledgeEntriesForIndex,
  getProjectsForIndex,
} from "@/lib/sanity";

import { chunkAbout, chunkExperience, chunkKnowledgeEntry, chunkProject } from "./chunk";
import { reindexChunks } from "./reindexDocument";

export interface BackfillResult {
  documentsIndexed: number;
  chunksIndexed: number;
}

// Full reindex over the entire corpus (About + every Project + every
// Experience + every Knowledge Base Entry), on demand. Run via `pnpm backfill`.
export async function runBackfill(): Promise<BackfillResult> {
  const [about, experience, projects, knowledgeEntries] = await Promise.all([
    getAbout(),
    getExperience(),
    getProjectsForIndex(),
    getKnowledgeEntriesForIndex(),
  ]);

  let documentsIndexed = 0;
  let chunksIndexed = 0;

  if (about) {
    chunksIndexed += await reindexChunks(about._id, chunkAbout(about));
    documentsIndexed += 1;
  }

  for (const entry of experience) {
    chunksIndexed += await reindexChunks(entry._id, chunkExperience(entry));
    documentsIndexed += 1;
  }

  for (const project of projects) {
    chunksIndexed += await reindexChunks(project._id, chunkProject(project));
    documentsIndexed += 1;
  }

  for (const entry of knowledgeEntries) {
    chunksIndexed += await reindexChunks(entry._id, chunkKnowledgeEntry(entry));
    documentsIndexed += 1;
  }

  return { documentsIndexed, chunksIndexed };
}
