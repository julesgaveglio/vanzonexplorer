import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lewexa74",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: "skG9eGOkn7aRSoOKQlSwq8gybRbrpUDhR276N9iiW867BBPp0rntXFYrg6GJUuvSD4NSwHRJmkza8UBSpS3W4HIAj2kHMSQPpp2eHaZyjxx5AuZRMVEa3FBaEVP0DX6raawrm34WLtAZEX8dDYpk2b5dIwbLVuk5BltksIpDljkJPuwuhFqu",
});

// SEULEMENT les vrais avis Google Maps avec texte
const realReviews = [
  {
    name: "Mathias",
    rating: 5,
    content: "Nous avons passé deux jours merveilleux à bord d'un van aménagé loué auprès de Jules, et nous en gardons un souvenir absolument parfait. Dès le premier contact, Jules a été d'une disponibilité et d'une réactivité exemplaires. Gentillesse, clarté dans les explications, souplesse dans l'organisation : tout a été fluide et très agréable. Le van, quant à lui, est parfaitement aménagé. On sent que chaque détail a été pensé avec soin : de nombreux rangements, un espace de vie bien optimisé, et surtout un lit vraiment confortable qui nous a permis de très bien dormir, même avec une petite fille à bord. Tout l'équipement nécessaire était présent : cuisine équipée, vaisselle, accessoires pratiques… il ne manquait rien pour passer un week-end idéal — et même bien plus si nous étions partis pour plusieurs jours. Ce van est vraiment conçu pour l'itinérance en toute autonomie et dans un confort surprenant. C'est une expérience que nous recommandons les yeux fermés à tous ceux qui souhaitent vivre une escapade en pleine nature, en couple, entre amis ou en famille. Encore merci à Jules pour sa disponibilité et la qualité de son van !",
    date: "2024-05-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "eeva abaiji",
    rating: 5,
    content: "J'ai eu la chance de partir quelques jours en vacances avec le van, et c'était une expérience incroyable du début à la fin ! Le van est super bien équipé, propre, confortable, et parfaitement entretenu. Tout est pensé pour qu'on se sente comme à la maison, même au milieu de la nature. Grâce à lui, j'ai pu vivre un vrai sentiment de liberté et découvrir des lieux magnifiques, en toute autonomie. Un immense merci pour cette aventure inoubliable - je recommande à 100% !",
    date: "2024-04-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Ilana Arroyo",
    rating: 5,
    content: "Une expérience inoubliable avec le van aménagé de Jules! Je suis partie en Espagne récemment, et c'était clairement la meilleure façon de voyager. Le van est incroyable : il a été entièrement aménagé avec un souci du détail impressionnant. Confortable, pratique, et super bien équipé, il ne manque rien : un lit douillet, une cuisine fonctionnelle avec tout le nécessaire, des rangements astucieux, et même des gadgets super pratiques ! Parfait pour les road trips, que ce soit pour la détente ou l'aventure. Je recommande à 100% à tous ceux qui veulent voyager différemment, avec un maximum de liberté et de confort. Merci encore à Jules pour ce van de rêve ! Hâte de repartir pour une nouvelle aventure !",
    date: "2024-11-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Ewan Lacharmoise",
    rating: 5,
    content: "J'ai passé un magnifique week-end de Saint-Valentin grâce à ce van ! Non seulement il est parfaitement fonctionnel, mais en plus, il a attiré l'attention partout où nous sommes passés. Les gens nous arrêtaient sans cesse pour l'admirer et poser des questions, tant il semblait pratique et robuste. Je recommande vivement !",
    date: "2025-02-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Martine Garsia",
    rating: 5,
    content: "8 jours en van dans les montagnes basques, c'était une expérience formidable. Quand on est seule, on peut conduire (pas toujours le monsieur qui a le volant...) et je me suis fait plaisir sur les petites routes. Le van est très performant, facile à conduire. Conduire avec tout à bord pour manger, dormir et laver donne une grande liberté. On prend vite le pli de s'organiser, l'aménagement est génial. En bref ! Un très beau van, tout autant que son propriétaire, Jules et son acolyte Elio. Merci aux trois !",
    date: "2025-08-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Daan van oploo",
    rating: 5,
    content: "Expérience fantastique ! 🚐✨ Jules a été super accueillant, tout était bien expliqué et le van était au top. En bonus, j'ai reçu des conseils en or pour découvrir des endroits magnifiques 🏞️🔥 — merci Jules, à la prochaine ! 🙌",
    date: "2025-06-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Gaël LE BELLEGUI",
    rating: 5,
    content: "Ce van est vraiment bien aménagé et parfait pour un trio de quelques jours. Jules est très sympa. Bonne communication, et démarche de location hyper facile et fluide. Un très chouette week-end père-fils au pays basque :-) À renouveler !",
    date: "2025-08-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Louis Drapé",
    rating: 5,
    content: "Nous avons utilisé ce van d'un très joli vert 🐸pendant les fêtes de bayonne 2024, avec lui c'est camping ⭐️⭐️⭐️⭐️⭐️ ! Je recommande :) dédicace à la caméra de recul qui permet de manœuvrer sans stress 👌🏻🚛",
    date: "2024-06-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Didier Gaveglio",
    rating: 5,
    content: "Super week-end van au Pays basque espagnol, tout était parfait, plein de beaux souvenirs 😀",
    date: "2025-03-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Sylvie Brenot",
    rating: 5,
    content: "Un super week-end à Pasaïa avec le Van qui nous a permis de faire de magnifiques randonnées.",
    date: "2025-03-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Romane Cherault",
    rating: 5,
    content: "Très bon accueil de Jules. Tout était conforme à la description. Le van est bien équipé et facile à conduire. Je recommande.",
    date: "2025-08-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Mathilde DA COSTA",
    rating: 5,
    content: "Un séjour incroyable ! L'aménagement du van est vraiment bien pensé, et la cuisine coulissante à l'extérieur est un vrai plus, ultra pratique au quotidien. Nous avons adoré notre road trip au Pays Basque !",
    date: "2025-02-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Gabriel",
    rating: 5,
    content: "Jules est très sympa et disponible pour toute question ou en cas de souci, le van aménagé est très confortable, tout est bien pensé, on a pu passer un super séjour sur les routes du Pays Basque, je recommande fortement",
    date: "2025-07-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Lisa Labarde",
    rating: 5,
    content: "Très confortable, parfaitement fonctionnel et d'une propreté irréprochable. Le van a rendu notre escapade aussi pratique que magique.",
    date: "2025-08-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "ELIO Dubernet",
    rating: 5,
    content: "J'ai eu la chance de suivre de près la construction du premier van de Jules, un projet réalisé avec beaucoup d'amour. Chaque détail a été pensé avec soin, et le résultat est à la hauteur !! J'ai même eu l'opportunité de le tester en conditions réelles, et franchement, c'est du solide ! Un van qui invite à l'aventure, tout en restant très confortable. Bravo Jules pour ce super travail !",
    date: "2025-04-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Sara Bach",
    rating: 5,
    content: "Très bonne expérience dans ce superbe van vert, très bien aménagé avec tout le nécessaire. C'était un vrai kiff et Jules a été top du début à la fin. On recommande :)",
    date: "2025-05-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Oriane Prévost",
    rating: 5,
    content: "Van très bien équipé, des agencements modernes et bien pensés et un côté pratique parfait pour partir en week-end à bord de ce van. Je recommande à 100% de partir explorer de nouveaux endroits à bord de ce van cet été, beaux souvenirs seront garantis!",
    date: "2025-06-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Aurélie CEDELLE",
    rating: 5,
    content: "Superbe expérience ! Van propre, bien équipé et très confortable. Tout est optimisé pour un séjour parfait. Rien à redire, je recommande à 100 % !",
    date: "2025-03-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Mateo Gimel",
    rating: 5,
    content: "Un van super bien aménagé ! Le propriétaire est super arrangeant et sympa. Je le recommande à 100%",
    date: "2025-03-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Thibaut SIXOU",
    rating: 5,
    content: "Jules est arrangeant et son van est bien pensé pour passer de très bons moments ! Merci à lui",
    date: "2025-05-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Vincent Puyodebat",
    rating: 5,
    content: "Véhicule au top avec toute le confort et les fonctionnalités nécessaires. Je recommande !! Merci",
    date: "2025-05-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "João R",
    rating: 5,
    content: "C'est trop une dinguerie🔥 Si vous hésitez encore, vous risquez de passer à côté des vacances de vos rêves avec ce van!!!",
    date: "2025-06-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Mathilde Sehil",
    rating: 5,
    content: "Je recommande vivement au top super expérience  🔥✨☺️",
    date: "2025-06-01T00:00:00.000Z",
    language: "fr"
  },
  {
    name: "Joris Darnanville",
    rating: 5,
    content: "Merciiii",
    date: "2025-07-01T00:00:00.000Z",
    language: "fr"
  }
];

