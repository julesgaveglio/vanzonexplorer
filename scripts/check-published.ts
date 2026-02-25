import { createClient } from "@sanity/client";

const SANITY_API_TOKEN = "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu";

const sanityClient = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: SANITY_API_TOKEN,
});

async function checkPublishedTestimonials() {
  try {
    console.log("🔍 Vérification des témoignages publiés...");
    
    // Récupérer les témoignages publiés (sans filtre de draft)
    const publishedTestimonials = await sanityClient.fetch('*[_type == "testimonial" && !(_id in path("drafts.**"))]');
    
    console.log(`📝 ${publishedTestimonials.length} témoignages publiés trouvés:`);
    
    publishedTestimonials.forEach((testimonial, index) => {
      console.log(`${index + 1}. ${testimonial.name} (${testimonial.rating}⭐) - ${testimonial.role}`);
      console.log(`   ID: ${testimonial._id}`);
      console.log(`   Contenu: "${testimonial.content.substring(0, 100)}..."`);
      console.log('');
    });
    
    if (publishedTestimonials.length === 0) {
      console.log("❌ Aucun témoignage publié trouvé !");
      console.log("💡 Va dans le Studio et publie les témoignages !");
    }
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

checkPublishedTestimonials();
