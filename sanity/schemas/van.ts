import { defineField, defineType } from "sanity";

export default defineType({
  name: "van",
  title: "Van",
  type: "document",
  icon: () => "🚐",

  fieldsets: [
    { name: "identite", title: "Identité", options: { collapsible: true, collapsed: false } },
    { name: "medias", title: "Médias", options: { collapsible: true, collapsed: false } },
    { name: "caracteristiques", title: "Caractéristiques", options: { collapsible: true, collapsed: true } },
    { name: "tarification", title: "Tarification & Réservation", options: { collapsible: true, collapsed: true } },
    { name: "equipements", title: "Équipements", options: { collapsible: true, collapsed: true } },
    { name: "contenu", title: "Contenu", options: { collapsible: true, collapsed: true } },
    { name: "seo", title: "SEO", options: { collapsible: true, collapsed: true } },
  ],

  // Aperçu dans la liste du Studio
  preview: {
    select: {
      title: "name",
      subtitle: "tagline",
      media: "mainImage",
    },
  },

  fields: [
    // ══════════════════════════════════
    // ── IDENTITÉ
    // ══════════════════════════════════
    defineField({
      name: "name",
      title: "Nom du van",
      type: "string",
      fieldset: "identite",
      validation: (rule) => rule.required().min(2).max(80),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      fieldset: "identite",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "offerType",
      title: "Type d'offre",
      type: "array",
      fieldset: "identite",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Location", value: "location" },
          { title: "Achat", value: "achat" },
        ],
        layout: "grid",
      },
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "status",
      title: "Statut",
      type: "string",
      fieldset: "identite",
      initialValue: "available",
      options: {
        list: [
          { title: "Disponible", value: "available" },
          { title: "Réservé", value: "reserved" },
          { title: "Vendu", value: "sold" },
          { title: "En préparation", value: "preparing" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "tagline",
      title: "Accroche courte",
      type: "string",
      fieldset: "identite",
      description: "Ex : « Le compagnon idéal pour explorer la côte basque »",
    }),
    defineField({
      name: "featured",
      title: "Mettre en avant",
      type: "boolean",
      fieldset: "identite",
      initialValue: false,
      description: "Afficher ce van sur la page d'accueil",
    }),
    defineField({
      name: "sortOrder",
      title: "Ordre d'affichage",
      type: "number",
      fieldset: "identite",
      initialValue: 99,
    }),

    // ══════════════════════════════════
    // ── MÉDIAS
    // ══════════════════════════════════
    defineField({
      name: "mainImage",
      title: "Image principale",
      type: "image",
      fieldset: "medias",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Texte alternatif",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "gallery",
      title: "Galerie photos",
      type: "array",
      fieldset: "medias",
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

    // ══════════════════════════════════
    // ── CARACTÉRISTIQUES TECHNIQUES
    // ══════════════════════════════════
    defineField({
      name: "vanType",
      title: "Type de véhicule",
      type: "string",
      fieldset: "caracteristiques",
      options: {
        list: [
          { title: "Fourgon", value: "fourgon" },
          { title: "Camping-car", value: "camping-car" },
          { title: "Combi", value: "combi" },
          { title: "Utilitaire", value: "utilitaire" },
        ],
      },
    }),
    defineField({
      name: "brand",
      title: "Marque",
      type: "string",
      fieldset: "caracteristiques",
      description: "Ford, Mercedes, VW, Fiat…",
    }),
    defineField({
      name: "model",
      title: "Modèle",
      type: "string",
      fieldset: "caracteristiques",
    }),
    defineField({
      name: "year",
      title: "Année",
      type: "number",
      fieldset: "caracteristiques",
      validation: (rule) => rule.min(1990).max(2030),
    }),
    defineField({
      name: "mileage",
      title: "Kilométrage",
      type: "number",
      fieldset: "caracteristiques",
      description: "Pour les vans à la vente uniquement",
    }),
    defineField({
      name: "capacity",
      title: "Nombre de couchages",
      type: "number",
      fieldset: "caracteristiques",
      validation: (rule) => rule.min(1).max(8),
    }),
    defineField({
      name: "length",
      title: "Longueur totale (m)",
      type: "number",
      fieldset: "caracteristiques",
      description: "Longueur totale en mètres",
    }),

    // ══════════════════════════════════
    // ── TARIFICATION & RÉSERVATION
    // ══════════════════════════════════
    defineField({
      name: "startingPricePerNight",
      title: "Prix plancher — location (€/nuit)",
      type: "number",
      fieldset: "tarification",
      description:
        "Prix minimum indicatif affiché sur le site avec le préfixe « À partir de ». Le prix réel et dynamique est sur la plateforme de réservation externe.",
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "salePrice",
      title: "Prix de vente (€)",
      type: "number",
      fieldset: "tarification",
      description: "Prix fixe pour les vans à l'achat",
    }),
    defineField({
      name: "externalBookingUrl",
      title: "URL de réservation externe",
      type: "url",
      fieldset: "tarification",
      description:
        "URL Yescapa / Outdoorsy / Privatecar — le prix réel selon les dates sera affiché directement sur la plateforme",
    }),
    defineField({
      name: "externalBookingPlatform",
      title: "Plateforme de réservation",
      type: "string",
      fieldset: "tarification",
      options: {
        list: [
          { title: "Yescapa", value: "Yescapa" },
          { title: "Outdoorsy", value: "Outdoorsy" },
          { title: "Privatecar", value: "Privatecar" },
          { title: "Autre", value: "Autre" },
        ],
      },
    }),
    defineField({
      name: "insuranceIncluded",
      title: "Assurance incluse",
      type: "boolean",
      fieldset: "tarification",
      initialValue: true,
      description: "Assurance tous risques incluse sur la plateforme",
    }),

    // ══════════════════════════════════
    // ── ÉQUIPEMENTS — LITERIE
    // ══════════════════════════════════
    defineField({
      name: "eq_bed_type",
      title: "Type de lit",
      type: "string",
      fieldset: "equipements",
      options: {
        list: [
          { title: "Lit fixe", value: "fixed" },
          { title: "Lit convertible", value: "convertible" },
          { title: "Lits superposés", value: "bunk" },
        ],
      },
    }),
    defineField({
      name: "eq_bed_size",
      title: "Dimensions du lit",
      type: "string",
      fieldset: "equipements",
      description: "Ex : 140×190 cm",
    }),

    // ── SANITAIRES
    defineField({
      name: "eq_shower",
      title: "Douche",
      type: "boolean",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_shower_type",
      title: "Type de douche",
      type: "string",
      fieldset: "equipements",
      options: {
        list: [
          { title: "Eau chaude", value: "hot" },
          { title: "Solaire", value: "solar" },
          { title: "Extérieure", value: "outdoor" },
        ],
      },
      hidden: ({ parent }) => !parent?.eq_shower,
    }),
    defineField({
      name: "eq_toilet",
      title: "Toilettes",
      type: "boolean",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_toilet_type",
      title: "Type de toilettes",
      type: "string",
      fieldset: "equipements",
      options: {
        list: [
          { title: "Chimique", value: "chemical" },
          { title: "Cassette", value: "cassette" },
          { title: "Compost", value: "compost" },
        ],
      },
      hidden: ({ parent }) => !parent?.eq_toilet,
    }),

    // ── CUISINE
    defineField({
      name: "eq_kitchen",
      title: "Cuisine",
      type: "boolean",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_stove_type",
      title: "Type de plaque",
      type: "string",
      fieldset: "equipements",
      options: {
        list: [
          { title: "Induction", value: "induction" },
          { title: "Gaz", value: "gas" },
          { title: "Les deux", value: "both" },
        ],
      },
    }),
    defineField({
      name: "eq_fridge",
      title: "Réfrigérateur",
      type: "boolean",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_fridge_liters",
      title: "Capacité frigo (litres)",
      type: "number",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_freezer",
      title: "Congélateur",
      type: "boolean",
      fieldset: "equipements",
    }),

    // ── ÉNERGIE & CONFORT
    defineField({
      name: "eq_heating",
      title: "Chauffage",
      type: "boolean",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_heating_type",
      title: "Type de chauffage",
      type: "string",
      fieldset: "equipements",
      options: {
        list: [
          { title: "Webasto", value: "webasto" },
          { title: "Truma", value: "truma" },
          { title: "Climatisation", value: "clim" },
        ],
      },
    }),
    defineField({
      name: "eq_solar",
      title: "Panneau solaire",
      type: "boolean",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_solar_watts",
      title: "Puissance solaire (W)",
      type: "number",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_battery_ah",
      title: "Batterie auxiliaire (Ah)",
      type: "number",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_inverter_220v",
      title: "Convertisseur 220V",
      type: "boolean",
      fieldset: "equipements",
    }),

    // ── CONNECTIVITÉ
    defineField({
      name: "eq_wifi",
      title: "Wi-Fi embarqué",
      type: "boolean",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_tv",
      title: "Télévision",
      type: "boolean",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_usb_ports",
      title: "Ports USB",
      type: "boolean",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_bluetooth",
      title: "Bluetooth",
      type: "boolean",
      fieldset: "equipements",
    }),

    // ── EXTÉRIEUR & SPORT
    defineField({
      name: "eq_outdoor_awning",
      title: "Auvent / Store",
      type: "boolean",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_outdoor_chairs",
      title: "Chaises extérieures",
      type: "boolean",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_outdoor_bbq",
      title: "Barbecue",
      type: "boolean",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_surf_rack",
      title: "Porte-surf",
      type: "boolean",
      fieldset: "equipements",
    }),
    defineField({
      name: "eq_bike_rack",
      title: "Porte-vélos",
      type: "boolean",
      fieldset: "equipements",
    }),

    // ══════════════════════════════════
    // ── CONTENU ÉDITORIAL
    // ══════════════════════════════════
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      fieldset: "contenu",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "highlights",
      title: "Points forts",
      type: "array",
      fieldset: "contenu",
      of: [{ type: "string" }],
      description: "Ex : « 5 min des plages de Biarritz »",
    }),
    defineField({
      name: "rules",
      title: "Règles d'utilisation",
      type: "array",
      fieldset: "contenu",
      of: [{ type: "string" }],
    }),

    // ══════════════════════════════════
    // ── SEO
    // ══════════════════════════════════
    defineField({
      name: "seoTitle",
      title: "Titre SEO",
      type: "string",
      fieldset: "seo",
    }),
    defineField({
      name: "seoDescription",
      title: "Description SEO",
      type: "string",
      fieldset: "seo",
      validation: (rule) => rule.max(160),
    }),
  ],
});
