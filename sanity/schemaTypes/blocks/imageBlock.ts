import { defineField, defineType } from "sanity";

function imageField(name: string, title: string, required: boolean) {
  return defineField({
    name,
    title,
    type: "image",
    description:
      "Crop toward one of the target ratios: landscape 16:9, standard 4:3, or portrait 4:5. The site renders your crop as-is at its natural ratio (no forced centre-crop), so what you frame here is what visitors see.",
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Alt text",
        type: "string",
        validation: (rule) => rule.required(),
      }),
    ],
    validation: required ? (rule) => rule.required() : undefined,
  });
}

export const imageBlock = defineType({
  name: "imageBlock",
  title: "Image block",
  type: "object",
  fields: [
    imageField("image", "Image", true),
    imageField("secondImage", "Second image", false),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
    }),
    defineField({
      name: "layout",
      title: "Layout",
      type: "string",
      options: {
        list: [
          { title: "Full", value: "full" },
          { title: "Inset", value: "inset" },
          { title: "Pair", value: "pair" },
        ],
        layout: "radio",
      },
      initialValue: "full",
      validation: (rule) =>
        rule.required().custom((layout, context) => {
          const parent = context.parent as { secondImage?: unknown } | undefined;
          if (layout === "pair" && !parent?.secondImage) {
            return "Pair layout requires a second image.";
          }
          return true;
        }),
    }),
  ],
  preview: {
    select: { media: "image", caption: "caption", layout: "layout" },
    prepare({ media, caption, layout }) {
      return {
        title: "Image block",
        subtitle: caption || layout,
        media,
      };
    },
  },
});
