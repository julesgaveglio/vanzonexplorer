import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu",
});

// Place ID de Vanzon Explorer (trouvé via API)
const PLACE_ID = "ChIJ7-3ASe0oTyQR6vNHg7YRicA";

async function syncGoogleReviews(apiKey: string) {
  try {
    console.log("🔍 Synchronisation des vrais avis Google Maps...");
    
    // Appel à l'API Google Places
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${PLACE_ID}&` +
      `fields=reviews,rating,user_ratings_total&` +
      `language=fr&` +
      `key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status !== "OK") {
      console.error("❌ Erreur API:", data.status, data.error_message);
      return;
    }
    
    const { reviews, rating, user_ratings_total } = data.result;
    
    console.log(`📊 ${user_ratings_total} avis trouvés, note moyenne: ${rating}`);
    console.log(`📝 ${reviews.length} avis détaillés récupérés`);
    
    // Supprimer les anciens témoignages
    const existingTestimonials = await client.fetch('*[_type == "testimonial"]');
    for (const testimonial of existingTestimonials) {
      await client.delete(testimonial._id);
    }
    
    // Importer les vrais avis
    let importedCount = 0;
    for (const review of reviews.slice(0, 50)) { // Limiter à 50 avis
      const doc = {
        _type: "testimonial",
        name: review.author_name,
        rating: review.rating,
        content: review.text,
        role: "Client Google Maps",
        photo: review.profile_photo_url || null,
        publishedAt: new Date(review.time * 1000).toISOString(),
        source: "google-maps",
        originalReviewId: review.author_url?.split('/').pop() || null
      };
      
      await client.create(doc);
      importedCount++;
      console.log(`✅ Importé: ${review.author_name} (${review.rating}⭐)`);
    }
    
    console.log(`\n🎉 ${importedCount} vrais avis Google Maps synchronisés !`);
    console.log(`📊 Note moyenne: ${rating}⭐ sur ${user_ratings_total} avis totaux`);
    
  } catch (error) {
    console.error("❌ Erreur de synchronisation:", error);
  }
}

// Instructions d'utilisation
console.log("📋 Pour synchroniser les vrais avis Google Maps :");
console.log("\n1. Crée une clé API Google Cloud :");
console.log("   - https://console.cloud.google.com/");
console.log("   - Active 'Places API'");
console.log("   - Crée une clé API");
console.log("\n2. Lance la synchronisation :");
console.log("   npm run sync-reviews VOTRE_CLE_API");
console.log("\n3. Ou ajoute la clé API dans .env.local :");
console.log("   GOOGLE_PLACES_API_KEY=votre_cle_api");

// Si clé API fournie en argument
if (process.argv[2]) {
  syncGoogleReviews(process.argv[2]);
}
