import { defineField, defineType } from "sanity";

export default defineType({
  name: "spotPaysBasque",
  title: "Spot Pays Basque",
  type: "document",
  icon: () => "📍",

  preview: {
    select: {
      title: "name",
      subtitle: "category",
      media: "mainImage",
    },
  },

  fields: [
    defineField({
      name: "name",
      title: "Nom du spot",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Catégorie",
      type: "string",
      options: {
        list: [
          { title: "Plage", value: "plage" },
          { title: "Montagne", value: "montagne" },
          { title: "Village", value: "village" },
          { title: "Surf", value: "surf" },
          { title: "Randonnée", value: "randonnée" },
          { title: "Gastronomie", value: "gastronomie" },
        ],
      },
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "mainImage",
      title: "Image principale",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Texte alternatif",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: "gallery",
      title: "Galerie photos",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Texte alternatif",
              type: "string",
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "coordinates",
      title: "Coordonnées GPS",
      type: "object",
      description: "Pour future intégration carte Mapbox",
      fields: [
        defineField({
          name: "lat",
          title: "Latitude",
          type: "number",
        }),
        defineField({
          name: "lng",
          title: "Longitude",
          type: "number",
        }),
      ],
    }),
    defineField({
      name: "highlights",
      title: "Points forts",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "seoTitle",
      title: "Titre SEO",
      type: "string",
    }),
    defineField({
      name: "seoDescription",
      title: "Description SEO",
      type: "string",
      validation: (rule) => rule.max(160),
    }),
  ],
});
