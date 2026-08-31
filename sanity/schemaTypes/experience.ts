import { defineArrayMember, defineField, defineType } from "sanity";

// One Experience document represents a company. Repeated employers appear
// once, with each stint held as a Role in the `roles` array — matching how a
// real CV reads. Display order follows the array order (roles are draggable).
export const experience = defineType({
  name: "experience",
  title: "Experience",
  type: "document",
  fields: [
    defineField({
      name: "company",
      title: "Company",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "companyUrl",
      title: "Company URL",
      type: "url",
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "roles",
      title: "Roles",
      type: "array",
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: "object",
          name: "role",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "startDate",
              title: "Start date",
              type: "date",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "endDate",
              title: "End date",
              type: "date",
              description: "Leave empty for an ongoing/current role.",
            }),
            defineField({
              name: "summary",
              title: "Summary",
              type: "array",
              of: [{ type: "block" }],
            }),
          ],
          preview: {
            select: {
              title: "title",
              startDate: "startDate",
              endDate: "endDate",
            },
            prepare({ title, startDate, endDate }) {
              const range = startDate
                ? `${startDate} – ${endDate ?? "present"}`
                : undefined;
              return { title, subtitle: range };
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "company",
      role0: "roles.0.title",
      media: "logo",
    },
    prepare({ title, role0, media }) {
      return { title, subtitle: role0, media };
    },
  },
});