async function importRealReviews() {
  try {
    console.log("🔍 Importation des VRAIS avis Google Maps (uniquement ceux avec texte)...");
    
    // Supprimer tous les faux témoignages
    console.log("🗑️ Suppression de tous les témoignages existants...");
    const existingTestimonials = await client.fetch('*[_type == "testimonial"]');
    for (const testimonial of existingTestimonials) {
      await client.delete(testimonial._id);
      console.log(`❌ Supprimé: ${testimonial.name}`);
    }
    
    // Importer SEULEMENT les vrais avis
    let importedCount = 0;
    for (const review of realReviews) {
      const doc = {
        _type: "testimonial",
        name: review.name,
        rating: review.rating,
        content: review.content,
        role: "Client Google Maps",
        photo: null,
        publishedAt: review.date,
        source: "google-maps-real",
        language: review.language
      };
      
      await client.create(doc);
      importedCount++;
      console.log(`✅ Importé: ${review.name} (${review.rating}⭐)`);
    }
    
    console.log(`\n🎉 ${importedCount} VRAIS avis Google Maps importés !`);
    console.log("📝 Uniquement les avis avec texte, sans aucune invention");
    console.log("🔗 Va sur http://localhost:3000/studio pour vérifier");
    
  } catch (error) {
    console.error("❌ Erreur lors de l'importation:", error);
  }
}

importRealReviews();
