import { defineField, defineType } from "sanity";

export default defineType({
  name: "testimonial",
  title: "Témoignage",
  type: "document",
  icon: () => "💬",

  preview: {
    select: {
      title: "name",
      subtitle: "role",
      media: "photo",
    },
  },

  fields: [
    defineField({
      name: "name",
      title: "Nom",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      title: "Rôle",
      type: "string",
      description: "Ex : Locataire, Acheteur, Élève formation",
    }),
    defineField({
      name: "content",
      title: "Témoignage",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "rating",
      title: "Note",
      type: "number",
      initialValue: 5,
      validation: (rule) => rule.required().min(1).max(5),
    }),
    defineField({
      name: "photo",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Texte alternatif",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "featured",
      title: "Mettre en avant",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
