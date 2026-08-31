export type CorpusDocumentType =
  | "about"
  | "project"
  | "experience"
  | "knowledge";

export type CorpusChunkMetadataValue =
  | string
  | number
  | boolean
  | string[]
  | null;

export type CorpusChunkMetadata = Record<string, CorpusChunkMetadataValue> & {
  documentType: CorpusDocumentType;
  documentId: string;
};

export interface CorpusChunk {
  // Positional: `${documentId}:${index within document}`.
  id: string;
  documentId: string;
  documentType: CorpusDocumentType;
  text: string;
  metadata: CorpusChunkMetadata;
}
