// Script de création des vans Yoni et Xalbat dans Sanity
// Usage : node scripts/create-vans.mjs

import { createClient } from "@sanity/client";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lire .env.local manuellement
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent.split("\n")
    .filter(l => l.includes("="))
    .map(l => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID || "lewexa74",
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || "production",
  token: env.SANITY_API_WRITE_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// Helpers pour référencer les assets Sanity depuis les CDN URLs
function assetRef(cdnUrl) {
  // https://cdn.sanity.io/images/lewexa74/production/2e9214211ef5a235dcf2aa639d0feafcc867c88f-1080x750.png
  const match = cdnUrl.match(/\/([a-f0-9]+)-(\d+x\d+)\.(\w+)$/);
  if (!match) throw new Error(`URL invalide: ${cdnUrl}`);
  const [, hash, dims, ext] = match;
  return {
    _type: "image",
    asset: {
      _type: "reference",
      _ref: `image-${hash}-${dims}-${ext}`,
    },
  };
}

function assetRefWithAlt(cdnUrl, alt) {
  return { ...assetRef(cdnUrl), alt };
}

// ── Données des vans ──────────────────────────────────────────────────────

const yoni = {
  _id: "van-yoni",
  _type: "van",
  name: "Yoni",
  slug: { _type: "slug", current: "yoni" },
  offerType: ["location"],
  status: "available",
  tagline: "Le fourgon idéal pour explorer la côte basque",
  featured: true,
  sortOrder: 1,

  // Médias
  mainImage: {
    ...assetRefWithAlt(
      "https://cdn.sanity.io/images/lewexa74/production/2e9214211ef5a235dcf2aa639d0feafcc867c88f-1080x750.png",
      "Van aménagé Yoni — Renault Trafic III Vanzon Explorer"
    ),
    _type: "image",
  },
  gallery: [
    {
      _key: "g1",
      ...assetRefWithAlt(
        "https://cdn.sanity.io/images/lewexa74/production/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png",
        "Van Yoni ouvert — vue intérieure"
      ),
    },
    {
      _key: "g2",
      ...assetRefWithAlt(
        "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png",
        "Van Yoni au bord de l'océan Pays Basque"
      ),
    },
  ],

  // Caractéristiques
  vanType: "fourgon",
  brand: "Renault",
  model: "Trafic III",
  year: 2019,
  capacity: 3,
  length: 5.4,

  // Tarification
  startingPricePerNight: 65,
  externalBookingUrl: "https://www.yescapa.fr/campers/89215",
  externalBookingPlatform: "Yescapa",
  insuranceIncluded: true,

  // Équipements
  eq_bed_type: "fixed",
  eq_bed_size: "140×190 cm",
  eq_kitchen: true,
  eq_stove_type: "gas",
  eq_toilet: true,
  eq_toilet_type: "compost",
  eq_usb_ports: true,
  eq_outdoor_chairs: true,

  // Contenu
  description: [
    {
      _type: "block",
      _key: "desc1",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "s1",
          text: "Yoni est un Renault Trafic III aménagé avec soin pour le vanlife au Pays Basque. Compact et maniable, il s'adapte aussi bien aux petites ruelles des villages basques qu'aux chemins côtiers. Sa cuisine coulissante et son couchage confortable en font le compagnon idéal pour des escapades de quelques jours.",
        },
      ],
    },
  ],
  highlights: [
    "Cuisine coulissante avec réchaud gaz 2 feux",
    "Lit fixe 2 personnes + couchage supplémentaire",
    "Glacière portative 24L",
    "Toilette sèche à bord",
    "Chaises et table extérieures",
    "Assurance tous risques incluse via Yescapa",
    "Conseils spots locaux offerts",
  ],
  rules: [
    "Interdit de fumer dans le van",
    "Animaux acceptés sous réserve",
    "Retour avec le plein de carburant",
    "Nettoyage intérieur à prévoir avant retour",
  ],

  // SEO
  seoTitle: "Location van aménagé Yoni — Renault Trafic III | Vanzon Explorer",
  seoDescription:
    "Louez Yoni, notre Renault Trafic III aménagé au Pays Basque dès 65€/nuit. Cuisine, couchage 3 personnes, assurance incluse. Réservez sur Yescapa.",
};

