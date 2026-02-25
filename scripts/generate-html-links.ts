import { createClient } from "@sanity/client";

const SANITY_API_TOKEN = "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu";

const sanityClient = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: SANITY_API_TOKEN,
});

async function generateHTMLLinks() {
  try {
    console.log("🔍 Récupération des images Sanity...");
    
    // Récupérer tous les media assets
    const mediaAssets = await sanityClient.fetch('*[_type == "mediaAsset"] | order(title asc)');
    
    console.log(`📝 ${mediaAssets.length} images trouvées:\n`);
    
    mediaAssets.forEach((asset: any, index: number) => {
      const imageUrl = asset.image?.asset?.url;
      const title = asset.title;
      const category = asset.category;
      const alt = asset.image?.alt || title;
      
      if (imageUrl) {
        console.log(`${index + 1}. **${title}** (${category})`);
        console.log(`   Lien Next.js:`);
        console.log(`   \`\`\`tsx`);
        console.log(`   <Image`);
        console.log(`     src="${imageUrl}"`);
        console.log(`     alt="${alt}"`);
        console.log(`     width={600}`);
        console.log(`     height={400}`);
        console.log(`     className="w-full h-auto"`);
        console.log(`   />`);
        console.log(`   \`\`\`\n`);
        
        console.log(`   Lien HTML simple:`);
        console.log(`   \`\`\`html`);
        console.log(`   <img src="${imageUrl}" alt="${alt}" />`);
        console.log(`   \`\`\`\n`);
        
        console.log(`   URL directe:`);
        console.log(`   \`${imageUrl}\`\n`);
        console.log(`   ---`);
      }
    });
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

generateHTMLLinks();
