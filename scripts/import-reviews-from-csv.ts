import { createClient } from "@sanity/client";
import fs from 'fs';
import path from 'path';

const SANITY_API_TOKEN = "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu";

const sanityClient = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: SANITY_API_TOKEN,
});

interface ReviewData {
  name: string;
  rating: number;
  content: string;
}

async function importReviewsFromCSV() {
  try {
    console.log("📂 Lecture du fichier CSV...");
    
    // Lire le fichier CSV (format: nom,note,avis)
    const csvPath = path.join(__dirname, 'reviews.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    const reviews: ReviewData[] = [];
    
    for (const line of lines) {
      const [name, rating, ...contentParts] = line.split(',');
      if (name && rating && contentParts.length > 0) {
        reviews.push({
          name: name.trim(),
          rating: parseInt(rating.trim()),
          content: contentParts.join(',').trim()
        });
      }
    }
    
    console.log(`📝 ${reviews.length} avis trouvés dans le CSV`);
    
    // Supprimer les anciens témoignages
    await deleteOldGoogleReviews();
    
    // Importer chaque avis
    for (const review of reviews) {
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
      console.log(`✅ Importé: ${review.name} (${review.rating}⭐) - ID: ${result._id}`);
    }
    
    console.log(`🎉 Import terminé ! ${reviews.length} avis importés dans Sanity`);
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

async function deleteOldGoogleReviews() {
  try {
    const oldReviews = await sanityClient.fetch('*[_type == "testimonial" && role == "Client Google Maps"]');
    for (const review of oldReviews) {
      await sanityClient.delete(review._id);
    }
    console.log(`🗑️ ${oldReviews.length} anciens témoignages supprimés`);
  } catch (error) {
    console.warn("⚠️ Erreur lors de la suppression:", error);
  }
}

importReviewsFromCSV();
