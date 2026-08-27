import type { CorpusChunkMetadata } from "@/lib/assistant/corpus/types";
import type { CorpusChunkMatch } from "@/lib/assistant/corpus/vectorStore";

import type { ChatCitation } from "./types";

// Growth guardrail on stuffed context size, per the spec's ~4,000-6,000 token
// budget. No tokenizer is wired up for this estimate; ~4 chars/token is a
// standard-enough approximation for a size cap, not an exact count.
const MAX_CONTEXT_TOKENS = 5000;
const CHARS_PER_TOKEN = 4;
const MAX_CONTEXT_CHARS = MAX_CONTEXT_TOKENS * CHARS_PER_TOKEN;

// documentType is a closed union at the type level, but metadata is untyped
// JSON off the wire at runtime — an unrecognized value falls back to the
// About shape rather than silently mislabeling a Project/Experience citation.
function citationForMetadata(metadata: CorpusChunkMetadata): ChatCitation {
  switch (metadata.documentType) {
    case "project": {
      const slug = typeof metadata.slug === "string" ? metadata.slug : "";
      const title = typeof metadata.title === "string" ? metadata.title : "Project";
      return { label: title, href: `/projects/${slug}` };
    }
    case "experience": {
      const company = typeof metadata.company === "string" ? metadata.company : "";
      const title = typeof metadata.title === "string" ? metadata.title : "Experience";
      return { label: company ? `${title} at ${company}` : title, href: "/" };
    }
    case "about":
    default: {
      const name = typeof metadata.name === "string" ? metadata.name : "About";
      return { label: name, href: "/" };
    }
  }
}

export interface ChatContext {
  contextText: string;
  citations: ChatCitation[];
}

// Chunks arrive pre-sorted by retrieval score (best match first); that order
// is preserved both for which chunks make the token cut and for citation order.
export function buildContext(chunks: CorpusChunkMatch[]): ChatContext {
  const included: CorpusChunkMatch[] = [];
  let usedChars = 0;

  for (const chunk of chunks) {
    if (!chunk.text) continue;
    const nextChars = usedChars + chunk.text.length;
    if (included.length > 0 && nextChars > MAX_CONTEXT_CHARS) break;
    included.push(chunk);
    usedChars = nextChars;
  }

  const contextText = included
    .map((chunk) => chunk.text)
    .join("\n\n---\n\n");

  const seenDocuments = new Set<string>();
  const citations: ChatCitation[] = [];
  for (const chunk of included) {
    if (seenDocuments.has(chunk.metadata.documentId)) continue;
    seenDocuments.add(chunk.metadata.documentId);
    citations.push(citationForMetadata(chunk.metadata));
  }

  return { contextText, citations };
}
