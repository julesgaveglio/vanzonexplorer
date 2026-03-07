import { defineType, defineField } from "sanity";

export default defineType({
  name: "siteSettings",
  title: "Parametres du site",
  type: "document",
  fields: [
    defineField({
      name: "openGraphImage",
      title: "Image Open Graph par defaut",
      description:
        "Image affichee lors du partage sur les reseaux sociaux (WhatsApp, Twitter, LinkedIn). Taille recommandee : 1200 x 630 px.",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Texte alternatif",
          type: "string",
          initialValue: "Vanzon Explorer — Location de vans amenages au Pays Basque",
        }),
      ],
    }),
    defineField({
      name: "twitterHandle",
      title: "Compte Twitter / X (optionnel)",
      type: "string",
      placeholder: "@vanzonexplorer",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Parametres du site" };
    },
  },
});
