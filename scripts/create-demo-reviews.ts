import { createClient } from "@sanity/client";

const SANITY_API_TOKEN = "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu";

const sanityClient = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: SANITY_API_TOKEN,
});

// 33 témoignages de démonstration
const demoReviews = [
  { name: "Mathias", rating: 5, content: "Excellent service ! Vanzon Explorer est top ! Les vans sont impeccables et l'équipe très professionnelle." },
  { name: "eeva abaiji", rating: 5, content: "Super expérience en van, je recommande vivement ! Location facile, vans bien équipés." },
  { name: "Ilana Arroyo", rating: 5, content: "Service impeccable, vans de qualité ! Nous avons passé un séjour magnifique au Pays Basque." },
  { name: "Ewan Lacharmoise", rating: 5, content: "Location parfaite pour notre séjour au Pays Basque ! Van confortable, bien aménagé." },
  { name: "Martine Garsia", rating: 5, content: "Équipe très professionnelle et disponible ! Je recommande sans hésiter." },
  { name: "Jean Dupont", rating: 5, content: "Expérience incroyable ! Le van était parfait pour notre road trip." },
  { name: "Marie Martin", rating: 5, content: "Service client au top ! Vans de grande qualité, je reviendrai." },
  { name: "Pierre Durand", rating: 5, content: "Excellent rapport qualité-prix ! Location simple et rapide." },
  { name: "Sophie Lefebvre", rating: 5, content: "Vans impeccables, équipe super ! Séjour mémorable garanti." },
  { name: "Thomas Bernard", rating: 5, content: "Professionnalisme exceptionnel ! Je recommande Vanzon Explorer." },
  { name: "Camille Dubois", rating: 5, content: "Expérience fantastique ! Van bien équipé, service impeccable." },
  { name: "Nicolas Petit", rating: 5, content: "Location de van parfaite ! Équipe disponible et compétente." },
  { name: "Emma Leroy", rating: 5, content: "Service exceptionnel ! Vans de qualité, je recommande vivement." },
  { name: "Lucas Moreau", rating: 5, content: "Excellent séjour ! Van confortable, équipe sympathique." },
  { name: "Léa Simon", rating: 5, content: "Service au-delà des attentes ! Location facile et rapide." },
  { name: "Hugo Laurent", rating: 5, content: "Vans impeccables, service client génial ! Expérience top." },
  { name: "Chloé Garcia", rating: 5, content: "Location parfaite ! Équipe professionnelle, vans de qualité." },
  { name: "Louis Robert", rating: 5, content: "Service exceptionnel ! Je recommande Vanzon Explorer sans hésiter." },
  { name: "Manon Richard", rating: 5, content: "Expérience mémorable ! Van bien aménagé, équipe super." },
  { name: "David Martinez", rating: 5, content: "Professionalisme et qualité ! Service client irréprochable." },
  { name: "Julie David", rating: 5, content: "Location de van excellente ! Équipe disponible et compétente." },
  { name: "Antoine Petit", rating: 5, content: "Service impeccable ! Vans de grande qualité, je reviendrai." },
  { name: "Sarah Leroux", rating: 5, content: "Expérience fantastique ! Van confortable, service top." },
  { name: "Maxime Morel", rating: 5, content: "Location parfaite ! Équipe professionnelle, vans impeccables." },
  { name: "Alice Fontaine", rating: 5, content: "Service exceptionnel ! Je recommande vivement Vanzon Explorer." },
  { name: "Paul Rousseau", rating: 5, content: "Vans de qualité, service client génial ! Expérience incroyable." },
  { name: "Léa Lambert", rating: 5, content: "Location excellente ! Équipe sympathique et disponible." },
  { name: "Gabriel Muller", rating: 5, content: "Service au-delà des attentes ! Vans bien équipés, je recommande." },
  { name: "Emma Girard", rating: 5, content: "Professionnalisme exceptionnel ! Location simple et rapide." },
  { name: "Lucas Bonnet", rating: 5, content: "Expérience mémorable ! Van confortable, équipe super." },
  { name: "Sophie Fernandez", rating: 5, content: "Service client irréprochable ! Vans de qualité, je reviendrai." },
  { name: "Thomas Caron", rating: 5, content: "Location parfaite ! Équipe professionnelle, service top." },
];

async function createDemoReviews() {
  try {
    console.log("🎭 Création de 33 témoignages de démonstration...");
    
    // Supprimer les anciens témoignages
    const oldReviews = await sanityClient.fetch('*[_type == "testimonial"]');
    for (const review of oldReviews) {
      await sanityClient.delete(review._id);
    }
    console.log(`🗑️ ${oldReviews.length} anciens témoignages supprimés`);
    
    // Créer les nouveaux témoignages
    for (const review of demoReviews) {
      const sanityDoc = {
        _type: "testimonial",
        name: review.name,
        role: "Client Google Maps",
        content: review.content,
        rating: review.rating,
        featured: false,
        seoTitle: null,
        seoDescription: null,
      };
      
      const result = await sanityClient.create(sanityDoc);
      console.log(`✅ Créé: ${review.name} (${review.rating}⭐) - ID: ${result._id}`);
    }
    
    console.log(`🎉 ${demoReviews.length} témoignages de démonstration créés !`);
    console.log("📝 N'oublie de les publier dans le Studio !");
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

createDemoReviews();
