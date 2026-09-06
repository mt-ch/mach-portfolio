import { defineField, defineType } from "sanity";

const ASPECT_RATIO_OPTIONS = [
  { title: "Landscape (16:9)", value: "16:9" },
  { title: "Standard (4:3)", value: "4:3" },
  { title: "Wide (3:2)", value: "3:2" },
  { title: "Portrait (4:5)", value: "4:5" },
];

function imageField(name: string, title: string, required: boolean) {
  return defineField({
    name,
    title,
    type: "image",
    description:
      "Crop toward one of the target ratios: landscape 16:9, standard 4:3, or portrait 4:5. In a Full or Pair layout this image crops (object-cover) to its own Aspect ratio setting below — your hotspot controls what stays in view. In an Inset layout this setting is ignored and the image renders your crop as-is, uncropped.",
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Alt text",
        type: "string",
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: "aspectRatio",
        title: "Aspect ratio",
        description:
          "Only used by Full and Pair layouts (ignored by Inset). Set independently per image and per breakpoint, so a pair's two images — or the same image on mobile vs. desktop — can crop differently.",
        type: "object",
        options: { collapsible: true, collapsed: true },
        fields: [
          defineField({
            name: "desktop",
            title: "Desktop",
            type: "string",
            options: { list: ASPECT_RATIO_OPTIONS, layout: "radio" },
            initialValue: "16:9",
          }),
          defineField({
            name: "mobile",
            title: "Mobile",
            type: "string",
            options: { list: ASPECT_RATIO_OPTIONS, layout: "radio" },
            initialValue: "16:9",
          }),
        ],
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
