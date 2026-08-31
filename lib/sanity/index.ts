export { getAbout, getAboutFresh } from "./about";
export { getExperience, getExperienceEntryById } from "./experience";
export { getKnowledgeEntriesForIndex, getKnowledgeEntryById } from "./knowledge";
export { toPlainText } from "./portableText";
export {
  getFeaturedProjects,
  getOtherProjects,
  getProject,
  getProjectForIndexById,
  getProjects,
  getProjectsForIndex,
} from "./projects";
export type {
  About,
  ContentBlock,
  ExperienceEntry,
  ExperienceRole,
  FeaturedProjectListItem,
  ImageContentBlock,
  KnowledgeBaseEntry,
  OtherProjectListItem,
  PortableTextBlock,
  ProjectDetail,
  ProjectForIndex,
  ProjectListItem,
  TextContentBlock,
} from "./types";
