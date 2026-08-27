import { checkIndexHealth } from "@/lib/assistant/corpus/indexHealth";

checkIndexHealth()
  .then(() => {
    console.log("Vector index health check passed: index is populated.");
  })
  .catch((error) => {
    console.error("Vector index health check failed:", error);
    process.exitCode = 1;
  });
