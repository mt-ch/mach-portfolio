import type { SchemaTypeDefinition } from "sanity";

import { about } from "./about";
import { imageBlock, textBlock } from "./blocks";
import { experience } from "./experience";
import { project } from "./project";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [project, experience, about, textBlock, imageBlock],
};
