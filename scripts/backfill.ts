import { runBackfill } from "@/lib/assistant/corpus/backfill";

runBackfill()
  .then(({ documentsIndexed, chunksIndexed }) => {
    console.log(
      `Backfill complete: ${documentsIndexed} documents, ${chunksIndexed} chunks upserted.`,
    );
  })
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  });
