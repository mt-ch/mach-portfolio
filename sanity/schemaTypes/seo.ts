import { defineField, defineType } from "sanity";

// Reusable per-page SEO controls. Embedded in documents (currently `project`)
// inside a collapsed "SEO" field group. Every field is optional — blank fields
// fall back through the three-tier chain in lib/seo/resolveSeo.
export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta title",
      description:
        "Overrides the browser tab / social-card title. Leave blank to fall back to the page title, then the site name.",
      type: "string",
      validation: (rule) =>
        rule.max(60).warning("Titles over 60 characters may be truncated in search results."),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      description:
        "Overrides the search / social-card description. Leave blank to fall back to the page summary, then the site default.",
      type: "text",
      rows: 3,
      validation: (rule) =>
        rule
          .max(160)
          .warning("Descriptions over 160 characters may be truncated in search results."),
    }),
    defineField({
      name: "ogImage",
      title: "Social image",
      description:
        "Open Graph / Twitter card image. Leave blank to fall back to the cover image, then the site default. Served at 1200x630.",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "ogImageAlt",
      title: "Social image alt text",
      description: "Falls back to the resolved page title when blank.",
      type: "string",
    }),
    defineField({
      name: "noIndex",
      title: "Hide from search engines",
      description:
        "Emits a noindex robots directive. Links on the page are still followed.",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
