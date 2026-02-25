import { createClient } from "@sanity/client";

const SANITY_API_TOKEN = "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu";

const sanityClient = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: SANITY_API_TOKEN,
});

async function getLatestImage() {
  try {
    console.log("🔍 Récupération de la dernière image publiée...");
    
    // Récupérer la dernière image publiée
    const latestAsset = await sanityClient.fetch('*[_type == "mediaAsset"] | order(_createdAt desc) [0]');
    
    if (!latestAsset) {
      console.log("❌ Aucune image trouvée");
      return;
    }
    
    const imageUrl = latestAsset.image?.asset?.url;
    const title = latestAsset.title;
    const category = latestAsset.category;
    const alt = latestAsset.image?.alt || title;
    
    console.log(`📸 **${title}** (${category})`);
    console.log(`\n🔗 **URL Next.js (à copier):**`);
    console.log(`\`\`\`tsx`);
    console.log(`<Image`);
    console.log(`  src="${imageUrl}"`);
    console.log(`  alt="${alt}"`);
    console.log(`  width={600}`);
    console.log(`  height={400}`);
    console.log(`  className="w-full h-auto"`);
    console.log(`/>`);
    console.log(`\`\`\``);
    
    console.log(`\n🔗 **URL directe (pour HTML simple):**`);
    console.log(`\`${imageUrl}\``);
    
    console.log(`\n📋 **Code HTML simple:**`);
    console.log(`\`\`\`html`);
    console.log(`<img src="${imageUrl}" alt="${alt}" />`);
    console.log(`\`\`\``);
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

getLatestImage();
