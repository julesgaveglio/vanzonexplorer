import { defineType, defineField } from "sanity";

export default defineType({
  name: "formationCard",
  title: "Cartes Formation",
  type: "document",
  icon: () => "🎓",

  fields: [
    defineField({
      name: "title",
      title: "Titre",
      type: "string",
      validation: (Rule) => Rule.required().error("Le titre est obligatoire"),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "string",
    }),
    defineField({
      name: "image",
      title: "Image",
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
      name: "sortOrder",
      title: "Ordre d'affichage",
      type: "number",
      initialValue: 0,
    }),
  ],

  preview: {
    select: {
      title: "title",
      subtitle: "description",
      media: "image",
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || "Sans titre",
        subtitle: subtitle || "—",
        media,
      };
    },
  },

  orderings: [
    {
      title: "Ordre d'affichage",
      name: "sortOrderAsc",
      by: [{ field: "sortOrder", direction: "asc" }],
    },
  ],
});
