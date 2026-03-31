import { adminReadClient } from "@/lib/sanity/adminClient";
import { groq } from "next-sanity";
import CardsManagerClient from "./_components/CardsManagerClient";

// Toujours rendu côté serveur à chaque requête — pas de cache
export const dynamic = "force-dynamic";

const allCardsQuery = groq`
  *[_type == "formationCard"] | order(sortOrder asc, _createdAt asc) {
    _id,
    title,
    description,
    "image": {
      "url": image.asset->url,
      "alt": image.alt
    },
    sortOrder
  }
`;

export type AdminCard = {
  _id: string;
  title: string;
  description?: string;
  image?: { url?: string; alt?: string };
  sortOrder: number;
};

export default async function FormationCartesPage() {
  const cards: AdminCard[] = (await adminReadClient.fetch(allCardsQuery)) ?? [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Van Business Academy</p>
          <h1 className="text-3xl font-black text-slate-900">Cartes Formation</h1>
          <p className="text-slate-500 mt-1">
            {cards.length} carte{cards.length !== 1 ? "s" : ""} — affichées sur la page Formation
          </p>
        </div>
      </div>

      <CardsManagerClient initialCards={cards} />
    </div>
  );
}
