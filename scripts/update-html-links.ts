import { createClient } from "@sanity/client";

const SANITY_API_TOKEN = "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu";

const sanityClient = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: SANITY_API_TOKEN,
});

async function updateAllHTMLLinks() {
  try {
    console.log("🔄 Mise à jour des liens HTML pour toutes les images...");
    
    // Récupérer tous les media assets
    const mediaAssets = await sanityClient.fetch('*[_type == "mediaAsset"]');
    
    for (const asset of mediaAssets) {
      const imageUrl = asset.image?.asset?.url;
      const title = asset.title;
      const alt = asset.image?.alt || title;
      
      if (imageUrl) {
        // Mettre à jour le champ htmlLink avec juste l'URL
        await sanityClient.patch(asset._id).set({ htmlLink: imageUrl }).commit();
        
        console.log(`✅ Mis à jour: ${title}`);
      }
    }
    
    console.log(`🎉 ${mediaAssets.length} images mises à jour !`);
    console.log("📝 Les liens HTML sont maintenant disponibles dans Sanity Studio");
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

updateAllHTMLLinks();
