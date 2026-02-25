import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu",
});

async function publishAllReviews() {
  try {
    console.log("🔍 Récupération de tous les témoignages...");
    
    // Récupérer tous les témoignages (publiés et brouillons)
    const allTestimonials = await client.fetch('*[_type == "testimonial"]');
    
    console.log(`📝 ${allTestimonials.length} témoignages trouvés`);
    
    let publishedCount = 0;
    let alreadyPublishedCount = 0;
    
    for (const testimonial of allTestimonials) {
      // Vérifier si déjà publié
      if (!testimonial._id.startsWith('drafts.')) {
        console.log(`✅ Déjà publié: ${testimonial.name}`);
        alreadyPublishedCount++;
        continue;
      }
      
      // Publier le témoignage
      const draftId = testimonial._id;
      const publishedId = draftId.replace('drafts.', '');
      await client.createIfNotExists({
        ...testimonial,
        _id: publishedId,
        _type: "testimonial"
      });
      console.log(`📰 Publié: ${testimonial.name} - ID: ${publishedId}`);
      publishedCount++;
    }
    
    console.log(`\n🎉 Résumé:`);
    console.log(`   • ${publishedCount} nouveaux témoignages publiés`);
    console.log(`   • ${alreadyPublishedCount} déjà publiés`);
    console.log(`   • Total: ${allTestimonials.length} témoignages publiés`);
    console.log(`\n📝 Les ${allTestimonials.length} avis Google Maps sont maintenant visibles sur le site !`);
    
  } catch (error) {
    console.error("❌ Erreur lors de la publication:", error);
  }
}

publishAllReviews();
