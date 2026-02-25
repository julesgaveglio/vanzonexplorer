async function findPlaceId(apiKey: string) {
  try {
    console.log("🔍 Recherche du Place ID pour Vanzon Explorer...");
    
    // Recherche par nom et localisation
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
      `query=Vanzon+Explorer+Biarritz&` +
      `location=43.3535318,-1.3976454&` +
      `radius=1000&` +
      `key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === "OK" && data.results.length > 0) {
      const place = data.results[0];
      console.log(`✅ Place trouvé: ${place.name}`);
      console.log(`📍 Place ID: ${place.place_id}`);
      console.log(`⭐ Note: ${place.rating} (${place.user_ratings_total} avis)`);
      console.log(`📝 Adresse: ${place.formatted_address}`);
      
      // Test avec ce Place ID
      console.log("\n🧪 Test du Place ID...");
      const detailsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${place.place_id}&` +
        `fields=reviews,rating,user_ratings_total&` +
        `language=fr&` +
        `key=${apiKey}`
      );
      
      const detailsData = await detailsResponse.json();
      
      if (detailsData.status === "OK") {
        const reviews = detailsData.result.reviews || [];
        console.log(`✅ Place ID valide!`);
        console.log(`📊 ${detailsData.result.user_ratings_total} avis totaux`);
        console.log(`📝 ${reviews.length} avis détaillés récupérés`);
        
        if (reviews.length > 0) {
          console.log("\n📋 Exemple d'avis:");
          console.log(`- ${reviews[0].author_name}: ${reviews[0].rating}⭐`);
          console.log(`  "${reviews[0].text.substring(0, 100)}..."`);
        }
        
        return place.place_id;
      } else {
        console.log(`❌ Erreur détails: ${detailsData.status}`);
        return null;
      }
    } else {
      console.log(`❌ Erreur recherche: ${data.status}`);
      if (data.error_message) {
        console.log(`Message: ${data.error_message}`);
      }
      return null;
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
    return null;
  }
}

// Test avec la clé API
if (process.argv[2]) {
  findPlaceId(process.argv[2]);
} else {
  console.log("Usage: npx ts-node scripts/find-place-id.ts VOTRE_CLE_API");
}
