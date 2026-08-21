import type { About, ExperienceEntry, PortableTextBlock, ProjectForIndex } from "@/lib/sanity";

import { flattenStory, splitAtHeadings } from "./portableText";
import {
  templateAboutHeader,
  templateExperienceHeader,
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
  const metadata: CorpusChunkMetadata = {
    documentType: "experience",
    documentId: entry._id,
    company: entry.company,
    title: entry.title,
    startDate: entry.startDate,
    endDate: entry.endDate,
    isCurrent: entry.isCurrent,
  };
  return buildChunks(
    entry._id,
    "experience",
    templateExperienceHeader(entry),
    entry.summary,
    metadata,
  );
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
