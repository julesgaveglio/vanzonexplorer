import { defineField, defineType } from "sanity";

export default defineType({
  name: "article",
  title: "Article",
  type: "document",
  icon: () => "📝",

  preview: {
    select: {
      title: "title",
      subtitle: "category",
      media: "coverImage",
    },
  },

  fields: [
    defineField({
      name: "title",
      title: "Titre",
      type: "string",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (R) => R.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Résumé",
      type: "text",
      rows: 3,
      validation: (R) => R.required().max(300),
    }),
    defineField({
      name: "coverImage",
      title: "Image de couverture",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Texte alternatif", type: "string" }),
        defineField({ name: "credit", title: "Crédit (ex: Photo by X on Pexels)", type: "string" }),
        defineField({ name: "pexelsId", title: "Pexels ID", type: "number" }),
        defineField({ name: "pexelsUrl", title: "Pexels URL", type: "url" }),
      ],
    }),
    defineField({
      name: "category",
      title: "Catégorie",
      type: "string",
      options: {
        list: [
          { title: "Road Trips", value: "Road Trips" },
          { title: "Pays Basque", value: "Pays Basque" },
          { title: "Aménagement Van", value: "Aménagement Van" },
          { title: "Business Van", value: "Business Van" },
          { title: "Achat Van", value: "Achat Van" },
          { title: "Club Privé", value: "Club Privé" },
        ],
      },
      validation: (R) => R.required(),
    }),
    defineField({
      name: "tag",
      title: "Tag (ex: Guide complet, Top 10…)",
      type: "string",
    }),
    defineField({
      name: "readTime",
      title: "Temps de lecture (ex: 8 min)",
      type: "string",
    }),
    defineField({
      name: "content",
      title: "Contenu",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "Citation", value: "blockquote" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Lien",
                fields: [{ name: "href", type: "url", title: "URL" }],
              },
            ],
          },
        },
        { type: "image", options: { hotspot: true } },
      ],
    }),
    defineField({
      name: "publishedAt",
      title: "Date de publication",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "featured",
      title: "Article mis en avant",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "seoTitle",
      title: "Titre SEO",
      type: "string",
    }),
    defineField({
      name: "seoDescription",
      title: "Description SEO",
      type: "text",
      rows: 2,
    }),
  ],
});
