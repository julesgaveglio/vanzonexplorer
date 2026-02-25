// npm install @googlemaps/google-maps-services-js
// npx ts-node scripts/import-google-reviews.ts

import { Client } from "@googlemaps/google-maps-services-js";
import { createClient } from "@sanity/client";

// Configuration
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const PLACE_ID = process.env.GOOGLE_PLACE_ID!; // ex: "ChIJd2VgYkqj5kcRGXb-8M3LdU8"

const sanityClient = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN!, // Token avec droits d'écriture
});

const mapsClient = new Client({});

interface GoogleReview {
  author_name: string;
  author_url: string;
  language: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

async function importGoogleReviews() {
  try {
    console.log("🔍 Récupération des avis Google Places...");
    
    // Récupérer les détails de la place avec les avis
    const response = await mapsClient.placeDetails({
      params: {
        place_id: PLACE_ID,
        key: GOOGLE_PLACES_API_KEY,
        fields: ["name", "rating", "reviews", "user_ratings_total"],
        // language: "fr",
        // reviews_sort: "newest",
      },
    });

    const place = response.data.result;
    const reviews = place.reviews || [];

    console.log(`📝 ${reviews.length} avis trouvés pour "${place.name}"`);

    // Importer chaque avis dans Sanity
    for (const review of reviews) {
      const sanityDoc = {
        _type: "testimonial",
        name: review.author_name,
        role: "Client Google Maps",
        content: review.text,
        rating: review.rating,
        featured: false, // Tu pourras marquer les meilleurs manuellement
        seoTitle: null,
        seoDescription: null,
        // Photo si disponible
        ...(review.profile_photo_url && {
          photo: {
            _type: "image",
            asset: {
              _type: "reference",
              _ref: (await uploadImageToSanity(review.profile_photo_url, review.author_name)) || undefined,
            },
          },
        }),
      };

      // Créer le document dans Sanity
      const result = await sanityClient.create(sanityDoc);
      console.log(`✅ Importé: ${review.author_name} (${review.rating}⭐) - ID: ${result._id}`);
    }

    console.log(`🎉 Import terminé ! ${reviews.length} avis importés dans Sanity`);
  } catch (error) {
    console.error("❌ Erreur lors de l'import:", error);
  }
}

// Upload d'image depuis URL vers Sanity Asset
async function uploadImageToSanity(imageUrl: string, authorName: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const asset = await sanityClient.assets.upload("image", buffer, {
      filename: `${authorName.replace(/\s+/g, "_")}_profile.jpg`,
    });
    
    return asset._id;
  } catch (error) {
    console.warn(`⚠️ Impossible d'uploader la photo de ${authorName}:`, error);
    return null;
  }
}

// Exécuter
importGoogleReviews();
