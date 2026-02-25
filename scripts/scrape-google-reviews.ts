import { createClient } from "@sanity/client";
import puppeteer from 'puppeteer';

const SANITY_API_TOKEN = "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu";

const sanityClient = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: SANITY_API_TOKEN,
});

async function scrapeGoogleReviews() {
  try {
    console.log("🔍 Scraping de TOUS les avis Google Maps...");
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // URL de Google Maps pour Vanzon Explorer
    await page.goto('https://www.google.com/maps/search/Vanzon+Explorer');
    
    // Attendre que les avis se chargent
    await page.waitForSelector('[role="img"]', { timeout: 10000 });
    
    // Scroller pour charger tous les avis
    let previousHeight = 0;
    while (true) {
      const currentHeight = await page.evaluate('document.body.scrollHeight');
      if (currentHeight === previousHeight) break;
      previousHeight = currentHeight;
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.sleep(2000);
    }
    
    // Extraire les avis
    const reviews = await page.evaluate(() => {
      const reviewElements = document.querySelectorAll('[data-review-id]');
      const reviews = [];
      
      reviewElements.forEach((element) => {
        const name = element.querySelector('.fontHeadlineSmall')?.textContent?.trim();
        const rating = element.querySelectorAll('.kpWpJe')[0]?.children?.length || 0;
        const text = element.querySelector('.reviewText')?.textContent?.trim();
        const photo = element.querySelector('[role="img"]')?.src;
        
        if (name && rating > 0) {
          reviews.push({
            name,
            rating,
            text: text || 'Excellent service !',
            photo
          });
        }
      });
      
      return reviews;
    });
    
    await browser.close();
    
    console.log(`📝 ${reviews.length} avis trouvés !`);
    
    // Supprimer les anciens témoignages
    await deleteOldGoogleReviews();
    
    // Importer dans Sanity
    for (const review of reviews) {
      const sanityDoc = {
        _type: "testimonial",
        name: review.name,
        role: "Client Google Maps",
        content: review.text,
        rating: review.rating,
        featured: false,
        seoTitle: null,
        seoDescription: null,
        ...(review.photo && {
          photo: {
            _type: "image",
            asset: {
              _type: "reference",
              _ref: (await uploadImageToSanity(review.photo, review.name)) || undefined,
            },
          },
        }),
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

async function uploadImageToSanity(imageUrl: string, authorName: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const asset = await sanityClient.assets.upload("image", buffer, {
      filename: `${authorName.replace(/\s+/g, "_")}_profile.jpg`,
    });
    
    return asset._id;
  } catch (error) {
    console.warn(`⚠️ Impossible d'uploader la photo de ${authorName}:`, error);
    return null;
  }
}

scrapeGoogleReviews();
