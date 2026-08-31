import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { NextResponse } from "next/server";

import {
  chunkAbout,
  chunkExperience,
  chunkKnowledgeEntry,
  chunkProject,
} from "@/lib/assistant/corpus/chunk";
import { reindexChunks } from "@/lib/assistant/corpus/reindexDocument";
import type { CorpusChunk } from "@/lib/assistant/corpus/types";
import {
  getAboutFresh,
  getExperienceEntryById,
  getKnowledgeEntryById,
  getProjectForIndexById,
} from "@/lib/sanity";

// The Publish trigger sends {_id, _type} for the live document. The Delete
// trigger is configured with a `before()` GROQ projection so it sends the
// same shape for a document that no longer exists — see README for the
// Sanity webhook setup.
type WebhookPayload = {
  _id: string;
  _type: string;
};

export async function POST(request: Request) {
  const secret = process.env.SANITY_REINDEX_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: "Reindex secret is not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get(SIGNATURE_HEADER_NAME);
  const body = await request.text();

  if (!signature || !(await isValidSignature(body, signature, secret))) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body) as WebhookPayload;
  // Always refetch the document by id rather than trusting the webhook
  // payload's content — an empty result (deleted/unpublished) purges via
  // reindexChunks' delete-then-upsert with no chunks to upsert.
  const chunks = await fetchChunksForDocument(payload);
  const chunksIndexed = await reindexChunks(payload._id, chunks);

  return NextResponse.json({
    reindexed: true,
    documentId: payload._id,
    chunksIndexed,
  });
}

async function fetchChunksForDocument(payload: WebhookPayload): Promise<CorpusChunk[]> {
  switch (payload._type) {
    case "project": {
      const project = await getProjectForIndexById(payload._id);
      return project ? chunkProject(project) : [];
    }
    case "experience": {
      const entry = await getExperienceEntryById(payload._id);
      return entry ? chunkExperience(entry) : [];
    }
    case "about": {
      const about = await getAboutFresh();
      return about && about._id === payload._id ? chunkAbout(about) : [];
    }
    case "knowledgeBaseEntry": {
      const entry = await getKnowledgeEntryById(payload._id);
      return entry ? chunkKnowledgeEntry(entry) : [];
    }
    default:
      return [];
  }
}