const xalbat = {
  _id: "van-xalbat",
  _type: "van",
  name: "Xalbat",
  slug: { _type: "slug", current: "xalbat" },
  offerType: ["location"],
  status: "available",
  tagline: "L'aventurier des Pyrénées et de l'Atlantique",
  featured: true,
  sortOrder: 2,

  // Médias
  mainImage: {
    ...assetRefWithAlt(
      "https://cdn.sanity.io/images/lewexa74/production/e9664378c5fdc652c33ae7342dfc52cc4960c8bf-1080x750.png",
      "Van aménagé Xalbat — Renault Trafic III Vanzon Explorer"
    ),
    _type: "image",
  },
  gallery: [
    {
      _key: "g1",
      ...assetRefWithAlt(
        "https://cdn.sanity.io/images/lewexa74/production/e07cf63507850084bee14fca9a91b4efe5b7d18a-1080x750.png",
        "Van Xalbat ouvert — vue intérieure"
      ),
    },
    {
      _key: "g2",
      ...assetRefWithAlt(
        "https://cdn.sanity.io/images/lewexa74/production/04d93973d30c5eede51f954d1432a50a5f82ef9b-1080x750.png",
        "Van Xalbat en montagne Pays Basque"
      ),
    },
  ],

  // Caractéristiques
  vanType: "fourgon",
  brand: "Renault",
  model: "Trafic III",
  year: 2020,
  capacity: 3,
  length: 5.4,

  // Tarification
  startingPricePerNight: 65,
  externalBookingUrl: "https://www.yescapa.fr/campers/98869",
  externalBookingPlatform: "Yescapa",
  insuranceIncluded: true,

  // Équipements
  eq_bed_type: "fixed",
  eq_bed_size: "140×190 cm",
  eq_kitchen: true,
  eq_stove_type: "gas",
  eq_toilet: true,
  eq_toilet_type: "compost",
  eq_usb_ports: true,
  eq_outdoor_chairs: true,

  // Contenu
  description: [
    {
      _type: "block",
      _key: "desc1",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "s1",
          text: "Xalbat est le second Renault Trafic III de la flotte Vanzon Explorer. Aménagé avec les mêmes standards que Yoni, il offre un confort optimal pour partir à la découverte du Pays Basque. Des plages d'Hossegor aux sommets de la Rhune, Xalbat est prêt pour toutes vos aventures.",
        },
      ],
    },
  ],
  highlights: [
    "Cuisine coulissante avec réchaud gaz 2 feux",
    "Lit fixe 2 personnes + couchage supplémentaire",
    "Glacière portative 24L",
    "Toilette sèche à bord",
    "Chaises et table extérieures",
    "Assurance tous risques incluse via Yescapa",
    "Conseils spots locaux offerts",
  ],
  rules: [
    "Interdit de fumer dans le van",
    "Animaux acceptés sous réserve",
    "Retour avec le plein de carburant",
    "Nettoyage intérieur à prévoir avant retour",
  ],

  // SEO
  seoTitle: "Location van aménagé Xalbat — Renault Trafic III | Vanzon Explorer",
  seoDescription:
    "Louez Xalbat, notre Renault Trafic III aménagé au Pays Basque dès 65€/nuit. Cuisine, couchage 3 personnes, assurance incluse. Réservez sur Yescapa.",
};

// ── Création dans Sanity ──────────────────────────────────────────────────

async function main() {
  console.log("🚐 Création des vans dans Sanity...\n");

  for (const van of [yoni, xalbat]) {
    try {
      const result = await client.createOrReplace(van);
      console.log(`✅ ${van.name} créé (ID: ${result._id})`);
    } catch (err) {
      console.error(`❌ Erreur pour ${van.name}:`, err.message);
    }
  }

  console.log("\n✨ Synchronisation terminée !");
  console.log("👉 Ouvre http://localhost:3001 pour voir les vans apparaître.");
}

main();
