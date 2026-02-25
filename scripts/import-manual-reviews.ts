import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu",
});

// Structure pour un avis Google Maps
interface GoogleReview {
  name: string;
  rating: number;
  content: string;
  date: string; // Format ISO
  language: string;
}

export async function importManualReviews(reviews: GoogleReview[]) {
  try {
    console.log("🔍 Importation manuelle des 33 avis Google Maps...");
    
    // Supprimer les anciens témoignages
    console.log("🗑️ Suppression des anciens témoignages...");
    const existingTestimonials = await client.fetch('*[_type == "testimonial"]');
    for (const testimonial of existingTestimonials) {
      await client.delete(testimonial._id);
      console.log(`❌ Supprimé: ${testimonial.name}`);
    }
    
    // Importer les nouveaux avis
    let importedCount = 0;
    for (const review of reviews) {
      const doc = {
        _type: "testimonial",
        name: review.name,
        rating: review.rating,
        content: review.content,
        role: "Client Google Maps",
        photo: null,
        publishedAt: review.date,
        source: "google-maps-manual",
        language: review.language
      };
      
      await client.create(doc);
      importedCount++;
      console.log(`✅ Importé: ${review.name} (${review.rating}⭐)`);
    }
    
    console.log(`\n🎉 ${importedCount} avis Google Maps importés manuellement !`);
    console.log("📝 Tous les avis sont maintenant disponibles dans Sanity Studio");
    console.log("🔗 Va sur http://localhost:3000/studio pour vérifier");
    
  } catch (error) {
    console.error("❌ Erreur lors de l'importation:", error);
  }
}

// Exemple de format pour les avis
console.log("📋 Format pour copier-coller les 33 avis :");
console.log(`
const reviews = [
  {
    name: "Nom du client",
    rating: 5,
    content: "Texte complet de l'avis...",
    date: "2024-01-15T00:00:00.000Z",
    language: "fr"
  },
  // ... ajouter les 33 avis ici
];

importManualReviews(reviews);
`);

// Si tu veux tester avec un exemple
const exampleReview = {
  name: "Mathias",
  rating: 5,
  content: "Nous avons passé deux jours merveilleux à bord d'un van aménagé loué auprès de Jules, et nous en gardons un souvenir absolument parfait. Dès le premier contact, Jules a été d'une disponibilité et d'une réactivité exemplaires.",
  date: "2024-02-20T00:00:00.000Z",
  language: "fr"
};

console.log("\n💡 Pour importer les 33 avis :");
console.log("1. Va sur Google Maps → Vanzon Explorer");
console.log("2. Copie chaque avis (nom + texte)");
console.log("3. Colle-les dans le format ci-dessus");
console.log("4. Lance: npm run import-manual-reviews");
