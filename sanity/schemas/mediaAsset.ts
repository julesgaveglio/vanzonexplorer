import { defineType, defineField } from "sanity";

export default defineType({
  name: "mediaAsset",
  title: "Médiathèque",
  type: "document",
  icon: () => "📸",

  fields: [
    defineField({
      name: "title",
      title: "Nom de l'image",
      type: "string",
      validation: (Rule) => Rule.required().error("Le nom est obligatoire"),
    }),
    defineField({
      name: "category",
      title: "Catégorie",
      type: "string",
      options: {
        list: [
          { title: "Van Yoni", value: "van-yoni" },
          { title: "Van Xalbat", value: "van-xalbat" },
          { title: "Équipe", value: "equipe" },
          { title: "Pays Basque", value: "pays-basque" },
          { title: "Formation", value: "formation" },
          { title: "Divers", value: "divers" },
          { title: "Road Trip", value: "road-trip" },
        ],
        layout: "dropdown",
      },
      validation: (Rule) => Rule.required(),
    }),
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
          title: "Texte alternatif (SEO)",
          type: "string",
          validation: (Rule) =>
            Rule.required().error("Le texte alternatif est obligatoire pour le SEO"),
        }),
        defineField({
          name: "credit",
          title: "Crédit photo",
          type: "string",
        }),
      ],
      validation: (Rule) => Rule.required().error("L'image est obligatoire"),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    }),
    defineField({
      name: "usedIn",
      title: "Utilisée dans",
      type: "string",
      description: "Note d'usage : ex. \"Hero accueil, Card Yoni\"",
    }),
    defineField({
      name: "htmlLink",
      title: "🔗 Lien HTML (généré automatiquement)",
      type: "string",
      readOnly: true,
      description: "URL de l'image. Copie ce lien et donne-le au développeur.",
    }),
  ],

  preview: {
    select: {
      title: "title",
      subtitle: "category",
      media: "image",
      alt: "image.alt",
      tags: "tags",
    },
    prepare({ title, subtitle, media, alt, tags }) {
      const categoryLabels: Record<string, string> = {
        "van-yoni": "🚐 Van Yoni",
        "van-xalbat": "🚐 Van Xalbat",
        equipe: "👥 Équipe",
        "pays-basque": "🏔️ Pays Basque",
        formation: "🎓 Formation",
        divers: "📁 Divers",
        "road-trip": "🗺️ Road Trip",
      };
      return {
        title: title || "Sans titre",
        subtitle: `${categoryLabels[subtitle] || subtitle || "—"} · ${alt || "⚠️ Pas de alt"} ${tags?.length ? `· ${tags.join(", ")}` : ""}`,
        media,
      };
    },
  },

  orderings: [
    {
      title: "Catégorie → Nom",
      name: "categoryAsc",
      by: [
        { field: "category", direction: "asc" },
        { field: "title", direction: "asc" },
      ],
    },
  ],
});
