import { defineField, defineType } from "sanity";

export const about = defineType({
  name: "about",
  title: "About",
  type: "document",
  groups: [
    {
      name: "seoDefaults",
      title: "Site SEO Defaults",
    },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "headline",
      title: "Headline",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      description: "Hero mark shown below the intro on the homepage.",
      type: "image",
    }),
    defineField({
      name: "footerText",
      title: "Footer text",
      description: "Generic message shown in the site footer.",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "whatIDo",
      title: "What I do",
      description:
        'Service list shown in the homepage "What I do" section. Hidden when empty.',
      type: "array",
      of: [
        {
          type: "object",
          name: "serviceItem",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "text",
              rows: 3,
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: { title: "title", subtitle: "description" },
          },
        },
      ],
    }),
    defineField({
      name: "resumeFile",
      title: "Resume file",
      type: "file",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: "howIWork",
      title: "How I work",
      description:
        'Homepage "How I work" section, composed of the same Text and Image blocks as a Project story. Leave empty to hide the section.',
      type: "array",
      of: [{ type: "textBlock" }, { type: "imageBlock" }],
    }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "array",
      of: [
        {
          type: "object",
          name: "socialLink",
          fields: [
            defineField({
              name: "platform",
              title: "Platform",
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
      name: "siteName",
      title: "Site name",
      description:
        "Brand name used across social-share cards and as the default browser tab title.",
      type: "string",
      group: "seoDefaults",
    }),
    defineField({
      name: "titleTemplate",
      title: "Title template",
      description:
        'Applied to every page-level title. Use %s as the page title placeholder, e.g. "%s | Matt Chan".',
      type: "string",
      group: "seoDefaults",
    }),
    defineField({
      name: "defaultMetaDescription",
      title: "Default meta description",
      description:
        "Used for pages that do not set their own meta description.",
      type: "text",
      rows: 3,
      group: "seoDefaults",
    }),
    defineField({
      name: "defaultOgImage",
      title: "Default social image",
      description:
        "Fallback Open Graph / Twitter card image. Served at 1200x630.",
      type: "image",
      group: "seoDefaults",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "headline",
    },
  },
});
