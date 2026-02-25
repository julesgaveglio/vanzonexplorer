import { defineType, defineField } from "sanity";

export default defineType({
  name: "heroImages",
  title: "Images Hero",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Titre du carousel",
      type: "string",
      description: "Nom interne pour identifier ce carousel",
    }),
    defineField({
      name: "images",
      title: "Images du carousel",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "image",
              title: "Image",
              type: "image",
              options: {
                hotspot: true,
              },
              fields: [
                defineField({
                  name: "alt",
                  title: "Texte alternatif",
                  type: "string",
                  description: "Description pour l'accessibilité et le SEO",
                }),
              ],
            }),
            defineField({
              name: "title",
              title: "Titre de l'image",
              type: "string",
              description: "Titre optionnel pour cette image",
            }),
          ],
          preview: {
            select: {
              image: "image",
              title: "title",
            },
            prepare({ image, title }) {
              return {
                title: title || "Image sans titre",
                media: image,
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.min(1).max(5).error("Le carousel doit contenir entre 1 et 5 images"),
    }),
    defineField({
      name: "isActive",
      title: "Carousel actif",
      type: "boolean",
      description: "Désactive pour utiliser une image fixe à la place",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      imageCount: "images",
      isActive: "isActive",
    },
    prepare({ title, imageCount, isActive }) {
      return {
        title: title || "Images Hero",
        subtitle: `${imageCount?.length || 0} images - ${isActive ? "Actif" : "Inactif"}`,
      };
    },
  },
});
