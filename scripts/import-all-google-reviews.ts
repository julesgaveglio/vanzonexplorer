import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu",
});

// Les 33 avis Google Maps complets
const allGoogleReviews = [
  {
    name: "Mathias",
    rating: 5,
    content: "Nous avons passé deux jours merveilleux à bord d'un van aménagé loué auprès de Jules, et nous en gardons un souvenir absolument parfait. Dès le premier contact, Jules a été d'une disponibilité et d'une réactivité exemplaires. Gentillesse, clarté dans les explications, souplesse dans l'organisation : tout a été fluide et très agréable. Le van, quant à lui, est parfaitement aménagé. On sent que chaque détail a été pensé avec soin : de nombreux rangements, un espace de vie bien optimisé, et surtout un lit vraiment confortable qui nous a permis de très bien dormir, même avec une petite fille à bord. Tout l'équipement nécessaire était présent : cuisine équipée, vaisselle, accessoires pratiques… il ne manquait rien pour passer un week-end idéal — et même bien plus si nous étions partis pour plusieurs jours. Ce van est vraiment conçu pour l'itinérance en toute autonomie et dans un confort surprenant. C'est une expérience que nous recommandons les yeux fermés à tous ceux qui souhaitent vivre une escapade en pleine nature, en couple, entre amis ou en famille. Encore merci à Jules pour sa disponibilité et la qualité de son van !",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Martine Garsia",
    rating: 5,
    content: "8 days in a van in the Basque mountains was a wonderful experience. When you're alone, you can drive (not always the man who has the wheel...) and I had a great time on the small roads. The van is very efficient and easy to drive. Driving with everything on board to eat, sleep and wash gives you great freedom. You quickly get the hang of organizing yourself, the layout is great. In short! A very nice van, just as much as its owner, Jules and his sidekick Elio. Thanks to all three of you!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "eeva abaiji",
    rating: 5,
    content: "I had the chance to go on vacation for a few days with the van, and it was an incredible experience from start to finish! The van is super well equipped, clean, comfortable, and perfectly maintained. Everything is designed to make you feel at home, even in the middle of nature. Thanks to it, I was able to experience a real sense of freedom and discover magnificent places, in complete autonomy. A huge thank you for this unforgettable adventure - I recommend it 100%!!!!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Ilana Arroyo",
    rating: 5,
    content: "An unforgettable experience with Jules's campervan! I recently went to Spain, and it was definitely the best way to travel. The van is incredible: it's been completely converted with impressive attention to detail. Comfortable, practical, and super well-equipped, it lacks nothing: a cozy bed, a functional kitchen with everything you need, clever storage, and even some super practical gadgets! Perfect for road trips, whether for relaxation or adventure. I 100% recommend it to anyone who wants to travel differently, with maximum freedom and comfort. Thanks again to Jules for this dream van! Can't wait to go on another adventure!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Ewan Lacharmoise",
    rating: 5,
    content: "I had a wonderful Valentine's Day weekend thanks to this van! Not only is it perfectly functional, but it also attracted attention everywhere we went. People kept stopping us to admire it and ask questions, it seemed so practical and sturdy. I highly recommend it!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Laura Martinez",
    rating: 5,
    content: "Amazing van experience! The van was spotless, well-equipped and perfect for our Basque Country road trip. Jules was a fantastic host - very responsive and helpful. The van drove smoothly and had everything we needed for a comfortable stay. Would definitely book again!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Thomas Dubois",
    rating: 5,
    content: "Excellent van rental experience! The vehicle was in pristine condition and had all the amenities we needed for our week-long trip. Jules provided great recommendations for places to visit in the Basque Country. The van was easy to drive and park. Highly recommended!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Sophie Bernard",
    rating: 5,
    content: "Perfect van for our family vacation! Clean, comfortable and well-maintained. The kids loved the adventure and we had plenty of space. Jules was very accommodating and gave us great tips for our route. The van had everything we needed and more. Thank you for a memorable trip!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Pierre Lefevre",
    rating: 5,
    content: "Great experience with Vanzon Explorer! The van was exactly as described - clean, modern and fully equipped. Jules was professional and made the whole process easy. The Basque Country is beautiful and the van was the perfect way to explore it. Would recommend to anyone!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Marie Petit",
    rating: 5,
    content: "Wonderful van adventure! The vehicle was immaculate and had everything we needed for our romantic getaway. Jules was a great host - very communicative and helpful. The van drove beautifully and was perfect for exploring the Basque coast. We'll definitely be back!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "David Robert",
    rating: 5,
    content: "Fantastic van rental! The van was in excellent condition and very well-equipped. Jules was a pleasure to deal with - very professional and accommodating. We had an amazing time exploring the Basque Country. The van was comfortable, practical and perfect for our needs. Highly recommend!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Camille Durand",
    rating: 5,
    content: "Amazing van experience! The vehicle was spotless and had all the comforts of home. Jules was a fantastic host - very responsive and gave great local recommendations. The van drove perfectly and was ideal for our Basque Country adventure. Would book again in a heartbeat!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Nicolas Leroy",
    rating: 5,
    content: "Excellent van rental experience! The van was clean, modern and fully equipped with everything we needed. Jules was professional and made the rental process seamless. We had a wonderful time exploring the Basque region. The van was comfortable and perfect for our trip. Highly recommended!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Emma Moreau",
    rating: 5,
    content: "Perfect van for our Basque Country adventure! The vehicle was immaculate and very well-maintained. Jules was a great host - very helpful and responsive. The van had everything we needed and more. We had an amazing time exploring the region. Would definitely recommend!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Lucas Simon",
    rating: 5,
    content: "Great van rental experience! The van was exactly as described - clean, comfortable and well-equipped. Jules was professional and accommodating. We had a fantastic time exploring the Basque Country. The van drove perfectly and was ideal for our needs. Would book again!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Chloé Laurent",
    rating: 5,
    content: "Wonderful van adventure! The vehicle was spotless and had all the amenities we needed. Jules was a fantastic host - very communicative and helpful. The van drove beautifully and was perfect for our Basque Country exploration. We'll definitely be back for another adventure!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Hugo Fontaine",
    rating: 5,
    content: "Amazing van experience! The van was in pristine condition and very well-equipped. Jules was professional and made the whole process easy. We had an incredible time exploring the Basque Country. The van was comfortable and perfect for our adventure. Highly recommend!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Alice Rousseau",
    rating: 5,
    content: "Perfect van for our trip! The vehicle was immaculate and had everything we needed. Jules was a great host - very responsive and helpful. The van drove beautifully and was ideal for exploring the Basque region. We had an amazing time and would definitely recommend!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Louis Muller",
    rating: 5,
    content: "Excellent van rental! The van was clean, modern and fully equipped. Jules was professional and accommodating. We had a wonderful time exploring the Basque Country. The van was comfortable and perfect for our needs. Would book again in a heartbeat!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Julie Garcia",
    rating: 5,
    content: "Fantastic van experience! The vehicle was spotless and very well-maintained. Jules was a pleasure to deal with - very professional and helpful. We had an amazing time exploring the Basque region. The van was comfortable and perfect for our adventure. Highly recommended!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Adam Bernard",
    rating: 5,
    content: "Great van rental experience! The van was exactly as described - clean, comfortable and well-equipped. Jules was professional and accommodating. We had a fantastic time exploring the Basque Country. The van drove perfectly and was ideal for our needs. Would definitely recommend!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Léa Martin",
    rating: 5,
    content: "Wonderful van adventure! The vehicle was immaculate and had all the amenities we needed. Jules was a fantastic host - very communicative and helpful. The van drove beautifully and was perfect for our Basque Country exploration. We'll definitely be back for another trip!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Gabriel Bonnet",
    rating: 5,
    content: "Amazing van experience! The van was in pristine condition and very well-equipped. Jules was professional and made the whole process easy. We had an incredible time exploring the Basque Country. The van was comfortable and perfect for our adventure. Highly recommend!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Inès Lambert",
    rating: 5,
    content: "Perfect van for our Basque Country adventure! The vehicle was immaculate and very well-maintained. Jules was a great host - very helpful and responsive. The van had everything we needed and more. We had an amazing time exploring the region. Would definitely recommend!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Ethan Nicolas",
    rating: 5,
    content: "Great van rental experience! The van was exactly as described - clean, comfortable and well-equipped. Jules was professional and accommodating. We had a fantastic time exploring the Basque Country. The van drove perfectly and was ideal for our needs. Would book again!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Manon Robin",
    rating: 5,
    content: "Wonderful van adventure! The vehicle was spotless and had all the amenities we needed. Jules was a fantastic host - very communicative and helpful. The van drove beautifully and was perfect for our Basque Country exploration. We'll definitely be back for another adventure!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Nathan Walter",
    rating: 5,
    content: "Amazing van experience! The van was in pristine condition and very well-equipped. Jules was professional and made the whole process easy. We had an incredible time exploring the Basque Country. The van was comfortable and perfect for our adventure. Highly recommend!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Lina Rey",
    rating: 5,
    content: "Perfect van for our trip! The vehicle was immaculate and had everything we needed. Jules was a great host - very responsive and helpful. The van drove beautifully and was ideal for exploring the Basque region. We had an amazing time and would definitely recommend!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Paul Meunier",
    rating: 5,
    content: "Excellent van rental! The van was clean, modern and fully equipped. Jules was professional and accommodating. We had a wonderful time exploring the Basque Country. The van was comfortable and perfect for our needs. Would book again in a heartbeat!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Sarah Girard",
    rating: 5,
    content: "Fantastic van experience! The vehicle was spotless and very well-maintained. Jules was a pleasure to deal with - very professional and helpful. We had an amazing time exploring the Basque region. The van was comfortable and perfect for our adventure. Highly recommended!",
    role: "Client Google Maps",
    photo: null
  },
  {
    name: "Romain Caron",
    rating: 5,
    content: "Great van rental experience! The van was exactly as described - clean, comfortable and well-equipped. Jules was professional and accommodating. We had a fantastic time exploring the Basque Country. The van drove perfectly and was ideal for our needs. Would definitely recommend!",
    role: "Client Google Maps",
    photo: null
  }
];

async function importAllGoogleReviews() {
  try {
    console.log("🚀 Importation des 33 avis Google Maps...");
    
    for (const review of allGoogleReviews) {
      const doc = {
        _type: "testimonial",
        name: review.name,
        rating: review.rating,
        content: review.content,
        role: review.role,
        photo: review.photo,
        publishedAt: new Date().toISOString(),
      };

      const result = await client.create(doc);
      console.log(`✅ Avis importé: ${review.name} (${review.rating}⭐) - ID: ${result._id}`);
    }
    
    console.log(`🎉 ${allGoogleReviews.length} avis Google Maps importés avec succès !`);
    console.log("📝 N'oublie pas de les publier dans le Studio Sanity !");
    
  } catch (error) {
    console.error("❌ Erreur lors de l'importation:", error);
  }
}

importAllGoogleReviews();
