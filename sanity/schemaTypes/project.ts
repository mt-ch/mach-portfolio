import { defineField, defineType } from "sanity";

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      description:
        "Used on project detail pages and corpus indexing. Homepage covers use the primary, secondary, and mobile fields below.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "coverPrimary",
      title: "Homepage cover — primary",
      description: "Single-column panel on desktop in the homepage cover grid.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "coverSecondary",
      title: "Homepage cover — secondary",
      description: "Two-column panel on desktop in the homepage cover grid.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "coverMobile",
      title: "Homepage cover — mobile",
      description: "Full-width cover shown on small screens.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "coverLayout",
      title: "Homepage cover layout",
      description:
        "Controls which side spans two columns on desktop: left-dominant (primary left) or right-dominant (secondary left).",
      type: "string",
      options: {
        list: [
          { title: "Left dominant", value: "left-dominant" },
          { title: "Right dominant", value: "right-dominant" },
        ],
        layout: "radio",
      },
      initialValue: "left-dominant",
    }),
    defineField({
      name: "techStack",
      title: "Tech stack",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "skills",
      title: "Skills",
      description:
        "Controlled vocabulary of skills demonstrated by this project, distinct from the free-text tech stack.",
      type: "array",
      of: [
        {
          type: "string",
          options: {
            list: [
              "state management",
              "accessibility",
              "data visualization",
              "performance",
              "backend/infra",
              "design systems",
            ],
          },
        },
      ],
    }),
    defineField({
      name: "impact",
      title: "Impact",
      description:
        "Optional business-outcome framing, e.g. \"reduced load time 40%\" or \"led a team of 3\".",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
    }),
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [
        {
          type: "object",
          name: "link",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
              validation: (rule) => rule.required(),
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "dateCompleted",
      title: "Date completed",
      type: "date",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "summary",
      media: "coverImage",
    },
  },
});
