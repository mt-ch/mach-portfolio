import { defineField, defineType } from "sanity";

export const textBlock = defineType({
  name: "textBlock",
  title: "Text block",
  type: "object",
  fields: [
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [{ type: "block" }],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { content: "content" },
    prepare({ content }) {
      const firstBlock = (content ?? []).find(
        (block: { _type?: string }) => block._type === "block",
      );
      const text = (firstBlock?.children ?? [])
        .map((span: { text?: string }) => span.text ?? "")
        .join("");
      return { title: "Text block", subtitle: text || undefined };
    },
  },
});
