import type {
  About,
  ExperienceEntry,
  KnowledgeBaseEntry,
  PortableTextBlock,
  ProjectForIndex,
} from "@/lib/sanity";
import { urlFor } from "@/lib/sanity/image";

import { flattenStory, splitAtHeadings, toPlainText } from "./portableText";
import {
  templateAboutHeader,
  templateExperienceHeader,
  templateKnowledgeHeader,
  templateProjectHeader,
} from "./templates";
import type { CorpusChunk, CorpusChunkMetadata, CorpusDocumentType } from "./types";

function buildChunks(
  documentId: string,
  documentType: CorpusDocumentType,
  header: string,
  body: PortableTextBlock[] | null | undefined,
  metadata: CorpusChunkMetadata,
): CorpusChunk[] {
  const sections = splitAtHeadings(body);
  // No sections (empty/missing body) still yields one chunk, matching the
  // "one chunk per document by default" rule even for placeholder content.
  const bodySections = sections.length > 0 ? sections : [{ heading: null, text: "" }];

  return bodySections.map((section, index) => ({
    id: `${documentId}:${index}`,
    documentId,
    documentType,
    text: [header, section.heading ? `## ${section.heading}` : null, section.text || null]
      .filter((part): part is string => !!part)
      .join("\n\n"),
    metadata,
  }));
}

export function chunkProject(project: ProjectForIndex): CorpusChunk[] {
  const metadata: CorpusChunkMetadata = {
    documentType: "project",
    documentId: project._id,
    title: project.title,
    slug: project.slug.current,
    techStack: project.techStack ?? [],
    skills: project.skills ?? [],
    impact: project.impact ?? [],
    dateCompleted: project.dateCompleted ?? null,
    summary: project.summary,
    imageUrl: project.coverImage
      ? urlFor(project.coverImage).width(480).height(270).fit("crop").auto("format").url()
      : null,
  };
  return buildChunks(
    project._id,
    "project",
    templateProjectHeader(project),
    flattenStory(project.story),
    metadata,
  );
}

export function chunkExperience(entry: ExperienceEntry): CorpusChunk[] {
  // Roles are ordered most-recent-first in the Studio; the leading role names
  // the citation, and the company counts as current if any role is ongoing.
  const metadata: CorpusChunkMetadata = {
    documentType: "experience",
    documentId: entry._id,
    company: entry.company,
    title: entry.roles[0]?.title ?? entry.company,
    roleTitles: entry.roles.map((role) => role.title),
    isCurrent: entry.roles.some((role) => role.isCurrent),
  };
  // All roles are folded into the header by templateExperienceHeader, so the
  // company document yields exactly one corpus entry.
  return buildChunks(
    entry._id,
    "experience",
    templateExperienceHeader(entry),
    null,
    metadata,
  );
}

// One Knowledge Base Entry always yields exactly one chunk — no
// splitAtHeadings — since these are short hand-authored notes, not
// multi-section case studies.
export function chunkKnowledgeEntry(entry: KnowledgeBaseEntry): CorpusChunk[] {
  const metadata: CorpusChunkMetadata = {
    documentType: "knowledge",
    documentId: entry._id,
    title: entry.title,
    tags: entry.tags ?? [],
  };
  const text = [templateKnowledgeHeader(entry), toPlainText(entry.body) || null]
    .filter((part): part is string => !!part)
    .join("\n\n");

  return [
    {
      id: `${entry._id}:0`,
      documentId: entry._id,
      documentType: "knowledge",
      text,
      metadata,
    },
  ];
}

export function chunkAbout(about: About): CorpusChunk[] {
  const metadata: CorpusChunkMetadata = {
    documentType: "about",
    documentId: about._id,
    name: about.name,
    headline: about.headline,
    email: about.email,
  };
  return buildChunks(about._id, "about", templateAboutHeader(about), about.bio, metadata);
}
