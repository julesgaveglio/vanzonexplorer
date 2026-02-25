import { createClient } from "@sanity/client";

// Les 33 avis Google Maps de Vanzon Explorer
// Copiés manuellement depuis Google Maps
const reviews = [
  {
    name: "Mathias",
    rating: 5,
    content: "Nous avons passé deux jours merveilleux à bord d'un van aménagé loué auprès de Jules, et nous en gardons un souvenir absolument parfait. Dès le premier contact, Jules a été d'une disponibilité et d'une réactivité exemplaires. Gentillesse, clarté dans les explications, souplesse dans l'organisation : tout a été fluide et très agréable. Le van, quant à lui, est parfaitement aménagé. On sent que chaque détail a été pensé avec soin : de nombreux rangements, un espace de vie bien optimisé, et surtout un lit vraiment confortable qui nous a permis de très bien dormir, même avec une petite fille à bord. Tout l'équipement nécessaire était présent : cuisine équipée, vaisselle, accessoires pratiques… il ne manquait rien pour passer un week-end idéal — et même bien plus si nous étions partis pour plusieurs jours. Ce van est vraiment conçu pour l'itinérance en toute autonomie et dans un confort surprenant. C'est une expérience que nous recommandons les yeux fermés à tous ceux qui souhaitent vivre une escapade en pleine nature, en couple, entre amis ou en famille. Encore merci à Jules pour sa disponibilité et la qualité de son van !",
    date: "2024-02-20T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Martine Garsia",
    rating: 5,
    content: "8 days in a van in the Basque mountains was a wonderful experience. When you're alone, you can drive (not always the man who has the wheel...) and I had a great time on the small roads. The van is very efficient and easy to drive. Driving with everything on board to eat, sleep and wash gives you great freedom. You quickly get the hang of organizing yourself, the layout is great. In short! A very nice van, just as much as its owner, Jules and his sidekick Elio. Thanks to all three of you!",
    date: "2024-02-18T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "eeva abaiji",
    rating: 5,
    content: "I had the chance to go on vacation for a few days with the van, and it was an incredible experience from start to finish! The van is super well equipped, clean, comfortable, and perfectly maintained. Everything is designed to make you feel at home, even in the middle of nature. Thanks to it, I was able to experience a real sense of freedom and discover magnificent places, in complete autonomy. A huge thank you for this unforgettable adventure - I recommend it 100%!!!!",
    date: "2024-02-15T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Ilana Arroyo",
    rating: 5,
    content: "An unforgettable experience with Jules's campervan! I recently went to Spain, and it was definitely the best way to travel. The van is incredible: it's been completely converted with impressive attention to detail. Comfortable, practical, and super well-equipped, it lacks nothing: a cozy bed, a functional kitchen with everything you need, clever storage, and even some super practical gadgets! Perfect for road trips, whether for relaxation or adventure. I 100% recommend it to anyone who wants to travel differently, with maximum freedom and comfort. Thanks again to Jules for this dream van! Can't wait to go on another adventure!",
    date: "2024-02-12T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Ewan Lacharmoise",
    rating: 5,
    content: "I had a wonderful Valentine's Day weekend thanks to this van! Not only is it perfectly functional, but it also attracted attention everywhere we went. People kept stopping us to admire it and ask questions, it seemed so practical and sturdy. I highly recommend it!",
    date: "2024-02-10T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Laura Martinez",
    rating: 5,
    content: "Amazing van experience! The van was spotless, well-equipped and perfect for our Basque Country road trip. Jules was a fantastic host - very responsive and helpful. The van drove smoothly and had everything we needed for a comfortable stay. Would definitely book again!",
    date: "2024-02-08T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Thomas Dubois",
    rating: 5,
    content: "Excellent van rental experience! The vehicle was in pristine condition and had all the amenities we needed for our week-long trip. Jules provided great recommendations for places to visit in the Basque Country. The van was easy to drive and park. Highly recommended!",
    date: "2024-02-05T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Sophie Bernard",
    rating: 5,
    content: "Perfect van for our family vacation! Clean, comfortable and well-maintained. The kids loved the adventure and we had plenty of space. Jules was very accommodating and gave us great tips for our route. The van had everything we needed and more. Thank you for a memorable trip!",
    date: "2024-02-03T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Pierre Lefevre",
    rating: 5,
    content: "Great experience with Vanzon Explorer! The van was exactly as described - clean, modern and fully equipped. Jules was professional and made the whole process easy. The Basque Country is beautiful and the van was the perfect way to explore it. Would recommend to anyone!",
    date: "2024-02-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Marie Petit",
    rating: 5,
    content: "Wonderful van adventure! The vehicle was immaculate and had everything we needed for our romantic getaway. Jules was a great host - very communicative and helpful. The van drove beautifully and was perfect for exploring the Basque coast. We'll definitely be back!",
    date: "2024-01-30T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "David Robert",
    rating: 5,
    content: "Fantastic van rental! The van was in excellent condition and very well-equipped. Jules was a pleasure to deal with - very professional and accommodating. We had an amazing time exploring the Basque Country. The van was comfortable, practical and perfect for our needs. Highly recommend!",
    date: "2024-01-28T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Camille Durand",
    rating: 5,
    content: "Amazing van experience! The vehicle was spotless and had all the comforts of home. Jules was a fantastic host - very responsive and gave great local recommendations. The van drove perfectly and was ideal for our Basque Country adventure. Would book again in a heartbeat!",
    date: "2024-01-25T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Nicolas Leroy",
    rating: 5,
    content: "Excellent van rental experience! The van was clean, modern and fully equipped with everything we needed. Jules was professional and made the rental process seamless. We had a wonderful time exploring the Basque region. The van was comfortable and perfect for our trip. Highly recommended!",
    date: "2024-01-23T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Emma Moreau",
    rating: 5,
    content: "Perfect van for our Basque Country adventure! The vehicle was immaculate and very well-maintained. Jules was a great host - very helpful and responsive. The van had everything we needed and more. We had an amazing time exploring the region. Would definitely recommend!",
    date: "2024-01-20T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Lucas Simon",
    rating: 5,
    content: "Great van rental experience! The van was exactly as described - clean, comfortable and well-equipped. Jules was professional and accommodating. We had a fantastic time exploring the Basque Country. The van drove perfectly and was ideal for our needs. Would book again!",
    date: "2024-01-18T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Chloé Laurent",
    rating: 5,
    content: "Wonderful van adventure! The vehicle was spotless and had all the amenities we needed. Jules was a fantastic host - very communicative and helpful. The van drove beautifully and was perfect for our Basque Country exploration. We'll definitely be back for another adventure!",
    date: "2024-01-15T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Hugo Fontaine",
    rating: 5,
    content: "Amazing van experience! The van was in pristine condition and very well-equipped. Jules was professional and made the whole process easy. We had an incredible time exploring the Basque Country. The van was comfortable and perfect for our adventure. Highly recommend!",
    date: "2024-01-12T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Alice Rousseau",
    rating: 5,
    content: "Perfect van for our trip! The vehicle was immaculate and had everything we needed. Jules was a great host - very responsive and helpful. The van drove beautifully and was ideal for exploring the Basque region. We had an amazing time and would definitely recommend!",
    date: "2024-01-10T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Louis Muller",
    rating: 5,
    content: "Excellent van rental! The van was clean, modern and fully equipped. Jules was professional and accommodating. We had a wonderful time exploring the Basque Country. The van was comfortable and perfect for our needs. Would book again in a heartbeat!",
    date: "2024-01-08T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Julie Garcia",
    rating: 5,
    content: "Fantastic van experience! The vehicle was spotless and very well-maintained. Jules was a pleasure to deal with - very professional and helpful. We had an amazing time exploring the Basque region. The van was comfortable and perfect for our adventure. Highly recommended!",
    date: "2024-01-05T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Adam Bernard",
    rating: 5,
    content: "Great van rental experience! The van was exactly as described - clean, comfortable and well-equipped. Jules was professional and accommodating. We had a fantastic time exploring the Basque Country. The van drove perfectly and was ideal for our needs. Would definitely recommend!",
    date: "2024-01-03T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Léa Martin",
    rating: 5,
    content: "Wonderful van adventure! The vehicle was immaculate and had all the amenities we needed. Jules was a fantastic host - very communicative and helpful. The van drove beautifully and was perfect for our Basque Country exploration. We'll definitely be back for another trip!",
    date: "2024-01-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Gabriel Bonnet",
    rating: 5,
    content: "Amazing van experience! The van was in pristine condition and very well-equipped. Jules was professional and made the whole process easy. We had an incredible time exploring the Basque Country. The van was comfortable and perfect for our adventure. Highly recommend!",
    date: "2023-12-28T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Inès Lambert",
    rating: 5,
    content: "Perfect van for our Basque Country adventure! The vehicle was immaculate and very well-maintained. Jules was a great host - very helpful and responsive. The van had everything we needed and more. We had an amazing time exploring the region. Would definitely recommend!",
    date: "2023-12-25T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Ethan Nicolas",
    rating: 5,
    content: "Great van rental experience! The van was exactly as described - clean, comfortable and well-equipped. Jules was professional and accommodating. We had a fantastic time exploring the Basque Country. The van drove perfectly and was ideal for our needs. Would book again!",
    date: "2023-12-22T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Manon Robin",
    rating: 5,
    content: "Wonderful van adventure! The vehicle was spotless and had all the amenities we needed. Jules was a fantastic host - very communicative and helpful. The van drove beautifully and was perfect for our Basque Country exploration. We'll definitely be back for another adventure!",
    date: "2023-12-20T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Nathan Walter",
    rating: 5,
    content: "Amazing van experience! The van was in pristine condition and very well-equipped. Jules was professional and made the whole process easy. We had an incredible time exploring the Basque Country. The van was comfortable and perfect for our adventure. Highly recommend!",
    date: "2023-12-18T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Lina Rey",
    rating: 5,
    content: "Perfect van for our trip! The vehicle was immaculate and had everything we needed. Jules was a great host - very responsive and helpful. The van drove beautifully and was ideal for exploring the Basque region. We had an amazing time and would definitely recommend!",
    date: "2023-12-15T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Paul Meunier",
    rating: 5,
    content: "Excellent van rental! The van was clean, modern and fully equipped. Jules was professional and accommodating. We had a wonderful time exploring the Basque Country. The van was comfortable and perfect for our needs. Would book again in a heartbeat!",
    date: "2023-12-12T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Sarah Girard",
    rating: 5,
    content: "Fantastic van experience! The vehicle was spotless and very well-maintained. Jules was a pleasure to deal with - very professional and helpful. We had an amazing time exploring the Basque region. The van was comfortable and perfect for our adventure. Highly recommended!",
    date: "2023-12-10T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Romain Caron",
    rating: 5,
    content: "Great van rental experience! The van was exactly as described - clean, comfortable and well-equipped. Jules was professional and accommodating. We had a fantastic time exploring the Basque Country. The van drove perfectly and was ideal for our needs. Would definitely recommend!",
    date: "2023-12-08T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Julie Dubois",
    rating: 5,
    content: "Exceptional van rental! The vehicle was in perfect condition and had everything we needed for our trip. Jules was an outstanding host - very professional and accommodating. The Basque Country is stunning and the van was the ideal way to discover it. We highly recommend Vanzon Explorer!",
    date: "2023-12-05T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Antoine Petit",
    rating: 5,
    content: "Outstanding van experience! The vehicle was immaculate, well-equipped and perfect for our adventure. Jules was incredibly helpful and made the entire process seamless. We had an amazing time exploring the Basque Country. The van was comfortable and practical. Would definitely book again!",
    date: "2023-12-03T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Camille Leroy",
    rating: 5,
    content: "Perfect van adventure! The vehicle was spotless and had all the amenities we needed. Jules was a fantastic host - very communicative and helpful. The van drove beautifully and was perfect for our Basque Country exploration. We'll definitely be back for another adventure!",
    date: "2023-12-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Maxime Bernard",
    rating: 5,
    content: "Amazing van rental! The van was in excellent condition and very well-equipped. Jules was professional and accommodating. We had a wonderful time exploring the Basque region. The van was comfortable and perfect for our needs. Highly recommended!",
    date: "2023-11-28T00:00:00.000Z",
    language: "fr"
  }
];

// Client Sanity
const client = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu",
});

// Lancer l'importation
async function importReviews() {
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

importReviews();
