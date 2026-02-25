import { createClient } from "@sanity/client";

const sanityClient = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu",
});

async function checkTestimonials() {
  try {
    console.log("🔍 Vérification des témoignages dans Sanity...");
    
    const testimonials = await sanityClient.fetch('*[_type == "testimonial"]');
    
    console.log(`📝 ${testimonials.length} témoignages trouvés:`);
    
    testimonials.forEach((t: any, index: number) => {
      console.log(`${index + 1}. ${t.name} (${t.rating}⭐) - ${t.role}`);
      console.log(`   Contenu: "${t.content}"`);
      console.log(`   Photo: ${t.photo ? 'Oui' : 'Non'}`);
      console.log(`   ID: ${t._id}`);
      console.log('');
    });
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

checkTestimonials();
