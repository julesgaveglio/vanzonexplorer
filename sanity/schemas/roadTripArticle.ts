import { defineType, defineField } from "sanity";

export default defineType({
  name: "roadTripArticle",
  title: "Articles Road Trip",
  type: "document",
  icon: () => "🗺️",
  groups: [
    { name: "seo", title: "SEO" },
    { name: "content", title: "Contenu" },
    { name: "itinerary", title: "Itinéraire" },
    { name: "meta", title: "Méta" },
  ],
  fields: [
    // --- Identifiants ---
    defineField({ name: "title", title: "Titre", type: "string", group: "content",
      validation: (R) => R.required() }),
    defineField({ name: "slug", title: "Slug URL", type: "slug",
      options: { source: "title", maxLength: 96 }, group: "meta",
      validation: (R) => R.required() }),
    defineField({ name: "regionSlug", title: "Region Slug", type: "string", group: "meta",
      validation: (R) => R.required() }),
    defineField({ name: "regionName", title: "Nom de la région", type: "string", group: "meta" }),

    // --- SEO ---
    defineField({ name: "seoTitle", title: "Titre SEO (longue traîne)", type: "string", group: "seo",
      validation: (R) => R.max(70) }),
    defineField({ name: "seoDescription", title: "Meta description (155 chars)", type: "text",
      rows: 3, group: "seo", validation: (R) => R.max(155) }),
    defineField({ name: "chapeau", title: "Chapeau (answer-first, 2-3 phrases)", type: "text",
      rows: 3, group: "content",
      description: "Réponse directe à l'intention de recherche. Apparaît en haut de l'article." }),
    defineField({ name: "excerpt", title: "Extrait court (pour les cards)", type: "text",
      rows: 2, group: "content" }),

    // --- Image de couverture ---
    defineField({
      name: "coverImage",
      title: "Image de couverture",
      type: "image",
      group: "content",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Texte alternatif SEO", type: "string",
          validation: (R) => R.required() }),
        defineField({ name: "credit", title: "Crédit photo", type: "string" }),
        defineField({ name: "source", title: "Source (pixabay/serpapi/wikipedia)", type: "string" }),
      ],
    }),

    // --- Paramètres du trip ---
    defineField({ name: "duree", title: "Durée (jours)", type: "number", group: "meta",
      validation: (R) => R.min(1).max(30) }),
    defineField({ name: "style", title: "Style de voyage", type: "string", group: "meta",
      options: { list: ["aventure", "famille", "romantique", "solo", "entre amis", "roadtrip"] } }),
    defineField({ name: "profil", title: "Profil voyageur", type: "string", group: "meta" }),
    defineField({ name: "periode", title: "Période recommandée", type: "string", group: "meta" }),
    defineField({
      name: "interets",
      title: "Intérêts / activités",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      group: "meta",
    }),

    // --- Contenu intro ---
    defineField({
      name: "intro",
      title: "Introduction enrichie",
      type: "array",
      group: "content",
      of: [{ type: "block" }],
      description: "Introduction avec faits géographiques, histoire, contexte vanlife",
    }),

    // --- Jours ---
    defineField({
      name: "jours",
      title: "Jours de l'itinéraire",
      type: "array",
      group: "itinerary",
      of: [
        {
          type: "object",
          name: "jour",
          title: "Jour",
          fields: [
            defineField({ name: "numero", title: "Numéro du jour", type: "number" }),
            defineField({ name: "titre", title: "Titre du jour", type: "string" }),
            defineField({ name: "tips", title: "Conseil pratique du jour", type: "text", rows: 2 }),
            defineField({
              name: "spots",
              title: "Spots à visiter",
              type: "array",
              of: [
                {
                  type: "object",
                  name: "spot",
                  title: "Spot",
                  fields: [
                    defineField({ name: "nom", title: "Nom du spot", type: "string" }),
                    defineField({ name: "description", title: "Description enrichie", type: "text", rows: 3 }),
                    defineField({ name: "type", title: "Type", type: "string",
                      options: { list: ["nature", "village", "plage", "montagne", "culturel", "gastronomie", "sport"] } }),
                    defineField({ name: "mapsUrl", title: "Lien Google Maps", type: "url" }),
                    defineField({
                      name: "photo",
                      title: "Photo du spot",
                      type: "image",
                      options: { hotspot: true },
                      fields: [
                        defineField({ name: "alt", title: "Alt text SEO", type: "string" }),
                        defineField({ name: "credit", title: "Crédit", type: "string" }),
                      ],
                    }),
                    defineField({ name: "wikiExcerpt", title: "Extrait Wikipedia", type: "text", rows: 2 }),
                    defineField({ name: "wikiUrl", title: "URL Wikipedia", type: "url" }),
                    defineField({ name: "lat", title: "Latitude", type: "number" }),
                    defineField({ name: "lon", title: "Longitude", type: "number" }),
                  ],
                  preview: {
                    select: { title: "nom", subtitle: "type" },
                    prepare(value: Record<string, unknown>) {
                      return { title: String(value.title || "Spot sans nom"), subtitle: String(value.subtitle || "") };
                    },
                  },
                },
              ],
            }),
            defineField({
              name: "camping",
              title: "Camping recommandé",
              type: "object",
              fields: [
                defineField({ name: "nom", title: "Nom", type: "string" }),
                defineField({ name: "mapsUrl", title: "Lien Maps", type: "url" }),
                defineField({
                  name: "options",
                  title: "Options disponibles",
                  type: "array",
                  of: [{ type: "string" }],
                  options: { layout: "tags" },
                }),
              ],
            }),
            defineField({
              name: "restaurant",
              title: "Restaurant recommandé",
              type: "object",
              fields: [
                defineField({ name: "nom", title: "Nom", type: "string" }),
                defineField({ name: "type", title: "Type de cuisine", type: "string" }),
                defineField({ name: "specialite", title: "Spécialité", type: "string" }),
              ],
            }),
          ],
          preview: {
            select: { numero: "numero", titre: "titre" },
            prepare(value: Record<string, unknown>) {
              return { title: `Jour ${value.numero || "?"}`, subtitle: String(value.titre || "Sans titre") };
            },
          },
        },
      ],
    }),

    // --- Conseils pratiques ---
    defineField({
      name: "conseilsPratiques",
      title: "Conseils pratiques",
      type: "array",
      group: "content",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),

    // --- FAQ ---
    defineField({
      name: "faqItems",
      title: "FAQ",
      type: "array",
      group: "content",
      of: [
        {
          type: "object",
          name: "faqItem",
          title: "Question / Réponse",
          fields: [
            defineField({ name: "question", title: "Question", type: "string",
              validation: (R) => R.required() }),
            defineField({ name: "answer", title: "Réponse", type: "text", rows: 3,
              validation: (R) => R.required() }),
          ],
          preview: {
            select: { title: "question" },
          },
        },
      ],
    }),

    // --- En résumé ---
    defineField({
      name: "enResume",
      title: "En résumé (bullets)",
      type: "array",
      group: "content",
      of: [{ type: "string" }],
    }),

    // --- GeoJSON & score ---
    defineField({ name: "geojson", title: "GeoJSON (FeatureCollection)", type: "text",
      group: "meta", description: "JSON string du GeoJSON avec points et polylines" }),
    defineField({ name: "qualityScore", title: "Score qualité (0-100)", type: "number",
      group: "meta" }),

    // --- Statut ---
    defineField({
      name: "status",
      title: "Statut",
      type: "string",
      group: "meta",
      options: {
        list: [
          { title: "En review", value: "review" },
          { title: "Publié", value: "published" },
        ],
        layout: "radio",
      },
      initialValue: "review",
      validation: (R) => R.required(),
    }),
    defineField({ name: "publishedAt", title: "Date de publication", type: "datetime", group: "meta" }),

    // --- Maillage interne ---
    defineField({
      name: "relatedArticles",
      title: "Articles similaires",
      type: "array",
      group: "meta",
      of: [{ type: "reference", to: [{ type: "roadTripArticle" }] }],
    }),

    // --- Traçabilité ---
    defineField({ name: "sourceRequestId", title: "ID Supabase source", type: "string", group: "meta" }),
  ],

  preview: {
    select: {
      title: "title",
      region: "regionName",
      status: "status",
      score: "qualityScore",
      media: "coverImage",
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prepare(value: Record<string, any>) {
      const statusEmoji = value.status === "published" ? "✅" : "👀";
      return {
        title: String(value.title || "Sans titre"),
        subtitle: `${statusEmoji} ${value.region || "?"} · score: ${value.score ?? "—"}`,
        media: value.media,
      };
    },
  },

  orderings: [
    {
      title: "Plus récents",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
    {
      title: "Score qualité",
      name: "qualityScoreDesc",
      by: [{ field: "qualityScore", direction: "desc" }],
    },
  ],
});
