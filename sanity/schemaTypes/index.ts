import type { SchemaTypeDefinition } from "sanity";

import { about } from "./about";
import { imageBlock, textBlock } from "./blocks";
import { experience } from "./experience";
import { knowledgeBaseEntry } from "./knowledgeBaseEntry";
import { project } from "./project";
import { seo } from "./seo";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [project, experience, about, knowledgeBaseEntry, textBlock, imageBlock, seo],
};
