import { Client } from "@googlemaps/google-maps-services-js";
import { createClient } from "@sanity/client";

// Configuration
const GOOGLE_PLACES_API_KEY = "AIzaSyD4qP7KPfml7P2wOwoAmNo5COm7crT_YGM";
const PLACE_ID = "ChIJ7-3ASe0oTyQR6vNHg7YRicA";
const SANITY_API_TOKEN = "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu";

const sanityClient = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: SANITY_API_TOKEN,
});

const mapsClient = new Client({});

async function importOriginalReviews() {
  try {
    console.log("🔍 Récupération des avis ORIGINAUX Google Maps...");
    
    // Récupérer les détails de la place avec TOUS les avis
    const response = await mapsClient.placeDetails({
      params: {
        place_id: PLACE_ID,
        key: GOOGLE_PLACES_API_KEY,
        fields: ["name", "rating", "reviews", "user_ratings_total"],
      },
    });

    const place = response.data.result;
    const reviews = place.reviews || [];

    console.log(`📝 ${reviews.length} avis trouvés sur ${place.user_ratings_total} totaux pour "${place.name}"`);

    // Supprimer tous les témoignages actuels
    await deleteAllTestimonials();

    // Importer chaque avis ORIGINAL dans Sanity SANS MODIFICATION
    for (const review of reviews) {
      const sanityDoc = {
        _type: "testimonial",
        name: review.author_name,
        role: "Client Google Maps",
        content: review.text || "", // Texte original exact
        rating: review.rating,
        featured: false,
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
      console.log(`✅ Importé: ${review.author_name} (${review.rating}⭐)`);
      console.log(`   Texte original: "${review.text}"`);
      console.log(`   ID: ${result._id}`);
      console.log('');
    }

    console.log(`🎉 Import terminé ! ${reviews.length} avis ORIGINAUX importés dans Sanity`);
    console.log("📝 Aucune modification du texte ou du langage !");
    
  } catch (error) {
    console.error("❌ Erreur lors de l'import:", error);
  }
}

// Supprimer TOUS les témoignages
async function deleteAllTestimonials() {
  try {
    console.log("🗑️ Suppression de TOUS les témoignages...");
    
    const allTestimonials = await sanityClient.fetch('*[_type == "testimonial"]');
    
    for (const testimonial of allTestimonials) {
      await sanityClient.delete(testimonial._id);
      console.log(`🗑️ Supprimé: ${testimonial.name}`);
    }
    
    console.log(`🗑️ ${allTestimonials.length} témoignages supprimés`);
  } catch (error) {
    console.warn("⚠️ Erreur lors de la suppression:", error);
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
importOriginalReviews();
