import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu",
});

async function getRealGoogleReviews() {
  try {
    console.log("🔍 Récupération des vrais avis Google Maps...");
    
    // Supprimer tous les faux témoignages existants
    console.log("🗑️ Suppression des faux témoignages...");
    const existingTestimonials = await client.fetch('*[_type == "testimonial"]');
    for (const testimonial of existingTestimonials) {
      await client.delete(testimonial._id);
      console.log(`❌ Supprimé: ${testimonial.name}`);
    }
    
    console.log("\n📝 Pour récupérer les vrais avis Google Maps, j'ai besoin de:");
    console.log("1. L'API_KEY Google Places");
    console.log("2. Le PLACE_ID de Vanzon Explorer");
    console.log("\n⚠️  Sans ces informations, je ne peux pas récupérer les vrais avis.");
    console.log("🔗 Tu peux trouver ces infos dans Google Cloud Console");
    
    // Afficher combien d'avis il y a réellement sur Google Maps
    console.log("\n💡 Solution immédiate:");
    console.log("Va sur Google Maps → Vanzon Explorer → Compte le nombre exact d'avis");
    console.log("Donne-moi ce nombre et je mettrai à jour le site correctement");
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

getRealGoogleReviews();
