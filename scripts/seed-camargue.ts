import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const itineraire = {
  titre: "Road trip 5 jours en Camargue en van",
  region: "Camargue",
  duree: 5,
  style: "découverte",
  interets: ["nature", "flamants roses", "chevaux", "sel", "gastronomie"],
  jours: [
    {
      numero: 1,
      titre: "Arles — Porte de la Camargue",
      spots: [
        { nom: "Arles", description: "Cité romaine au cœur de la Provence, classée UNESCO. Amphithéâtre, arènes et vieille ville à explorer.", type: "culturel", lat: 43.6767, lon: 4.6277, wiki: { excerpt: "Arles est une commune française, sous-préfecture des Bouches-du-Rhône.", url: "https://fr.wikipedia.org/wiki/Arles" } },
        { nom: "Les Alpilles", description: "Massif calcaire aux paysages lunaires, oliviers et lavandes. Vue imprenable depuis les Baux-de-Provence.", type: "nature", lat: 43.7352, lon: 4.8636 }
      ],
      camping: { nom: "Camping Arles", options: ["électricité", "piscine", "wifi"] },
      restaurant: { nom: "Le Gibolin", type: "bistronomique", specialite: "Taureau de Camargue gardiane" }
    },
    {
      numero: 2,
      titre: "Saintes-Maries-de-la-Mer",
      spots: [
        { nom: "Saintes-Maries-de-la-Mer", description: "Village mythique des gitans au bord de la Méditerranée. Plages sauvages et église fortifiée du XIe siècle.", type: "village", lat: 43.4524, lon: 4.4285, wiki: { excerpt: "Les Saintes-Maries-de-la-Mer est une commune française, chef-lieu de canton.", url: "https://fr.wikipedia.org/wiki/Saintes-Maries-de-la-Mer" } },
        { nom: "Plage de Piémanson", description: "Plage sauvage et immense, idéale pour bivouaquer en van face à la mer. Accès libre.", type: "plage", lat: 43.3867, lon: 4.7244 }
      ],
      camping: { nom: "Camping Le Clos du Rhône", options: ["bord de mer", "ombre"] },
      restaurant: { nom: "La Cabane du Passeur", type: "traditionnel", specialite: "Tellines, gardiane de taureau" }
    },
    {
      numero: 3,
      titre: "Parc Natural Régional de Camargue",
      spots: [
        { nom: "Étang de Vaccarès", description: "Plus grand étang d'eau saumâtre de France. Réserve ornithologique exceptionnelle : flamants roses, aigrettes, hérons.", type: "nature", lat: 43.5244, lon: 4.5985, wiki: { excerpt: "L'étang de Vaccarès est un étang de Camargue.", url: "https://fr.wikipedia.org/wiki/%C3%89tang_de_Vaccares" } },
        { nom: "Mas du Pont de Rousty", description: "Musée camarguais dans un mas traditionnel. Histoire de la Camargue, élevage et riziculture.", type: "culturel", lat: 43.5672, lon: 4.5231 }
      ],
      camping: { nom: "Bivouac Étang de Vaccarès", options: ["nature", "gratuit"] },
      restaurant: { nom: "Le Mas de la Fouque", type: "gastronomique", specialite: "Riz de Camargue, taureau en croûte" }
    },
    {
      numero: 4,
      titre: "Aigues-Mortes et les Salins",
      spots: [
        { nom: "Aigues-Mortes", description: "Cité médiévale fortifiée au milieu des étangs. Remparts intacts du XIIIe siècle, tour de Constance.", type: "culturel", lat: 43.5676, lon: 4.1935, wiki: { excerpt: "Aigues-Mortes est une commune française, dans le département du Gard.", url: "https://fr.wikipedia.org/wiki/Aigues-Mortes" } },
        { nom: "Salins du Midi", description: "Immenses marais salants roses, habitat des flamants roses. Visite des salines en petit train.", type: "nature", lat: 43.5128, lon: 4.1432 }
      ],
      camping: { nom: "Camping La Petite Camargue", options: ["piscine", "électricité", "animations"] },
      restaurant: { nom: "L'Escale", type: "brasserie", specialite: "Fruits de mer, fleur de sel" }
    },
    {
      numero: 5,
      titre: "La Camargue des gardians",
      spots: [
        { nom: "Domaine de la Palissade", description: "Réserve naturelle à l'embouchure du Rhône. Promenades à cheval ou à pied parmi les taureaux et chevaux camarguais libres.", type: "nature", lat: 43.3974, lon: 4.8656 },
        { nom: "Le Sambuc", description: "Hameau typique au cœur de la grande Camargue. Manadiers, gardians et rizières à perte de vue.", type: "village", lat: 43.4748, lon: 4.6982 }
      ],
      camping: { nom: "Camping Le Mas de Nicolas", options: ["calme", "nature", "chevaux"] },
      restaurant: { nom: "Le Mas Saint-Germain", type: "fermier", specialite: "Riz camarguais, taureau grillé" }
    }
  ]
};

async function main() {
  const { data, error } = await supabase
    .from("road_trip_requests")
    .insert({
      prenom: "Test",
      email: "test@vanzonexplorer.com",
      region: "Camargue",
      duree: 5,
      style_voyage: "découverte",
      profil_voyageur: "couple",
      periode: "printemps",
      interets: ["nature", "flamants roses", "gastronomie", "histoire"],
      budget: "moyen",
      experience_van: true,
      status: "sent",
      itineraire_json: itineraire,
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
  console.log("✅ Road trip Camargue créé avec ID:", data.id);
}

main();
