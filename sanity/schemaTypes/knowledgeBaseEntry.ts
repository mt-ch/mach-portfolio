import { defineField, defineType } from "sanity";

export const knowledgeBaseEntry = defineType({
  name: "knowledgeBaseEntry",
  title: "Knowledge Base Entry",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      description:
        "Chunk header and bookkeeping only — never shown to site visitors.",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
    }),
  ],
  preview: {
    select: {
      title: "title",
      tags: "tags",
    },
    prepare({ title, tags }) {
      return { title, subtitle: (tags ?? []).join(", ") || undefined };
    },
  },
});
