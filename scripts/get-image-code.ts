import { createClient } from "@sanity/client";

const SANITY_API_TOKEN = "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu";

const sanityClient = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: SANITY_API_TOKEN,
});

async function getImageCode(imageTitle: string) {
  try {
    console.log(`🔍 Recherche de l'image: "${imageTitle}"`);
    
    // Chercher l'image par titre
    const asset = await sanityClient.fetch('*[_type == "mediaAsset" && title match $title][0]', { title: `*${imageTitle}*` });
    
    if (!asset) {
      console.log("❌ Image non trouvée");
      console.log("📝 Images disponibles:");
      
      const allAssets = await sanityClient.fetch('*[_type == "mediaAsset"] | order(title asc)');
      allAssets.forEach((a: any) => {
        console.log(`   - ${a.title}`);
      });
      return;
    }
    
    const imageUrl = asset.image?.asset?.url;
    const title = asset.title;
    const alt = asset.image?.alt || title;
    
    if (!imageUrl) {
      console.log("❌ Image sans URL");
      return;
    }
    
    console.log(`📸 **${title}** trouvée !`);
    console.log(`\n🔗 **Code Next.js à copier:**`);
    console.log(`\`\`\`tsx`);
    console.log(`<Image`);
    console.log(`  src="${imageUrl}"`);
    console.log(`  alt="${alt}"`);
    console.log(`  width={1200}`);
    console.log(`  height={800}`);
    console.log(`  className="w-full h-auto rounded-lg shadow-2xl"`);
    console.log(`  priority`);
    console.log(`/>`);
    console.log(`\`\`\``);
    
    console.log(`\n🔗 **URL directe:**`);
    console.log(`\`${imageUrl}\``);
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

// Récupérer le titre depuis les arguments de la ligne de commande
const imageTitle = process.argv[2];

if (!imageTitle) {
  console.log("❌ Usage: npm run get-image-code \"nom de l'image\"");
  console.log("💡 Exemple: npm run get-image-code \"mockup-de-pesentation-van-business-academy-vanzon-explorer\"");
} else {
  getImageCode(imageTitle);
}
